from django.utils import timezone
from datetime import timedelta

from apps.wallet.models import WalletAccount, WalletLedgerEntry

FRAUD_BUFFER_DAYS = 5


def get_wallet_for_user(user) -> WalletAccount:
    wallet, _ = WalletAccount.objects.get_or_create(user=user)
    return wallet


EARNING_TYPES = (
    WalletLedgerEntry.Type.GIFT_EARNED,
    WalletLedgerEntry.Type.CONTRIBUTION_EARNED,
    WalletLedgerEntry.Type.EVENT_REGISTRATION_EARNED,
)


def get_pending_entries_ready_to_release():
    """Return PENDING earning ledger entries older than FRAUD_BUFFER_DAYS."""
    cutoff = timezone.now() - timedelta(days=FRAUD_BUFFER_DAYS)
    return WalletLedgerEntry.objects.filter(
        type__in=EARNING_TYPES,
        status=WalletLedgerEntry.Status.PENDING,
        created_at__lte=cutoff,
    ).select_related("user")


def get_auto_payout_wallets():
    """Return wallets eligible for auto payout."""
    return WalletAccount.objects.filter(
        payout_mode=WalletAccount.PayoutMode.AUTO,
    ).select_related("user", "user__connect_account")
