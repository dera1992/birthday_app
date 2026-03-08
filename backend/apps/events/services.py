import secrets

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.events.models import BirthdayEvent, CuratedPack, EventApplication, EventAttendee, EventInvite
from apps.birthdays.services import assert_completed_birthday_profile
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.payments.models import ConnectAccount, EventPayment
from apps.payments.services import refund_event_payment, release_event_transfers
from apps.safety.services import assert_not_blocked


def _frontend_url():
    return getattr(settings, "FRONTEND_URL", "http://localhost:3000")


def apply_pack_defaults(validated_data: dict, pack: CuratedPack) -> dict:
    """
    Merge pack.defaults into validated_data for fields not explicitly provided by the user.
    Only injects fields absent from validated_data.
    """
    defaults = pack.defaults or {}

    field_mapping = {
        "category": "category",
        "min_guests": "min_guests",
        "max_guests": "max_guests",
        "radius_meters": "radius_meters",
        "payment_mode": "payment_mode",
    }
    for pack_key, event_key in field_mapping.items():
        if pack_key in defaults and event_key not in validated_data:
            validated_data[event_key] = defaults[pack_key]

    if "agenda_template" in defaults and "agenda" not in validated_data:
        validated_data["agenda"] = defaults["agenda_template"]

    if "criteria_defaults" in defaults:
        existing_criteria = dict(validated_data.get("criteria") or {})
        for k, v in defaults["criteria_defaults"].items():
            if k not in existing_criteria:
                existing_criteria[k] = v
        validated_data["criteria"] = existing_criteria

    return validated_data


def recompute_event_state(event: BirthdayEvent):
    if event.state not in {BirthdayEvent.STATE_OPEN, BirthdayEvent.STATE_MIN_MET}:
        return event
    event.state = BirthdayEvent.STATE_MIN_MET if event.approved_count >= event.min_guests else BirthdayEvent.STATE_OPEN
    event.save(update_fields=["state", "updated_at"])
    return event


def publish_event(event: BirthdayEvent, actor):
    if event.host != actor:
        raise PermissionDenied("Only the host can publish this event.")
    if event.state != BirthdayEvent.STATE_DRAFT:
        raise ValidationError("Only draft events can be published.")
    event.state = BirthdayEvent.STATE_OPEN
    if not event.payee_user_id:
        event.payee_user = event.host
    event.save(update_fields=["state", "payee_user", "updated_at"])
    return event


def create_event_invite(event: BirthdayEvent, actor, max_uses: int = 0, expires_at=None):
    if event.host != actor:
        raise PermissionDenied("Only the host can create invite codes.")
    if event.visibility != BirthdayEvent.VISIBILITY_INVITE_ONLY:
        raise ValidationError("Invite codes are only available for invite-only events.")
    if event.state == BirthdayEvent.STATE_DRAFT:
        raise ValidationError("Publish the event before creating invite codes.")
    code = _generate_unique_invite_code()
    return EventInvite.objects.create(
        event=event,
        code=code,
        max_uses=max_uses,
        expires_at=expires_at,
    )


def _generate_unique_invite_code():
    while True:
        code = secrets.token_urlsafe(6).upper().replace("-", "").replace("_", "")[:8]
        if not EventInvite.objects.filter(code=code).exists():
            return code


