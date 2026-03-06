from django.conf import settings
from django.core.mail import send_mail

from apps.events.models import BirthdayEvent, EventApplication


def _from_email():
    return getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@birthday.local")


def _frontend_url():
    return getattr(settings, "FRONTEND_URL", "http://localhost:3000")


def send_new_application_to_host(event: BirthdayEvent, application: EventApplication):
    applicant = application.applicant
    applicant_name = f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email
    applications_url = f"{_frontend_url()}/events/{event.id}/applications"
    send_mail(
        subject=f"New application for your event: {event.title}",
        message=(
            f"Hi {event.host.first_name or 'there'},\n\n"
            f"{applicant_name} has applied to attend your event \"{event.title}\".\n\n"
            f"Review the application:\n{applications_url}\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[event.host.email],
        fail_silently=True,
    )


def send_application_confirmation_to_applicant(event: BirthdayEvent, application: EventApplication):
    applicant = application.applicant
    event_url = f"{_frontend_url()}/events/{event.id}"
    send_mail(
        subject=f"Application received: {event.title}",
        message=(
            f"Hi {applicant.first_name or 'there'},\n\n"
            f"Your application to \"{event.title}\" has been received. "
            "The host will review it and get back to you soon.\n\n"
            f"View the event: {event_url}\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[applicant.email],
        fail_silently=True,
    )


def send_application_approved_to_applicant(event: BirthdayEvent, application: EventApplication):
    applicant = application.applicant
    event_url = f"{_frontend_url()}/events/{event.id}"
    send_mail(
        subject=f"You're in! Application approved: {event.title}",
        message=(
            f"Hi {applicant.first_name or 'there'},\n\n"
            f"Great news — your application to \"{event.title}\" has been approved.\n\n"
            f"View the event details: {event_url}\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[applicant.email],
        fail_silently=True,
    )


def send_application_declined_to_applicant(event: BirthdayEvent, application: EventApplication):
    applicant = application.applicant
    send_mail(
        subject=f"Application update: {event.title}",
        message=(
            f"Hi {applicant.first_name or 'there'},\n\n"
            f"Thank you for your interest in \"{event.title}\". "
            "Unfortunately the host has decided not to move forward with your application at this time.\n\n"
            "Keep exploring — there are plenty of other events waiting.\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[applicant.email],
        fail_silently=True,
    )


def send_safety_share(event: BirthdayEvent, attendee, contact_name: str, contact_email: str):
    attendee_name = f"{attendee.first_name} {attendee.last_name}".strip() or attendee.email
    send_mail(
        subject=f"{attendee_name} has checked in to an event",
        message=(
            f"Hi {contact_name},\n\n"
            f"{attendee_name} has just checked in to the following event and wanted you to know:\n\n"
            f"Event: {event.title}\n"
            f"Date: {event.start_at.strftime('%A, %d %B %Y at %H:%M')}\n"
            f"Area: {event.approx_area_label}\n"
            f"Venue: {event.venue_name or 'To be confirmed'}\n\n"
            "This message was sent automatically at their request.\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[contact_email],
        fail_silently=True,
    )


def send_no_show_notification(event: BirthdayEvent, attendee, fee_percent: int):
    penalty_line = (
        f"As per the event policy, {fee_percent}% of your deposit will be forfeited."
        if fee_percent > 0
        else "No deposit penalty applies for this event."
    )
    send_mail(
        subject=f"No-show recorded: {event.title}",
        message=(
            f"Hi {attendee.first_name or 'there'},\n\n"
            f"You have been marked as a no-show for \"{event.title}\" "
            f"on {event.start_at.strftime('%A, %d %B %Y')}.\n\n"
            f"{penalty_line}\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[attendee.email],
        fail_silently=True,
    )
