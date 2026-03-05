from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.birthdays.models import BirthdayProfile, SupportMessage, WishlistReservation
from apps.safety.services import assert_not_blocked


def get_user_display_seed(user) -> str:
    return user.get_full_name() or user.email.split("@")[0] or "birthday-profile"


def generate_unique_profile_slug(user, preferred_slug: str = "") -> str:
    base_slug = slugify(preferred_slug or get_user_display_seed(user))
    slug = base_slug or "birthday-profile"
    counter = 2
    while BirthdayProfile.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def can_view_profile(profile: BirthdayProfile, actor) -> bool:
    if actor.is_authenticated and profile.user_id == actor.id:
        return True
    if actor.is_authenticated:
        assert_not_blocked(actor, profile.user)
    return profile.visibility in {BirthdayProfile.VISIBILITY_PUBLIC, BirthdayProfile.VISIBILITY_LINK_ONLY}


def get_birthday_profile_missing_fields(user) -> list[str]:
    profile = getattr(user, "birthday_profile", None)
    if not profile:
        return ["birthday profile"]

    missing_fields: list[str] = []
    if not profile.bio:
        missing_fields.append("bio")
    if not profile.gender:
        missing_fields.append("gender")
    if not profile.date_of_birth:
        missing_fields.append("date of birth")
    if not profile.marital_status:
        missing_fields.append("marital status")
    if not profile.occupation:
        missing_fields.append("occupation")
    if not (profile.preferences or {}).get("interests"):
        missing_fields.append("interests")
    return missing_fields


def is_birthday_profile_complete(user) -> bool:
    return len(get_birthday_profile_missing_fields(user)) == 0


def assert_completed_birthday_profile(user):
    missing_fields = get_birthday_profile_missing_fields(user)
    if missing_fields:
        raise ValidationError(
            f"Complete your birthday profile before using events. Missing: {', '.join(missing_fields)}."
        )


def moderate_support_message(message: SupportMessage, actor, status_value: str):
    if message.profile.user != actor:
        raise PermissionDenied("Only the profile owner can moderate messages.")
    if status_value not in {SupportMessage.MODERATION_APPROVED, SupportMessage.MODERATION_REJECTED}:
        raise ValidationError("Invalid moderation status.")
    message.moderation_status = status_value
    message.save(update_fields=["moderation_status"])
    return message


def cancel_wishlist_reservation(item, actor, message_body: str = ""):
    reservation = getattr(item, "reservation", None)
    if not reservation:
        raise ValidationError("Item has no active reservation.")
    is_owner = item.profile.user_id == actor.id
    is_reserver = bool(reservation.reserver_email and actor.email and reservation.reserver_email.lower() == actor.email.lower())
    if not is_owner and not is_reserver:
        raise PermissionDenied("Only the profile owner or the original reserver can cancel a reservation.")
    if is_reserver and not is_owner:
        body = message_body.strip() or f"I need to cancel my reservation for '{item.title}'."
        SupportMessage.objects.create(
            profile=item.profile,
            author=actor,
            sender_name=reservation.reserver_name or actor.email,
            body=f"[Reservation cancelled — {item.title}]: {body}",
            moderation_status=SupportMessage.MODERATION_PENDING,
        )
    reservation.delete()
    item.is_reserved = False
    item.save(update_fields=["is_reserved"])
    return item
