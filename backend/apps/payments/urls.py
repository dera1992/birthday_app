from django.urls import path

from apps.payments.views import (
    CreateEventPaymentIntentView,
    PaymentHistoryView,
    RequestRefundView,
    StripeWebhookView,
)


urlpatterns = [
    path("events/<int:event_id>/payment/create-intent", CreateEventPaymentIntentView.as_view(), name="event-payment-intent"),
    path("events/<int:event_id>/payment/request-refund", RequestRefundView.as_view(), name="event-payment-refund"),
    path("webhooks/stripe", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("payments/history", PaymentHistoryView.as_view(), name="payment-history"),
]
