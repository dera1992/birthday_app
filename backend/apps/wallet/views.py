from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer

from apps.wallet.selectors import get_wallet_for_user
from apps.wallet.serializers import WalletAccountSerializer, WalletLedgerEntrySerializer, WithdrawSerializer
from apps.wallet.services import execute_withdraw
from apps.wallet.models import WalletLedgerEntry


@extend_schema_view(
    get=extend_schema(responses={200: WalletAccountSerializer}),
    patch=extend_schema(request=WalletAccountSerializer, responses={200: WalletAccountSerializer}),
)
class WalletDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet = get_wallet_for_user(request.user)
        return Response(WalletAccountSerializer(wallet).data)

    def patch(self, request):
        wallet = get_wallet_for_user(request.user)
        serializer = WalletAccountSerializer(wallet, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(WalletAccountSerializer(wallet).data)


@extend_schema_view(
    get=extend_schema(responses={200: WalletLedgerEntrySerializer(many=True)}),
)
class WalletLedgerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entries = WalletLedgerEntry.objects.filter(user=request.user).order_by("-created_at")
        return Response(WalletLedgerEntrySerializer(entries, many=True).data)


@extend_schema_view(
    post=extend_schema(
        request=WithdrawSerializer,
        responses={
            200: inline_serializer(
                name="WithdrawResponse",
                fields={
                    "detail": serializers.CharField(),
                    "stripe_transfer_id": serializers.CharField(),
                    "amount": serializers.DecimalField(max_digits=10, decimal_places=2),
                },
            )
        },
    ),
)
class WalletWithdrawView(APIView):
    """
    POST /api/wallet/withdraw

    Initiates a Stripe Transfer to the user's Connect account.
    Requires completed Connect onboarding (payouts_enabled=True).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WithdrawSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]
        entry = execute_withdraw(request.user, amount)
        return Response(
            {
                "detail": "Payout initiated.",
                "stripe_transfer_id": entry.stripe_transfer_id,
                "amount": str(amount),
            }
        )
