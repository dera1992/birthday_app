from django.conf import settings
from django.db import models


class ConnectAccount(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="connect_account")
    stripe_account_id = models.CharField(max_length=255, unique=True)
    charges_enabled = models.BooleanField(default=False)
    payouts_enabled = models.BooleanField(default=False)
    requirements = models.JSONField(default=dict, blank=True)
    details_submitted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class EventPayment(models.Model):
    STATUS_REQUIRES_PAYMENT = "REQUIRES_PAYMENT"
    STATUS_HELD_ESCROW = "HELD_ESCROW"
    STATUS_RELEASED = "RELEASED"
    STATUS_REFUNDED = "REFUNDED"
    STATUS_FAILED = "FAILED"
    STATUS_CANCELLED = "CANCELLED"
    STATUS_CHOICES = [
        (STATUS_REQUIRES_PAYMENT, "Requires payment"),
        (STATUS_HELD_ESCROW, "Held escrow"),
        (STATUS_RELEASED, "Released"),
        (STATUS_REFUNDED, "Refunded"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    event = models.ForeignKey("events.BirthdayEvent", on_delete=models.CASCADE, related_name="payments")
    attendee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_payments")
    application = models.ForeignKey("events.EventApplication", on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, default="GBP")
    transfer_group = models.CharField(max_length=255, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)
    stripe_transfer_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_REQUIRES_PAYMENT)
    paid_at = models.DateTimeField(null=True, blank=True)
    transferred_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("event", "attendee")


class StripeEventProcessed(models.Model):
    stripe_event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=255)
    processed_at = models.DateTimeField(auto_now_add=True)
