import stripe
from rest_framework import permissions, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiTypes, extend_schema, extend_schema_view, inline_serializer

from apps.events.models import BirthdayEvent
from apps.events.selectors import get_application_for_event_user, get_event_by_id
from apps.payments.selectors import get_event_payment_for_user
from apps.payments.services import (
    create_payment_intent_for_application,
    refund_event_payment,
)
from apps.payments.webhooks import parse_stripe_event, process_stripe_event

from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={
            200: inline_serializer(
                name="CreateEventPaymentIntentResponse",
                fields={
                    "payment_id": serializers.IntegerField(),
                    "stripe_payment_intent_id": serializers.CharField(),
                    "client_secret": serializers.CharField(allow_null=True),
                    "status": serializers.CharField(),
                },
            )
        },
    ),
)
class CreateEventPaymentIntentView(APIView):
    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        application = get_application_for_event_user(event, request.user)
        payment, intent = create_payment_intent_for_application(
            event,
            application,
            request.user,
            idempotency_key=request.headers.get("Idempotency-Key"),
        )
        return Response(
            {
                "payment_id": payment.id,
                "stripe_payment_intent_id": payment.stripe_payment_intent_id,
                "client_secret": intent.get("client_secret"),
                "status": payment.status,
            }
        )


@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={
            200: inline_serializer(
                name="RequestRefundResponse",
                fields={"detail": serializers.CharField(), "status": serializers.CharField()},
            )
        },
    ),
)
class RequestRefundView(APIView):
    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        if event.state in {BirthdayEvent.STATE_LOCKED, BirthdayEvent.STATE_CONFIRMED}:
            return Response({"detail": "Refunds are only available pre-lock."}, status=status.HTTP_400_BAD_REQUEST)
        payment = get_event_payment_for_user(event, request.user)
        refund_event_payment(payment)
        return Response({"detail": "Refund requested.", "status": payment.status})


@extend_schema_view(
    post=extend_schema(
        request=OpenApiTypes.OBJECT,
        responses={
            200: inline_serializer(
                name="StripeWebhookResponse",
                fields={"detail": serializers.CharField()},
            )
        },
    ),
)
class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        event = parse_stripe_event(request.body, request.headers.get("Stripe-Signature"))
        processed = process_stripe_event(event)
        return Response({"detail": "Processed." if processed else "Already processed."})


class PaymentHistoryView(APIView):
    """GET /api/payments/history — returns all payments made by the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.gifts.models import GiftPurchase
        from apps.birthdays.models import WishlistContribution
        from apps.payments.models import EventPayment

        user = request.user
        entries = []

        for p in GiftPurchase.objects.select_related("product", "celebrant").filter(
            buyer_user=user, status=GiftPurchase.Status.SUCCEEDED
        ):
            celebrant_name = f"{p.celebrant.first_name} {p.celebrant.last_name}".strip() or p.celebrant.email
            entries.append({
                "id": f"gift-{p.id}",
                "type": "GIFT",
                "description": f"Digital Gift — {p.product.name}",
                "to": celebrant_name,
                "amount": str(p.gross_amount),
                "currency": p.product.currency.upper(),
                "reference": p.stripe_payment_intent_id,
                "created_at": p.created_at.isoformat(),
            })

        for c in WishlistContribution.objects.select_related("item", "item__profile", "item__profile__user").filter(
            contributor=user, status=WishlistContribution.STATUS_SUCCEEDED
        ):
            owner = c.item.profile.user
            celebrant_name = f"{owner.first_name} {owner.last_name}".strip() or owner.email
            entries.append({
                "id": f"contribution-{c.id}",
                "type": "CONTRIBUTION",
                "description": f"Wishlist Contribution — {c.item.title}",
                "to": celebrant_name,
                "amount": str(c.amount),
                "currency": c.currency.upper(),
                "reference": c.stripe_payment_intent_id,
                "created_at": c.created_at.isoformat(),
            })

        for ep in EventPayment.objects.select_related("event").filter(
            attendee=user, status=EventPayment.STATUS_HELD_ESCROW
        ) | EventPayment.objects.select_related("event").filter(
            attendee=user, status=EventPayment.STATUS_RELEASED
        ):
            entries.append({
                "id": f"event-{ep.id}",
                "type": "EVENT_REGISTRATION",
                "description": f"Event Registration — {ep.event.title}",
                "to": ep.event.title,
                "amount": str(ep.amount),
                "currency": ep.currency.upper(),
                "reference": ep.stripe_payment_intent_id,
                "created_at": ep.created_at.isoformat(),
            })

        entries.sort(key=lambda x: x["created_at"], reverse=True)
        return Response(entries)
