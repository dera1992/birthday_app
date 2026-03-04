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
