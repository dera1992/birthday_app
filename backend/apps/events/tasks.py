from django.db import transaction
from django.utils import timezone

from celery import shared_task

from apps.events.models import BirthdayEvent
from apps.payments.models import EventPayment
from apps.payments.services import refund_event_payment


@shared_task
def cancel_and_refund_event(event_id: int) -> dict:
    with transaction.atomic():
        event = BirthdayEvent.objects.select_for_update().get(id=event_id)

        if event.state in {
            BirthdayEvent.STATE_LOCKED,
            BirthdayEvent.STATE_CONFIRMED,
            BirthdayEvent.STATE_COMPLETED,
        }:
            return {"event_id": event_id, "status": "skipped_already_locked"}

        event.state = BirthdayEvent.STATE_CANCELLED
        event.save(update_fields=["state", "updated_at"])

        refunded = 0
        payments = EventPayment.objects.select_for_update().filter(
            event=event,
            status=EventPayment.STATUS_HELD_ESCROW,
        )
        for payment in payments:
            try:
                refund_event_payment(payment=payment)
                refunded += 1
            except Exception:
                pass

        return {"event_id": event_id, "status": "cancelled", "refunded_count": refunded}


@shared_task
def scan_lock_deadlines() -> dict:
    now = timezone.now()
    candidates = BirthdayEvent.objects.filter(
        state__in=[BirthdayEvent.STATE_OPEN, BirthdayEvent.STATE_MIN_MET],
        lock_deadline_at__isnull=False,
        lock_deadline_at__lt=now,
    ).only("id", "min_guests", "venue_status", "state")

    queued = 0
    checked = candidates.count()
    for event in candidates:
        approved = event.applications.filter(status=event.applications.model.STATUS_APPROVED).count()
        if event.venue_status != BirthdayEvent.VENUE_CONFIRMED or approved < event.min_guests:
            cancel_and_refund_event.delay(event.id)
            queued += 1

    return {"checked": checked, "queued_cancellations": queued}
