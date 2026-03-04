from django.shortcuts import get_object_or_404

from apps.payments.models import ConnectAccount, EventPayment


def get_event_payment_for_user(event, user) -> EventPayment:
    return get_object_or_404(
        EventPayment.objects.select_related("event", "application", "attendee"),
        event=event,
        attendee=user,
    )


def get_connect_account_by_stripe_id(stripe_account_id: str) -> ConnectAccount:
    return get_object_or_404(ConnectAccount, stripe_account_id=stripe_account_id)
