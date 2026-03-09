from django.conf import settings
from django.db import models


class WalletAccount(models.Model):
    class PayoutMode(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        AUTO = "AUTO", "Auto"

    class Frequency(models.TextChoices):
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"
        MONTHLY = "MONTHLY", "Monthly"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet")
    pending_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    available_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payout_mode = models.CharField(max_length=10, choices=PayoutMode.choices, default=PayoutMode.MANUAL)
    auto_payout_frequency = models.CharField(max_length=10, choices=Frequency.choices, default=Frequency.WEEKLY)
    auto_payout_min_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=20)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet({self.user}) pending={self.pending_balance} available={self.available_balance}"


class WalletLedgerEntry(models.Model):
    class Type(models.TextChoices):
        GIFT_EARNED = "GIFT_EARNED", "Gift Earned"
        GIFT_REFUND_REVERSAL = "GIFT_REFUND_REVERSAL", "Gift Refund Reversal"
        CONTRIBUTION_EARNED = "CONTRIBUTION_EARNED", "Contribution Earned"
        EVENT_REGISTRATION_EARNED = "EVENT_REGISTRATION_EARNED", "Event Registration Earned"
        PAYOUT = "PAYOUT", "Payout"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        AVAILABLE = "AVAILABLE", "Available"
        SETTLED = "SETTLED", "Settled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ledger_entries")
    type = models.CharField(max_length=30, choices=Type.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="gbp")
    status = models.CharField(max_length=15, choices=Status.choices)
    source_purchase = models.ForeignKey(
        "gifts.GiftPurchase",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="ledger_entries",
    )
    source_wishlist_contribution = models.ForeignKey(
        "birthdays.WishlistContribution",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="ledger_entries",
    )
    source_event_payment = models.ForeignKey(
        "payments.EventPayment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="ledger_entries",
    )
    stripe_transfer_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ledger({self.user}, {self.type}, {self.amount}, {self.status})"
