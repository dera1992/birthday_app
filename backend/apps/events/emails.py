from django.conf import settings

from apps.events.models import BirthdayEvent, EventApplication
from common.email import send_html_email


def _frontend_url():
    return getattr(settings, "FRONTEND_URL", "http://localhost:3000")


def send_new_application_to_host(event: BirthdayEvent, application: EventApplication):
    applicant = application.applicant
    applicant_name = f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email
    applications_url = f"{_frontend_url()}/events/{event.id}/applications"

    send_html_email(
        subject=f"New application for your event — {event.title}",
        to=event.host.email,
        heading="Someone wants to attend your event",
        body_lines=[
            f"Hi {event.host.first_name or 'there'},",
            f"<strong>{applicant_name}</strong> has applied to attend your event "
            f"<strong>{event.title}</strong>. Review their application and decide whether to approve or decline.",
        ],
        cta_text="Review Application",
        cta_url=applications_url,
    )


def send_application_confirmation_to_applicant(event: BirthdayEvent, application: EventApplication):
    applicant = application.applicant
    event_url = f"{_frontend_url()}/events/{event.id}"

    send_html_email(
        subject=f"Application received — {event.title}",
        to=applicant.email,
        heading="Your application is in!",
        body_lines=[
            f"Hi {applicant.first_name or 'there'},",
            f"We've received your application for <strong>{event.title}</strong>. "
            "The host will review it and you'll hear back soon.",
            "In the meantime, you can view the event details below.",
        ],
        cta_text="View Event",
        cta_url=event_url,
    )


def send_application_approved_to_applicant(event: BirthdayEvent, application: EventApplication):
    applicant = application.applicant
    event_url = f"{_frontend_url()}/events/{event.id}"
    event_date = event.start_at.strftime("%A, %d %B %Y at %H:%M") if event.start_at else "TBC"

    send_html_email(
        subject=f"You're in! — {event.title}",
        to=applicant.email,
        heading="Your application has been approved 🎉",
        body_lines=[
            f"Hi {applicant.first_name or 'there'},",
            f"Great news — the host has approved your application to "
            f"<strong>{event.title}</strong>. We look forward to seeing you there!",
        ],
        cta_text="View Event Details",
        cta_url=event_url,
        details={
            "Event": event.title,
            "Date": event_date,
            "Area": event.approx_area_label or "TBC",
        },
    )


def send_application_declined_to_applicant(event: BirthdayEvent, application: EventApplication):
    applicant = application.applicant
    events_url = f"{_frontend_url()}/events"

    send_html_email(
        subject=f"Application update — {event.title}",
        to=applicant.email,
        heading="Application not taken forward",
        body_lines=[
            f"Hi {applicant.first_name or 'there'},",
            f"Thank you for your interest in <strong>{event.title}</strong>. "
            "Unfortunately, the host has decided not to proceed with your application at this time.",
            "Don't be discouraged — there are plenty of other great events waiting for you.",
        ],
        cta_text="Explore More Events",
        cta_url=events_url,
    )


def send_safety_share(event: BirthdayEvent, attendee, contact_name: str, contact_email: str):
    attendee_name = f"{attendee.first_name} {attendee.last_name}".strip() or attendee.email

    send_html_email(
        subject=f"{attendee_name} has checked in to an event",
        to=contact_email,
        heading="Safety check-in notification",
        body_lines=[
            f"Hi {contact_name},",
            f"<strong>{attendee_name}</strong> has just checked in to an event and wanted you to know their whereabouts.",
        ],
        details={
            "Event": event.title,
            "Date": event.start_at.strftime("%A, %d %B %Y at %H:%M"),
            "Area": event.approx_area_label or "TBC",
            "Venue": event.venue_name or "To be confirmed",
        },
        footer_note="This message was sent automatically at their request. No action is required.",
    )


def send_no_show_notification(event: BirthdayEvent, attendee, fee_percent: int):
    penalty_line = (
        f"As per the event policy, <strong>{fee_percent}% of your deposit will be forfeited</strong>."
        if fee_percent > 0
        else "No deposit penalty applies for this event."
    )
    event_date = event.start_at.strftime("%A, %d %B %Y") if event.start_at else "TBC"

    send_html_email(
        subject=f"No-show recorded — {event.title}",
        to=attendee.email,
        heading="You were marked as a no-show",
        body_lines=[
            f"Hi {attendee.first_name or 'there'},",
            f"You have been marked as a no-show for <strong>{event.title}</strong> "
            f"on <strong>{event_date}</strong>.",
            penalty_line,
            "If you believe this is an error, please contact the event host.",
        ],
    )