@transaction.atomic
def apply_to_event(event: BirthdayEvent, actor, intro_message: str = "", invite_code: str = ""):
    verification = getattr(actor, "verification", None)
    assert_not_blocked(actor, event.host)
    assert_completed_birthday_profile(actor)
    if not verification or not verification.phone_verified_at:
        raise ValidationError("Phone verification is required to apply.")
    if event.criteria.get("verified_only") and not verification.email_verified_at:
        raise ValidationError("Email verification is required for this event.")
    if event.state not in {BirthdayEvent.STATE_OPEN, BirthdayEvent.STATE_MIN_MET}:
        raise ValidationError("Event is not accepting applications.")
    if EventApplication.objects.filter(event=event, applicant=actor).exists():
        raise ValidationError("You have already applied to this event.")
    _validate_event_criteria(event, actor)
    if event.visibility == BirthdayEvent.VISIBILITY_INVITE_ONLY and not event.expand_to_strangers:
        if not invite_code:
            raise ValidationError("Invite code is required for this event.")
        invite = EventInvite.objects.filter(event=event, code=invite_code).first()
        if not invite:
            raise ValidationError("Invalid invite code.")
        if invite.expires_at and invite.expires_at <= timezone.now():
            raise ValidationError("Invite code has expired.")
        if invite.max_uses and invite.used_count >= invite.max_uses:
            raise ValidationError("Invite code usage limit reached.")
        invite.used_count += 1
        invite.save(update_fields=["used_count"])
    application = EventApplication.objects.create(
        event=event,
        applicant=actor,
        intro_message=intro_message,
        invite_code_used=invite_code or "",
    )
    _notify_new_application(event, application)
    return application


def _notify_new_application(event: BirthdayEvent, application: EventApplication):
    from apps.events.emails import send_new_application_to_host, send_application_confirmation_to_applicant

    applicant = application.applicant
    applicant_name = f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email
    applications_url = f"{_frontend_url()}/events/{event.id}/applications"

    create_notification(
        user=event.host,
        type=Notification.TYPE_APPLICATION_RECEIVED,
        title=f"New application for \"{event.title}\"",
        body=f"{applicant_name} has applied to attend your event.",
        action_url=applications_url,
    )

    def send_emails():
        send_new_application_to_host(event, application)
        send_application_confirmation_to_applicant(event, application)

    transaction.on_commit(send_emails)


def _validate_event_criteria(event: BirthdayEvent, actor):
    criteria = event.criteria or {}
    profile = getattr(actor, "birthday_profile", None)
    allowed_genders = set(criteria.get("allowed_genders") or [])
    if allowed_genders:
        if not profile or not profile.gender:
            raise ValidationError("Complete your gender on your profile before applying to this event.")
        if profile.gender not in allowed_genders:
            raise ValidationError("Your profile does not meet this event's gender requirement.")
    min_age = criteria.get("min_age")
    max_age = criteria.get("max_age")
    if min_age or max_age:
        if not profile or not profile.date_of_birth:
            raise ValidationError("Complete your date of birth on your profile before applying to this event.")
        today = timezone.now().date()
        age = today.year - profile.date_of_birth.year - (
            (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day)
        )
        if min_age and age < int(min_age):
            raise ValidationError(f"This event requires attendees to be at least {min_age}.")
        if max_age and age > int(max_age):
            raise ValidationError(f"This event is limited to attendees aged {max_age} or younger.")
    allowed_marital_statuses = set(criteria.get("allowed_marital_statuses") or [])
    if allowed_marital_statuses:
        if not profile or not profile.marital_status:
            raise ValidationError("Complete your marital status on your profile before applying to this event.")
        if profile.marital_status not in allowed_marital_statuses:
            raise ValidationError("Your profile does not meet this event's marital status requirement.")
    allowed_occupations = {value.strip().lower() for value in (criteria.get("allowed_occupations") or []) if value}
    if allowed_occupations:
        if not profile or not profile.occupation:
            raise ValidationError("Complete your occupation on your profile before applying to this event.")
        if profile.occupation.strip().lower() not in allowed_occupations:
            raise ValidationError("Your profile does not meet this event's occupation requirement.")
    required_interests = set(criteria.get("interests") or criteria.get("tags") or [])
    if required_interests:
        preferences = getattr(profile, "preferences", None) or {}
        user_interests = set(preferences.get("interests", []))
        if not (required_interests & user_interests):
            raise ValidationError(
                f"This event requires at least one of these interests on your profile: "
                f"{', '.join(sorted(required_interests))}."
            )


