from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer

from apps.birthdays.selectors import get_profile_by_slug
from apps.gifts.selectors import get_active_products, get_product_by_slug, get_public_gifts_for_profile
from apps.gifts.serializers import GiftProductSerializer, GiftPurchaseCreateSerializer, GiftPurchaseReadSerializer
from apps.gifts.services import create_gift_payment_intent


@extend_schema_view(
    get=extend_schema(responses={200: GiftProductSerializer(many=True)}),
)
class GiftProductListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        products = get_active_products()
        return Response(GiftProductSerializer(products, many=True).data)


@extend_schema_view(
    get=extend_schema(responses={200: GiftPurchaseReadSerializer(many=True)}),
)
class PublicGiftListView(APIView):
    """Return all PUBLIC + SUCCEEDED gifts on a birthday profile."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        profile = get_profile_by_slug(slug)
        gifts = get_public_gifts_for_profile(profile)
        return Response(GiftPurchaseReadSerializer(gifts, many=True).data)


@extend_schema_view(
    post=extend_schema(
        request=GiftPurchaseCreateSerializer,
        responses={
            201: inline_serializer(
                name="GiftPurchaseIntentResponse",
                fields={
                    "purchase": GiftPurchaseReadSerializer(),
                    "client_secret": serializers.CharField(),
                },
            )
        },
    ),
)
class GiftCreateIntentView(APIView):
    """
    POST /api/birthday-profile/{slug}/gifts/create-intent

    Creates a GiftPurchase (PENDING) and returns a Stripe client_secret.
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope = "contributions"

    def post(self, request, slug):
        profile = get_profile_by_slug(slug)
        serializer = GiftPurchaseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product = get_product_by_slug(data["product_slug"])

        buyer_user = request.user if request.user.is_authenticated else None
        purchase, intent = create_gift_payment_intent(
            product=product,
            birthday_profile=profile,
            buyer_user=buyer_user,
            buyer_name=data["buyer_name"],
            buyer_email=data["buyer_email"],
            custom_message=data["custom_message"],
            from_name=data["from_name"],
            visibility=data["visibility"],
            idempotency_key=request.headers.get("Idempotency-Key"),
        )

        return Response(
            {
                "purchase": GiftPurchaseReadSerializer(purchase).data,
                "client_secret": intent.get("client_secret"),
            },
            status=status.HTTP_201_CREATED,
        )
