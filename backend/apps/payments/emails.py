from django.conf import settings
from django.utils.formats import number_format

from common.email import send_html_email


def _frontend_url():
    return getattr(settings, "FRONTEND_URL", "http://localhost:3000")


def _fmt(amount, currency="GBP"):
    return f"{currency.upper()} {number_format(amount, decimal_pos=2)}"


def send_gift_purchase_invoice(purchase):
    """Invoice email sent to the gift buyer after a successful gift payment."""
    recipient_email = purchase.buyer_email
    if not recipient_email and purchase.buyer:
        recipient_email = purchase.buyer.email
    if not recipient_email:
        return

    buyer_name = purchase.from_name or (
        f"{purchase.buyer.first_name}".strip() if purchase.buyer else "there"
    )
    celebrant_name = (
        f"{purchase.celebrant.first_name} {purchase.celebrant.last_name}".strip()
        or purchase.celebrant.email
    )
    profile_url = f"{_frontend_url()}/birthday/{purchase.celebrant.birthday_profile.slug}"

    send_html_email(
        subject=f"Gift sent to {celebrant_name} — payment confirmed",
        to=recipient_email,
        heading="Your gift has been sent! 🎁",
        body_lines=[
            f"Hi {buyer_name},",
            f"Thank you! Your gift to <strong>{celebrant_name}</strong> has been sent successfully. "
            "Here's a summary of your purchase.",
        ],
        cta_text="View Birthday Page",
        cta_url=profile_url,
        details={
            "Gift": purchase.product.name,
            "To": celebrant_name,
            "Amount": _fmt(purchase.gross_amount, purchase.product.currency),
            "Reference": purchase.stripe_payment_intent_id,
        },
    )


def send_wishlist_contribution_invoice(contribution):
    """Invoice email sent to the contributor after a successful wishlist contribution."""
    recipient_email = contribution.contributor_email
    if not recipient_email and contribution.contributor:
        recipient_email = contribution.contributor.email
    if not recipient_email:
        return

    contributor_name = contribution.contributor_name or "there"
    item_name = contribution.item.title
    profile_owner = contribution.item.profile.user
    celebrant_name = (
        f"{profile_owner.first_name} {profile_owner.last_name}".strip()
        or profile_owner.email
    )
    profile_url = f"{_frontend_url()}/birthday/{contribution.item.profile.slug}"

    send_html_email(
        subject=f"Contribution confirmed — {item_name}",
        to=recipient_email,
        heading="Your contribution has been received! 🎀",
        body_lines=[
            f"Hi {contributor_name},",
            f"Thank you for contributing to <strong>{celebrant_name}'s</strong> wishlist. "
            "Your generosity means a lot!",
        ],
        cta_text="View Birthday Page",
        cta_url=profile_url,
        details={
            "Item": item_name,
            "For": celebrant_name,
            "Amount": _fmt(contribution.amount, contribution.currency),
            "Reference": contribution.stripe_payment_intent_id,
        },
    )


def send_event_registration_invoice(payment):
    """Invoice email sent to the attendee after a successful event registration payment."""
    attendee = payment.attendee
    recipient_email = attendee.email
    if not recipient_email:
        return

    attendee_name = f"{attendee.first_name} {attendee.last_name}".strip() or "there"
    event = payment.event
    event_url = f"{_frontend_url()}/events/{event.id}"
    event_date = event.start_at.strftime("%A, %d %B %Y at %H:%M") if event.start_at else "TBC"

    send_html_email(
        subject=f"Payment confirmed — {event.title}",
        to=recipient_email,
        heading="You're all set! Payment confirmed 🎉",
        body_lines=[
            f"Hi {attendee_name},",
            f"Your payment for <strong>{event.title}</strong> has been confirmed. "
            "Your spot is secured — we look forward to seeing you there!",
        ],
        cta_text="View Event Details",
        cta_url=event_url,
        details={
            "Event": event.title,
            "Date": event_date,
            "Amount": _fmt(payment.amount, payment.currency),
            "Reference": payment.stripe_payment_intent_id,
        },
        footer_note="Funds are held securely and released to the host once the event is confirmed.",
    )