@transaction.atomic
def approve_application(event: BirthdayEvent, application: EventApplication, actor):
    if event.host != actor:
        raise PermissionDenied("Only the host can approve applications.")
    if application.event_id != event.id:
        raise ValidationError("Application does not belong to the event.")
    if application.status != EventApplication.STATUS_PENDING:
        raise ValidationError("Only pending applications can be approved.")
    if event.approved_count >= event.max_guests:
        raise ValidationError("Event capacity reached.")
    application.status = EventApplication.STATUS_APPROVED
    application.approved_at = timezone.now()
    application.save(update_fields=["status", "approved_at", "updated_at"])
    EventAttendee.objects.get_or_create(event=event, user=application.applicant, defaults={"application": application})
    recompute_event_state(event)

    event_url = f"{_frontend_url()}/events/{event.id}"
    create_notification(
        user=application.applicant,
        type=Notification.TYPE_APPLICATION_APPROVED,
        title=f"Application approved: \"{event.title}\"",
        body="Congratulations! The host has approved your application.",
        action_url=event_url,
    )

    def send_approval_email():
        from apps.events.emails import send_application_approved_to_applicant
        send_application_approved_to_applicant(event, application)

    transaction.on_commit(send_approval_email)
    return application


def decline_application(event: BirthdayEvent, application: EventApplication, actor):
    if event.host != actor:
        raise PermissionDenied("Only the host can decline applications.")
    if application.event_id != event.id:
        raise ValidationError("Application does not belong to the event.")
    if application.status != EventApplication.STATUS_PENDING:
        raise ValidationError("Only pending applications can be declined.")
    application.status = EventApplication.STATUS_DECLINED
    application.save(update_fields=["status", "updated_at"])

    event_url = f"{_frontend_url()}/events/{event.id}"
    create_notification(
        user=application.applicant,
        type=Notification.TYPE_APPLICATION_DECLINED,
        title=f"Application update: \"{event.title}\"",
        body="The host was unable to approve your application this time.",
        action_url=event_url,
    )

    def send_decline_email():
        from apps.events.emails import send_application_declined_to_applicant
        send_application_declined_to_applicant(event, application)

    transaction.on_commit(send_decline_email)
    return application


def toggle_expand(event: BirthdayEvent, actor):
    if event.host != actor:
        raise PermissionDenied("Only the host can toggle discoverability.")
    event.expand_to_strangers = not event.expand_to_strangers
    event.save(update_fields=["expand_to_strangers", "updated_at"])
    return event


def propose_venue(event: BirthdayEvent, actor, venue_name: str):
    if event.host != actor:
        raise PermissionDenied("Only the host can propose a venue.")
    if not venue_name:
        raise ValidationError("venue_name is required.")
    event.venue_status = BirthdayEvent.VENUE_PROPOSED
    event.venue_name = venue_name
    event.save(update_fields=["venue_status", "venue_name", "updated_at"])
    return event


def confirm_venue(event: BirthdayEvent, actor, venue_name: str = ""):
    if event.host != actor:
        raise PermissionDenied("Only the host can confirm the venue.")
    event.venue_status = BirthdayEvent.VENUE_CONFIRMED
    if venue_name:
        event.venue_name = venue_name
    event.save(update_fields=["venue_status", "venue_name", "updated_at"])
    return event


@transaction.atomic
def lock_event(event: BirthdayEvent, actor):
    if event.host != actor:
        raise PermissionDenied("Only the host can lock the event.")
    if timezone.now() > event.lock_deadline_at:
        raise ValidationError("Lock deadline has passed.")
    if event.approved_count < event.min_guests:
        raise ValidationError("Minimum guest count not met.")
    if event.venue_status != BirthdayEvent.VENUE_CONFIRMED:
        raise ValidationError("Venue must be confirmed before lock.")
    if event.payment_mode == BirthdayEvent.PAYMENT_MODE_PAID:
        connect_account = getattr(event.payee_user or event.host, "connect_account", None)
        if not connect_account or not connect_account.payouts_enabled:
            raise ValidationError("Paid events require a connected payout-enabled Stripe account before lock.")
    event.state = BirthdayEvent.STATE_LOCKED
    event.save(update_fields=["state", "updated_at"])
    release_event_transfers(event)
    return event


