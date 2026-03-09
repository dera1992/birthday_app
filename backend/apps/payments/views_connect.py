from django.conf import settings
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer

import stripe
from apps.payments.connect_services import create_account_link, get_or_create_express_account
from apps.payments.serializers_connect import ConnectStatusSerializer
from apps.payments.services import refresh_connect_status, raise_payment_provider_error


@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={
            200: inline_serializer(
                name="ConnectOnboardResponse",
                fields={
                    "onboarding_url": serializers.URLField(),
                    "connect_account": ConnectStatusSerializer(),
                },
            )
        },
    ),
)
class ConnectOnboardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        connect_account = get_or_create_express_account(user=request.user)
        url = create_account_link(
            connect_account=connect_account,
            refresh_url=getattr(settings, "CONNECT_REFRESH_URL", "http://localhost:3000/connect/refresh"),
            return_url=getattr(settings, "CONNECT_RETURN_URL", "http://localhost:3000/connect/return"),
        )
        return Response(
            {
                "onboarding_url": url,
                "connect_account": ConnectStatusSerializer(connect_account).data,
            }
        )


@extend_schema_view(
    get=extend_schema(
        responses={
            200: inline_serializer(
                name="ConnectStatusResponse",
                fields={
                    "has_account": serializers.BooleanField(),
                    "connect_account": ConnectStatusSerializer(required=False, allow_null=True),
                },
            )
        },
    ),
)
class ConnectStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        connect_account = getattr(request.user, "connect_account", None)
        if not connect_account:
            return Response({"has_account": False})
        try:
            connect_account = refresh_connect_status(request.user)
        except Exception:
            pass
        return Response({"has_account": True, "connect_account": ConnectStatusSerializer(connect_account).data})


class ConnectDashboardView(APIView):
    """POST /api/connect/dashboard — returns a one-time login link to the Stripe Express dashboard."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        connect_account = getattr(request.user, "connect_account", None)
        if not connect_account or not connect_account.payouts_enabled:
            return Response({"detail": "Complete Connect onboarding first."}, status=400)
        try:
            link = stripe.Account.create_login_link(connect_account.stripe_account_id)
        except Exception as exc:
            raise_payment_provider_error(exc)
        return Response({"url": link["url"]})
