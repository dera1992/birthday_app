from datetime import date, timedelta

from celery import shared_task
from django.utils import timezone

from apps.birthdays.models import BirthdayProfile, SupportMessage
from apps.notifications.models import Notification
from apps.notifications.services import create_notification


def _already_notified(user_id: int, notif_type: str, action_url: str, year: int) -> bool:
    """Return True if a notification of this type/url was already sent this calendar year."""
    return Notification.objects.filter(
        user_id=user_id,
        type=notif_type,
        action_url=action_url,
        created_at__year=year,
    ).exists()


@shared_task
def send_birthday_reminders() -> dict:
    """
    Daily job: notify celebrants whose birthday is exactly 7 days away so they
    can update their wishlist and profile before friends arrive.
    """
    today = date.today()
    target = today + timedelta(days=7)

    profiles = BirthdayProfile.objects.filter(
        day=target.day,
        month=target.month,
    ).select_related("user")

    sent = 0
    for profile in profiles:
        action_url = f"/birthday/{profile.slug}"
        if _already_notified(profile.user_id, Notification.TYPE_BIRTHDAY_REMINDER, action_url, today.year):
            continue
        create_notification(
            user=profile.user,
            type=Notification.TYPE_BIRTHDAY_REMINDER,
            title="Your birthday is in 7 days!",
            body="Make sure your wishlist and profile are up to date so friends know what to get you.",
            action_url=action_url,
        )
        sent += 1

    return {"sent": sent}


@shared_task
def process_moderation_queue() -> dict:
    """
    Hourly job: for each profile owner with unread PENDING support messages,
    create a single notification (deduplicated per day) so they know to review them.
    """
    today = timezone.now().date()
    cutoff = timezone.now() - timedelta(hours=1)

    # Find profile owners with at least one message that has been pending > 1 hour
    pending_qs = (
        SupportMessage.objects.filter(
            moderation_status=SupportMessage.MODERATION_PENDING,
            created_at__lt=cutoff,
        )
        .select_related("profile__user")
        .order_by("profile_id")
    )

    # Deduplicate per profile owner
    seen_profile_ids: set[int] = set()
    notified = 0

    for msg in pending_qs:
        profile = msg.profile
        if profile.id in seen_profile_ids:
            continue
        seen_profile_ids.add(profile.id)

        action_url = f"/birthday/{profile.slug}/messages"
        if _already_notified(profile.user_id, Notification.TYPE_MODERATION_PENDING, action_url, today.year):
            # Check same day to allow daily re-notification
            if Notification.objects.filter(
                user_id=profile.user_id,
                type=Notification.TYPE_MODERATION_PENDING,
                action_url=action_url,
                created_at__date=today,
            ).exists():
                continue

        pending_count = SupportMessage.objects.filter(
            profile=profile,
            moderation_status=SupportMessage.MODERATION_PENDING,
        ).count()

        create_notification(
            user=profile.user,
            type=Notification.TYPE_MODERATION_PENDING,
            title=f"You have {pending_count} message{'s' if pending_count != 1 else ''} awaiting review",
            body="Visit your birthday page to approve or reject messages from supporters.",
            action_url=action_url,
        )
        notified += 1

    return {"notified": notified}