@transaction.atomic
def cancel_event(event: BirthdayEvent, actor):
    if event.host != actor:
        raise PermissionDenied("Only the host can cancel the event.")
    was_prelock = event.state not in {BirthdayEvent.STATE_LOCKED, BirthdayEvent.STATE_CONFIRMED}
    event.state = BirthdayEvent.STATE_CANCELLED
    event.save(update_fields=["state", "updated_at"])
    if was_prelock:
        for payment in event.payments.filter(status=EventPayment.STATUS_HELD_ESCROW):
            refund_event_payment(payment)
    return event


def complete_event(event: BirthdayEvent, actor):
    if event.host != actor:
        raise PermissionDenied("Only the host can complete the event.")
    if timezone.now() < event.start_at:
        raise ValidationError("Events can only be completed after they have started.")
    event.state = BirthdayEvent.STATE_COMPLETED
    event.save(update_fields=["state", "updated_at"])
    return event


def check_in_attendee(event: BirthdayEvent, actor, contact_name: str = "", contact_email: str = ""):
    """Mark an attendee as checked in. Optionally send a safety share email."""
    if event.state not in {BirthdayEvent.STATE_LOCKED, BirthdayEvent.STATE_CONFIRMED}:
        raise ValidationError("Check-in is only available once the event is locked.")
    attendee = event.attendees.filter(user=actor, status=EventAttendee.STATUS_ACTIVE).first()
    if not attendee:
        raise PermissionDenied("You are not an active attendee of this event.")
    if attendee.checked_in_at:
        raise ValidationError("You have already checked in.")
    attendee.checked_in_at = timezone.now()
    attendee.save(update_fields=["checked_in_at"])
    if contact_name and contact_email:
        from apps.events.emails import send_safety_share
        transaction.on_commit(lambda: send_safety_share(event, actor, contact_name, contact_email))
    return attendee


@transaction.atomic
def mark_no_show(event: BirthdayEvent, attendee_user_id: int, actor):
    """Host marks an attendee as no-show after the event has started."""
    if event.host != actor:
        raise PermissionDenied("Only the host can mark no-shows.")
    if timezone.now() < event.start_at:
        raise ValidationError("No-shows can only be recorded after the event has started.")
    attendee = event.attendees.select_for_update().filter(
        user_id=attendee_user_id, status=EventAttendee.STATUS_ACTIVE
    ).first()
    if not attendee:
        raise ValidationError("Attendee not found or already marked.")
    attendee.status = EventAttendee.STATUS_NO_SHOW
    attendee.save(update_fields=["status"])

    # If their payment is still in escrow (edge case: pre-lock cancel scenario), apply partial refund
    payment = EventPayment.objects.filter(
        event=event, attendee_id=attendee_user_id, status=EventPayment.STATUS_HELD_ESCROW
    ).first()
    if payment and event.no_show_fee_percent > 0:
        from decimal import Decimal
        penalty_ratio = Decimal(event.no_show_fee_percent) / 100
        refund_amount = payment.amount * (1 - penalty_ratio)
        if refund_amount > 0:
            # Partial refund: pass a capped amount to the existing refund service
            payment.amount = refund_amount  # temporary — refund service uses this
            refund_event_payment(payment=payment)

    fee_pct = event.no_show_fee_percent
    attendee_user = attendee.user
    transaction.on_commit(lambda: _send_no_show_email(event, attendee_user, fee_pct))
    return attendee


def _send_no_show_email(event, attendee_user, fee_percent):
    from apps.events.emails import send_no_show_notification
    send_no_show_notification(event, attendee_user, fee_percent)
