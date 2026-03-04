from celery import shared_task

from apps.wallet.selectors import get_pending_entries_ready_to_release, get_auto_payout_wallets
from apps.wallet.services import execute_withdraw, release_pending_entry


@shared_task
def release_fraud_buffer_entries() -> dict:
    """
    Daily job: move PENDING wallet entries older than 5 days → AVAILABLE.
    This lifts the fraud buffer and makes funds withdrawable.
    """
    entries = get_pending_entries_ready_to_release()
    released = 0
    for entry in entries:
        try:
            release_pending_entry(entry)
            released += 1
        except Exception:
            pass
    return {"released": released}


@shared_task
def run_auto_payouts() -> dict:
    """
    Daily job: for AUTO payout wallets whose available_balance >= threshold,
    initiate a Stripe Transfer automatically.
    """
    wallets = get_auto_payout_wallets()
    initiated = 0
    skipped = 0
    for wallet in wallets:
        if wallet.available_balance < wallet.auto_payout_min_threshold:
            skipped += 1
            continue
        try:
            execute_withdraw(wallet.user, wallet.available_balance)
            initiated += 1
        except Exception:
            skipped += 1
    return {"initiated": initiated, "skipped": skipped}
