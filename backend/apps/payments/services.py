from decimal import Decimal

import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.events.models import BirthdayEvent, EventApplication
from apps.birthdays.models import SupportContribution
from apps.payments.models import ConnectAccount, EventPayment


stripe.api_key = settings.STRIPE_SECRET_KEY


def raise_payment_provider_error(exc: Exception):
    if isinstance(exc, stripe.error.AuthenticationError):
        raise ValidationError("Stripe is not configured correctly. Add a valid STRIPE_SECRET_KEY in backend/.env.")
    if isinstance(exc, stripe.error.StripeError):
        raise ValidationError(str(exc.user_message or "Stripe request failed."))
    raise exc


def to_minor_units(amount: Decimal, currency: str) -> int:
    return int(Decimal(amount) * 100)


def get_or_create_connect_account(user):
    account = getattr(user, "connect_account", None)
    if account:
        return account
    try:
        stripe_account = stripe.Account.create(type="express", capabilities={"transfers": {"requested": True}})
    except Exception as exc:
        raise_payment_provider_error(exc)
    return ConnectAccount.objects.create(user=user, stripe_account_id=stripe_account["id"])


def create_connect_onboarding_link(user):
    account = get_or_create_connect_account(user)
    try:
        link = stripe.AccountLink.create(
            account=account.stripe_account_id,
            refresh_url=settings.STRIPE_CONNECT_REFRESH_URL,
            return_url=settings.STRIPE_CONNECT_RETURN_URL,
            type="account_onboarding",
        )
    except Exception as exc:
        raise_payment_provider_error(exc)
    return account, link["url"]


def refresh_connect_status(user):
    account = getattr(user, "connect_account", None)
    if not account:
        raise ValidationError("Host has not started Connect onboarding.")
    try:
        stripe_account = stripe.Account.retrieve(account.stripe_account_id)
    except Exception as exc:
        raise_payment_provider_error(exc)
    account.charges_enabled = stripe_account.get("charges_enabled", False)
    account.payouts_enabled = stripe_account.get("payouts_enabled", False)
    account.details_submitted = stripe_account.get("details_submitted", False)
    account.requirements = stripe_account.get("requirements", {})
    account.save(
        update_fields=["charges_enabled", "payouts_enabled", "details_submitted", "requirements", "updated_at"]
    )
    return account


@transaction.atomic
def create_payment_intent_for_application(event: BirthdayEvent, application: EventApplication, user, idempotency_key=None):
    if application.applicant_id != user.id:
        raise ValidationError("You can only create a payment intent for your own application.")
    if application.status != EventApplication.STATUS_APPROVED:
        raise ValidationError("Application must be approved before payment.")
    if event.payment_mode == BirthdayEvent.PAYMENT_MODE_FREE:
        raise ValidationError("This event does not require payment.")
    payment, _ = EventPayment.objects.get_or_create(
        event=event,
        attendee=user,
        defaults={
            "application": application,
            "amount": event.amount,
            "currency": event.currency,
            "transfer_group": f"event_{event.id}",
        },
    )
    if payment.stripe_payment_intent_id:
        try:
            intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_intent_id)
        except Exception as exc:
            raise_payment_provider_error(exc)
        return payment, intent
    amount_minor = to_minor_units(event.amount, event.currency)
    application_fee_amount = int(amount_minor * Decimal(settings.STRIPE_PLATFORM_FEE_PERCENT) / 100)
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_minor,
            currency=event.currency.lower(),
            transfer_group=f"event_{event.id}",
            application_fee_amount=application_fee_amount,
            metadata={"event_id": str(event.id), "application_id": str(application.id), "attendee_id": str(user.id)},
            idempotency_key=idempotency_key,
        )
    except Exception as exc:
        raise_payment_provider_error(exc)
    payment.stripe_payment_intent_id = intent["id"]
    payment.application = application
    payment.status = EventPayment.STATUS_REQUIRES_PAYMENT
    payment.save(update_fields=["stripe_payment_intent_id", "application", "status", "updated_at"])
    return payment, intent


def sync_payment_intent_succeeded(payment: EventPayment, payment_intent: dict):
    payment.stripe_charge_id = payment_intent.get("latest_charge") or payment.stripe_charge_id
    payment.status = EventPayment.STATUS_HELD_ESCROW
    payment.paid_at = timezone.now()
    payment.last_error = ""
    payment.save(update_fields=["stripe_charge_id", "status", "paid_at", "last_error", "updated_at"])


def sync_payment_intent_failed(payment: EventPayment, payment_intent: dict, status_value: str):
    payment.status = status_value
    payment.last_error = payment_intent.get("last_payment_error", {}).get("message", "")
    payment.save(update_fields=["status", "last_error", "updated_at"])


def refund_event_payment(payment: EventPayment):
    if payment.status not in {EventPayment.STATUS_HELD_ESCROW, EventPayment.STATUS_REQUIRES_PAYMENT}:
        return payment
    if payment.stripe_charge_id:
        try:
            stripe.Refund.create(charge=payment.stripe_charge_id)
        except Exception as exc:
            raise_payment_provider_error(exc)
    payment.status = EventPayment.STATUS_REFUNDED
    payment.refunded_at = timezone.now()
    payment.save(update_fields=["status", "refunded_at", "updated_at"])
    return payment


def create_support_contribution_payment_intent(contribution: SupportContribution, idempotency_key=None):
    if contribution.stripe_payment_intent_id:
        try:
            intent = stripe.PaymentIntent.retrieve(contribution.stripe_payment_intent_id)
        except Exception as exc:
            raise_payment_provider_error(exc)
        return contribution, intent
    try:
        intent = stripe.PaymentIntent.create(
            amount=to_minor_units(contribution.amount, contribution.currency),
            currency=contribution.currency.lower(),
            metadata={
                "type": "support_contribution",
                "contribution_id": str(contribution.id),
                "profile_id": str(contribution.profile_id),
            },
            idempotency_key=idempotency_key,
        )
    except Exception as exc:
        raise_payment_provider_error(exc)
    contribution.stripe_payment_intent_id = intent["id"]
    contribution.save(update_fields=["stripe_payment_intent_id"])
    return contribution, intent


def sync_support_contribution_status(contribution: SupportContribution, status_value: str, last_error: str = ""):
    contribution.status = status_value
    contribution.last_error = last_error
    contribution.save(update_fields=["status", "last_error"])
    return contribution


def release_event_transfers(event: BirthdayEvent):
    payee = event.payee_user or event.host
    connect_account = getattr(payee, "connect_account", None)
    if not connect_account:
        raise ValidationError("Host must complete Connect onboarding before funds can be released.")
    for payment in event.payments.filter(status=EventPayment.STATUS_HELD_ESCROW, stripe_transfer_id=""):
        try:
            transfer = stripe.Transfer.create(
                amount=to_minor_units(payment.amount, payment.currency),
                currency=payment.currency.lower(),
                destination=connect_account.stripe_account_id,
                transfer_group=payment.transfer_group or f"event_{event.id}",
                source_transaction=payment.stripe_charge_id,
            )
        except Exception as exc:
            raise_payment_provider_error(exc)
        payment.stripe_transfer_id = transfer["id"]
        payment.status = EventPayment.STATUS_RELEASED
        payment.transferred_at = timezone.now()
        payment.save(update_fields=["stripe_transfer_id", "status", "transferred_at", "updated_at"])
