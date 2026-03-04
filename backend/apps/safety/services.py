from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.safety.models import UserBlock


def is_blocked_between(user_a, user_b) -> bool:
    if not user_a or not user_b or not getattr(user_a, "is_authenticated", False):
        return False
    return UserBlock.objects.filter(
        Q(blocker=user_a, blocked=user_b) | Q(blocker=user_b, blocked=user_a)
    ).exists()


def assert_not_blocked(user_a, user_b):
    if is_blocked_between(user_a, user_b):
        raise PermissionDenied("This action is not allowed because one of the users has blocked the other.")


def validate_event_rating_permissions(event, user):
    if event.state != event.STATE_COMPLETED:
        raise ValidationError("Ratings are only allowed after an event is completed.")
    attended = event.attendees.filter(user=user).exists() or event.applications.filter(
        applicant=user,
        status=event.applications.model.STATUS_APPROVED,
    ).exists()
    if not attended:
        raise PermissionDenied("Only attendees can rate an event.")
