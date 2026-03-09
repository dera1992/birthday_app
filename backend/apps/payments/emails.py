from django.conf import settings
from django.core.mail import send_mail
from django.utils.formats import number_format


def _from_email():
    return getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@birthday.local")


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

    send_mail(
        subject=f"Your gift to {celebrant_name} — payment confirmed",
        message=(
            f"Hi {buyer_name},\n\n"
            f"Thank you! Your gift has been sent to {celebrant_name}.\n\n"
            f"  Gift:      {purchase.product.name}\n"
            f"  To:        {celebrant_name}\n"
            f"  Amount:    {_fmt(purchase.gross_amount, purchase.product.currency)}\n"
            f"  Reference: {purchase.stripe_payment_intent_id}\n\n"
            f"View the birthday page: {profile_url}\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[recipient_email],
        fail_silently=True,
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

    send_mail(
        subject=f"Contribution confirmed — {item_name}",
        message=(
            f"Hi {contributor_name},\n\n"
            f"Your contribution to {celebrant_name}'s wishlist has been received.\n\n"
            f"  Item:      {item_name}\n"
            f"  For:       {celebrant_name}\n"
            f"  Amount:    {_fmt(contribution.amount, contribution.currency)}\n"
            f"  Reference: {contribution.stripe_payment_intent_id}\n\n"
            f"View the birthday page: {profile_url}\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[recipient_email],
        fail_silently=True,
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

    send_mail(
        subject=f"Payment confirmed — {event.title}",
        message=(
            f"Hi {attendee_name},\n\n"
            f"Your payment for the following event has been confirmed.\n\n"
            f"  Event:     {event.title}\n"
            f"  Date:      {event_date}\n"
            f"  Amount:    {_fmt(payment.amount, payment.currency)}\n"
            f"  Reference: {payment.stripe_payment_intent_id}\n\n"
            f"View event details: {event_url}\n\n"
            "Funds are held securely until the event is confirmed.\n\n"
            "— Birthday Experiences"
        ),
        from_email=_from_email(),
        recipient_list=[recipient_email],
        fail_silently=True,
    )
