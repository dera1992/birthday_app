from decimal import Decimal

import stripe
from django.conf import settings
from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from apps.gifts.models import GiftPurchase
from apps.payments.services import raise_payment_provider_error, to_minor_units
from apps.wallet.models import WalletAccount, WalletLedgerEntry


stripe.api_key = settings.STRIPE_SECRET_KEY


def get_or_create_wallet(user) -> WalletAccount:
    wallet, _ = WalletAccount.objects.get_or_create(user=user)
    return wallet


@transaction.atomic
def credit_gift_earned(purchase: GiftPurchase) -> WalletLedgerEntry:
    """Called after payment_intent.succeeded for a gift_purchase.
    Creates a PENDING ledger entry and bumps pending_balance."""
    wallet = get_or_create_wallet(purchase.celebrant)
    entry = WalletLedgerEntry.objects.create(
        user=purchase.celebrant,
        type=WalletLedgerEntry.Type.GIFT_EARNED,
        amount=purchase.celebrant_amount,
        currency=purchase.product.currency,
        status=WalletLedgerEntry.Status.PENDING,
        source_purchase=purchase,
    )
    WalletAccount.objects.filter(pk=wallet.pk).update(
        pending_balance=F("pending_balance") + purchase.celebrant_amount
    )
    return entry


@transaction.atomic
def credit_contribution_earned(contribution) -> WalletLedgerEntry:
    """Called after payment_intent.succeeded for a wishlist_contribution.
    Credits celebrant_amount (gross minus platform fee) to the profile owner's wallet."""
    owner = contribution.item.profile.user
    wallet = get_or_create_wallet(owner)
    credit = contribution.celebrant_amount if contribution.celebrant_amount else contribution.amount
    entry = WalletLedgerEntry.objects.create(
        user=owner,
        type=WalletLedgerEntry.Type.CONTRIBUTION_EARNED,
        amount=credit,
        currency=contribution.currency.lower(),
        status=WalletLedgerEntry.Status.PENDING,
        source_wishlist_contribution=contribution,
    )
    WalletAccount.objects.filter(pk=wallet.pk).update(
        pending_balance=F("pending_balance") + credit
    )
    return entry


@transaction.atomic
def credit_event_payment_earned(payment) -> WalletLedgerEntry:
    """Called after payment_intent.succeeded for an event payment.
    Credits celebrant_amount (gross minus platform fee) to the event host's wallet."""
    event = payment.event
    owner = event.payee_user or event.host
    wallet = get_or_create_wallet(owner)
    credit = payment.celebrant_amount if payment.celebrant_amount else payment.amount
    entry = WalletLedgerEntry.objects.create(
        user=owner,
        type=WalletLedgerEntry.Type.EVENT_REGISTRATION_EARNED,
        amount=credit,
        currency=payment.currency.lower(),
        status=WalletLedgerEntry.Status.PENDING,
        source_event_payment=payment,
    )
    WalletAccount.objects.filter(pk=wallet.pk).update(
        pending_balance=F("pending_balance") + credit
    )
    return entry


@transaction.atomic
def release_pending_entry(entry: WalletLedgerEntry) -> WalletLedgerEntry:
    """Move a PENDING ledger entry to AVAILABLE (fraud buffer lifted)."""
    if entry.status != WalletLedgerEntry.Status.PENDING:
        return entry
    wallet = WalletAccount.objects.select_for_update().get(user=entry.user)
    WalletAccount.objects.filter(pk=wallet.pk).update(
        pending_balance=F("pending_balance") - entry.amount,
        available_balance=F("available_balance") + entry.amount,
    )
    entry.status = WalletLedgerEntry.Status.AVAILABLE
    entry.save(update_fields=["status"])
    return entry


@transaction.atomic
def execute_withdraw(user, requested_amount: Decimal) -> WalletLedgerEntry:
    """Initiate a Stripe Transfer from platform to celebrant's Connect account."""
    wallet = WalletAccount.objects.select_for_update().get(user=user)
    if wallet.available_balance < requested_amount:
        raise ValidationError("Insufficient available balance.")

    connect_account = getattr(user, "connect_account", None)
    if not connect_account or not connect_account.payouts_enabled:
        raise ValidationError("Stripe Connect payouts are not enabled. Complete Connect onboarding first.")

    try:
        transfer = stripe.Transfer.create(
            amount=to_minor_units(requested_amount, "gbp"),
            currency="gbp",
            destination=connect_account.stripe_account_id,
        )
    except Exception as exc:
        raise_payment_provider_error(exc)

    wallet.available_balance -= requested_amount
    wallet.save(update_fields=["available_balance", "updated_at"])

    entry = WalletLedgerEntry.objects.create(
        user=user,
        type=WalletLedgerEntry.Type.PAYOUT,
        amount=-requested_amount,
        currency="gbp",
        status=WalletLedgerEntry.Status.SETTLED,
        stripe_transfer_id=transfer["id"],
    )
    return entry
