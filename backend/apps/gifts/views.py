from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.birthdays.selectors import get_profile_by_slug
from apps.gifts.access import assert_gift_purchase_access
from apps.gifts.ai_services import select_generated_option
from apps.gifts.engine import resolve_customization_schema
from apps.gifts.rendering import build_purchase_snapshot_svg
from apps.gifts.selectors import get_active_products, get_product_by_slug, get_purchase_by_id, get_visible_gifts_for_profile
from apps.gifts.serializers import (
    AIGenerationStatusSerializer,
    AISelectOptionSerializer,
    GiftProductSerializer,
    GiftPurchaseCreateSerializer,
    GiftPurchaseReadSerializer,
)
from apps.gifts.services import create_gift_payment_intent


@extend_schema_view(
    get=extend_schema(responses={200: GiftProductSerializer(many=True)}),
)
class GiftProductListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        category = request.query_params.get("category")
        products = get_active_products(category=category)
        return Response(GiftProductSerializer(products, many=True, context={"request": request}).data)


@extend_schema_view(
    get=extend_schema(responses={200: GiftProductSerializer}),
)
class GiftProductDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        product = get_product_by_slug(slug)
        return Response(GiftProductSerializer(product, context={"request": request}).data)


@extend_schema_view(
    get=extend_schema(responses={200: GiftPurchaseReadSerializer(many=True)}),
)
class PublicGiftListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        profile = get_profile_by_slug(slug)
        is_owner = bool(request.user.is_authenticated and request.user == profile.user)
        gifts = get_visible_gifts_for_profile(profile, include_private=is_owner)
        return Response(GiftPurchaseReadSerializer(gifts, many=True, context={"request": request}).data)


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
    permission_classes = [permissions.AllowAny]
    throttle_scope = "contributions"

    def post(self, request, slug):
        profile = get_profile_by_slug(slug)
        serializer = GiftPurchaseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product = get_product_by_slug(data["product_slug"])
        customization_data = serializer.validate_customization_payload(product)
        if data.get("is_anonymous") and not product.allow_anonymous_sender:
            raise serializers.ValidationError({"is_anonymous": "Anonymous sending is disabled for this gift."})

        schema_fields = {field["name"] for field in resolve_customization_schema(product).get("fields", [])}
        from_name = data["from_name"] or customization_data.get("sender_name") or customization_data.get("from_name") or ""
        custom_message = data["custom_message"] or customization_data.get("message") or customization_data.get("custom_message") or ""

        if data.get("is_anonymous"):
            from_name = ""
            if "sender_name" in schema_fields:
                customization_data["sender_name"] = ""
            if "from_name" in schema_fields:
                customization_data["from_name"] = ""

        # For AI gifts, extract prompt input from request
        ai_prompt_input: dict = data.get("ai_prompt_input") or {}
        if product.is_ai_generated_product and not ai_prompt_input:
            # Fall back to customization_data if ai_prompt_input not separately supplied
            ai_prompt_input = dict(data.get("customization_data") or {})

        buyer_user = request.user if request.user.is_authenticated else None
        purchase, intent = create_gift_payment_intent(
            product=product,
            birthday_profile=profile,
            buyer_user=buyer_user,
            buyer_name=data["buyer_name"],
            buyer_email=data["buyer_email"],
            custom_message=custom_message,
            from_name=from_name,
            customization_data=customization_data,
            is_anonymous=data["is_anonymous"],
            visibility=data["visibility"],
            idempotency_key=request.headers.get("Idempotency-Key"),
            ai_prompt_input=ai_prompt_input,
        )

        return Response(
            {
                "purchase": GiftPurchaseReadSerializer(purchase, context={"request": request}).data,
                "client_secret": intent.get("client_secret"),
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(responses={200: GiftPurchaseReadSerializer}),
)
class GiftPurchaseDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, purchase_id: int):
        purchase = get_purchase_by_id(purchase_id)
        assert_gift_purchase_access(request, purchase)
        return Response(GiftPurchaseReadSerializer(purchase, context={"request": request}).data)


class GiftPurchaseDownloadView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, purchase_id: int):
        purchase = get_purchase_by_id(purchase_id)
        assert_gift_purchase_access(request, purchase)

        # For AI gifts with a selected asset, redirect to that URL
        if purchase.product.is_ai_generated_product and purchase.ai_download_url:
            return HttpResponseRedirect(purchase.ai_download_url)

        svg = build_purchase_snapshot_svg(purchase)
        filename = f"{purchase.product.slug}-{purchase.id}.svg"
        response = HttpResponse(svg, content_type="image/svg+xml")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


@extend_schema_view(
    get=extend_schema(responses={200: AIGenerationStatusSerializer}),
)
class AIGiftGenerationStatusView(APIView):
    """Poll the AI generation status for a purchase."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, purchase_id: int):
        purchase = get_purchase_by_id(purchase_id)
        assert_gift_purchase_access(request, purchase)
        data = AIGenerationStatusSerializer({
            "purchase_id": purchase.id,
            "generation_status": purchase.generation_status,
            "generated_options": purchase.generated_options or [],
            "selected_option_index": purchase.selected_option_index,
            "selected_asset_url": purchase.selected_asset_url or "",
            "is_downloadable": purchase.is_downloadable,
            "ai_download_url": purchase.ai_download_url or "",
        })
        return Response(data.data)


@extend_schema_view(
    post=extend_schema(
        request=AISelectOptionSerializer,
        responses={200: GiftPurchaseReadSerializer},
    ),
)
class AIGiftSelectOptionView(APIView):
    """Select one of the generated AI design options."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, purchase_id: int):
        purchase = get_purchase_by_id(purchase_id)
        assert_gift_purchase_access(request, purchase)

        if not purchase.product.is_ai_generated_product:
            return Response(
                {"detail": "This purchase does not have AI-generated options."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.gifts.models import GiftPurchase as GP
        if purchase.generation_status not in (
            GP.GenerationStatus.GENERATED, GP.GenerationStatus.SELECTED
        ):
            return Response(
                {"detail": f"Options are not yet available (generation_status={purchase.generation_status})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AISelectOptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        option_index = serializer.validated_data["option_index"]

        try:
            purchase = select_generated_option(purchase, option_index)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(GiftPurchaseReadSerializer(purchase, context={"request": request}).data)
