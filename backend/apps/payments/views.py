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
