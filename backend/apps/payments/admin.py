from django.contrib import admin

from apps.payments.models import ConnectAccount, EventPayment, StripeEventProcessed


@admin.register(ConnectAccount)
class ConnectAccountAdmin(admin.ModelAdmin):
    list_display = ("user", "stripe_account_id", "charges_enabled", "payouts_enabled", "details_submitted", "updated_at")
    search_fields = ("user__username", "user__email", "stripe_account_id")
    list_filter = ("charges_enabled", "payouts_enabled", "details_submitted")


@admin.register(EventPayment)
class EventPaymentAdmin(admin.ModelAdmin):
    list_display = ("event", "attendee", "amount", "currency", "status", "stripe_payment_intent_id", "stripe_transfer_id")
    search_fields = ("event__title", "attendee__username", "stripe_payment_intent_id", "stripe_charge_id", "stripe_transfer_id")
    list_filter = ("status", "currency")


@admin.register(StripeEventProcessed)
class StripeEventProcessedAdmin(admin.ModelAdmin):
    list_display = ("stripe_event_id", "event_type", "processed_at")
    search_fields = ("stripe_event_id", "event_type")
