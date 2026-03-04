import json

import stripe
from django.conf import settings

from apps.payments.models import EventPayment, StripeEventProcessed
from apps.payments.selectors import get_connect_account_by_stripe_id
from apps.payments.services import (
    sync_payment_intent_failed,
    sync_payment_intent_succeeded,
    sync_support_contribution_status,
)
from apps.birthdays.models import SupportContribution
from apps.gifts.models import GiftPurchase
from apps.gifts.services import mark_gift_purchase_succeeded, mark_gift_purchase_failed
from apps.wallet.services import credit_gift_earned


stripe.api_key = settings.STRIPE_SECRET_KEY


def parse_stripe_event(payload: bytes, signature: str | None):
    if settings.STRIPE_WEBHOOK_SECRET and signature:
        return stripe.Webhook.construct_event(payload=payload, sig_header=signature, secret=settings.STRIPE_WEBHOOK_SECRET)
    return json.loads(payload.decode("utf-8") or "{}")


def handle_payment_intent_succeeded(data_object: dict):
    metadata_type = data_object.get("metadata", {}).get("type")

    if metadata_type == "support_contribution":
        contribution = SupportContribution.objects.get(stripe_payment_intent_id=data_object["id"])
        sync_support_contribution_status(contribution, SupportContribution.STATUS_SUCCEEDED)
        return

    if metadata_type == "gift_purchase":
        purchase = GiftPurchase.objects.select_related("celebrant", "product").get(
            stripe_payment_intent_id=data_object["id"]
        )
        mark_gift_purchase_succeeded(purchase, charge_id=data_object.get("latest_charge", ""))
        credit_gift_earned(purchase)
        return

    payment = EventPayment.objects.get(stripe_payment_intent_id=data_object["id"])
    sync_payment_intent_succeeded(payment, data_object)


def handle_payment_intent_failed(data_object: dict):
    metadata_type = data_object.get("metadata", {}).get("type")

    if metadata_type == "support_contribution":
        contribution = SupportContribution.objects.get(stripe_payment_intent_id=data_object["id"])
        sync_support_contribution_status(
            contribution,
            SupportContribution.STATUS_FAILED,
            data_object.get("last_payment_error", {}).get("message", ""),
        )
        return

    if metadata_type == "gift_purchase":
        purchase = GiftPurchase.objects.get(stripe_payment_intent_id=data_object["id"])
        mark_gift_purchase_failed(purchase)
        return

    payment = EventPayment.objects.get(stripe_payment_intent_id=data_object["id"])
    sync_payment_intent_failed(payment, data_object, EventPayment.STATUS_FAILED)


def handle_payment_intent_canceled(data_object: dict):
    metadata_type = data_object.get("metadata", {}).get("type")

    if metadata_type == "support_contribution":
        contribution = SupportContribution.objects.get(stripe_payment_intent_id=data_object["id"])
        sync_support_contribution_status(contribution, SupportContribution.STATUS_CANCELLED)
        return

    if metadata_type == "gift_purchase":
        purchase = GiftPurchase.objects.get(stripe_payment_intent_id=data_object["id"])
        mark_gift_purchase_failed(purchase)
        return

    payment = EventPayment.objects.get(stripe_payment_intent_id=data_object["id"])
    sync_payment_intent_failed(payment, data_object, EventPayment.STATUS_CANCELLED)


def handle_account_updated(data_object: dict):
    connect_account = get_connect_account_by_stripe_id(data_object["id"])
    connect_account.charges_enabled = data_object.get("charges_enabled", False)
    connect_account.payouts_enabled = data_object.get("payouts_enabled", False)
    connect_account.requirements = data_object.get("requirements", {})
    connect_account.details_submitted = data_object.get("details_submitted", False)
    connect_account.save(
        update_fields=["charges_enabled", "payouts_enabled", "requirements", "details_submitted", "updated_at"]
    )


EVENT_HANDLERS = {
    "payment_intent.succeeded": handle_payment_intent_succeeded,
    "payment_intent.payment_failed": handle_payment_intent_failed,
    "payment_intent.canceled": handle_payment_intent_canceled,
    "account.updated": handle_account_updated,
}


def process_stripe_event(event: dict):
    if StripeEventProcessed.objects.filter(stripe_event_id=event["id"]).exists():
        return False
    event_type = event["type"]
    handler = EVENT_HANDLERS.get(event_type)
    if handler:
        handler(event["data"]["object"])
    StripeEventProcessed.objects.create(stripe_event_id=event["id"], event_type=event_type)
    return True
