from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from celery import shared_task

from apps.events.models import BirthdayEvent, EventAttendee
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
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
def send_event_reminders() -> dict:
    """
    Hourly job: notify approved attendees whose event starts in 20–28 hours.
    The 8-hour window ensures we catch any events that slipped between runs.
    Deduplication prevents double-sending if the task runs multiple times.
    """
    now = timezone.now()
    window_start = now + timedelta(hours=20)
    window_end = now + timedelta(hours=28)

    upcoming = BirthdayEvent.objects.filter(
        state__in=[BirthdayEvent.STATE_LOCKED, BirthdayEvent.STATE_CONFIRMED, BirthdayEvent.STATE_MIN_MET],
        start_at__gte=window_start,
        start_at__lte=window_end,
    ).prefetch_related("attendees__user")

    sent = 0
    for event in upcoming:
        action_url = f"/events/{event.id}"
        active_attendees = event.attendees.filter(status=EventAttendee.STATUS_ACTIVE).select_related("user")
        for attendee in active_attendees:
            already_sent = Notification.objects.filter(
                user_id=attendee.user_id,
                type=Notification.TYPE_EVENT_REMINDER,
                action_url=action_url,
            ).exists()
            if already_sent:
                continue
            create_notification(
                user=attendee.user,
                type=Notification.TYPE_EVENT_REMINDER,
                title=f"Reminder: {event.title} is tomorrow",
                body=f"Your event starts at {event.start_at.strftime('%H:%M')} — make sure you're ready!",
                action_url=action_url,
            )
            sent += 1

    return {"sent": sent}


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
