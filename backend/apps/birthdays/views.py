from rest_framework import permissions, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer

from common.permissions import IsProfileOwner
from common.schema import detail_response_serializer
from apps.birthdays.models import BirthdayProfile, SupportMessage, WishlistContribution
from apps.birthdays.selectors import (
    get_active_referral_products,
    get_contributions_for_owner,
    get_profile_by_slug,
    get_profile_for_user,
    get_public_wishlist_items,
    get_support_message_for_owner,
    get_wishlist_item,
    get_wishlist_item_for_user,
)
from apps.birthdays.read_serializers import (
    BirthdayProfileReadSerializer,
    ReferralProductReadSerializer,
    SupportContributionReadSerializer,
    SupportMessageReadSerializer,
    WishlistContributionReadSerializer,
    WishlistItemReadSerializer,
    WishlistReservationReadSerializer,
)
from apps.birthdays.write_serializers import (
    BirthdayProfileWriteSerializer,
    SupportContributionWriteSerializer,
    SupportMessageWriteSerializer,
    WishlistContributionWriteSerializer,
    WishlistItemWriteSerializer,
    WishlistReservationWriteSerializer,
)
from apps.birthdays.services import (
    assert_contribution_allowed,
    can_view_profile,
    cancel_wishlist_reservation,
    generate_unique_profile_slug,
    get_user_display_seed,
    moderate_support_message,
    react_to_support_message,
    reply_to_support_message,
)
from apps.payments.services import create_support_contribution_payment_intent, create_wishlist_contribution_payment_intent
from apps.safety.services import assert_not_blocked


@extend_schema_view(
    post=extend_schema(request=BirthdayProfileWriteSerializer, responses={201: BirthdayProfileReadSerializer}),
)
class BirthdayProfileCreateView(APIView):
    def post(self, request):
        payload = request.data.copy()
        if not payload.get("slug"):
            payload["slug"] = generate_unique_profile_slug(request.user)
        serializer = BirthdayProfileWriteSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user)
        return Response(BirthdayProfileReadSerializer(profile, context={"request": request}).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(responses={200: BirthdayProfileReadSerializer}),
    patch=extend_schema(request=BirthdayProfileWriteSerializer, responses={200: BirthdayProfileReadSerializer}),
)
class BirthdayProfileDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_object(self, slug):
        return get_profile_by_slug(slug)

    def get(self, request, slug):
        profile = self.get_object(slug)
        if not can_view_profile(profile, request.user):
            return Response({"detail": "This birthday profile is private."}, status=status.HTTP_403_FORBIDDEN)
        return Response(BirthdayProfileReadSerializer(profile, context={"request": request}).data)

    def patch(self, request, slug):
        profile = self.get_object(slug)
        self.check_object_permissions(request, profile)
        serializer = BirthdayProfileWriteSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BirthdayProfileReadSerializer(profile, context={"request": request}).data)

    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if getattr(self, "request", None) and self.request.method == "PATCH":
            return [permissions.IsAuthenticated(), IsProfileOwner()]
        return [permissions.AllowAny()]


@extend_schema_view(
    post=extend_schema(request=WishlistItemWriteSerializer, responses={201: WishlistItemReadSerializer}),
)
class WishlistItemCreateView(APIView):
    def post(self, request, slug):
        profile = get_profile_for_user(slug, request.user)
        self.check_object_permissions(request, profile)
        serializer = WishlistItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(profile=profile)
        return Response(WishlistItemReadSerializer(item).data, status=status.HTTP_201_CREATED)

    permission_classes = [permissions.IsAuthenticated, IsProfileOwner]


@extend_schema_view(
    patch=extend_schema(request=WishlistItemWriteSerializer, responses={200: WishlistItemReadSerializer}),
)
class WishlistItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProfileOwner]

    def patch(self, request, pk):
        item = get_wishlist_item_for_user(pk, request.user)
        self.check_object_permissions(request, item)
        serializer = WishlistItemWriteSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(WishlistItemReadSerializer(item).data)

    def delete(self, request, pk):
        item = get_wishlist_item_for_user(pk, request.user)
        self.check_object_permissions(request, item)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    post=extend_schema(request=WishlistReservationWriteSerializer, responses={201: WishlistReservationReadSerializer}),
)
class WishlistReserveView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "messages"

    def post(self, request, pk):
        item = get_wishlist_item(pk)
        action = request.data.get("action", "").lower()
        if action == "cancel":
            if not request.user.is_authenticated:
                return Response({"detail": "Authentication is required to cancel a reservation."}, status=status.HTTP_401_UNAUTHORIZED)
            cancel_wishlist_reservation(item, request.user, message_body=request.data.get("message", ""))
            return Response({"detail": "Reservation cancelled."})
        if item.is_reserved:
            return Response({"detail": "Item already reserved."}, status=status.HTTP_400_BAD_REQUEST)
        payload = request.data.copy()
        if request.user.is_authenticated:
            assert_not_blocked(request.user, item.profile.user)
            payload.setdefault("reserver_name", get_user_display_seed(request.user))
            payload.setdefault("reserver_email", request.user.email or "")
        serializer = WishlistReservationWriteSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save(item=item)
        item.is_reserved = True
        item.save(update_fields=["is_reserved"])
        return Response(WishlistReservationReadSerializer(reservation).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    post=extend_schema(request=SupportMessageWriteSerializer, responses={201: SupportMessageReadSerializer}),
    get=extend_schema(responses={200: SupportMessageReadSerializer(many=True)}),
)
class SupportMessageCollectionView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "messages"

    def get_profile(self, slug):
        return get_profile_by_slug(slug)

    def post(self, request, slug):
        profile = self.get_profile(slug)
        if request.user.is_authenticated:
            if request.user == profile.user:
                return Response({"detail": "You cannot send a message to your own birthday profile."}, status=status.HTTP_400_BAD_REQUEST)
            assert_not_blocked(request.user, profile.user)
        serializer = SupportMessageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save(profile=profile, author=request.user if request.user.is_authenticated else None)
        return Response(SupportMessageReadSerializer(message).data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        profile = self.get_profile(slug)
        if not can_view_profile(profile, request.user):
            return Response({"detail": "This birthday profile is private."}, status=status.HTTP_403_FORBIDDEN)
        messages = profile.support_messages.order_by("-created_at")
        if not (request.user.is_authenticated and request.user == profile.user):
            messages = messages.filter(moderation_status=SupportMessage.MODERATION_APPROVED)
        return Response(SupportMessageReadSerializer(messages, many=True).data)


@extend_schema_view(
    post=extend_schema(
        request=SupportContributionWriteSerializer,
        responses={
            201: inline_serializer(
                name="SupportContributionIntentResponse",
                fields={
                    "contribution": SupportContributionReadSerializer(),
                    "client_secret": serializers.CharField(allow_null=True),
                    "detail": serializers.CharField(),
                },
            )
        },
    ),
)
class SupportContributionIntentView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "contributions"

    def post(self, request, slug):
        profile = get_profile_by_slug(slug)
        serializer = SupportContributionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contribution = serializer.save(
            profile=profile,
            supporter=request.user if request.user.is_authenticated else None,
        )
        contribution, intent = create_support_contribution_payment_intent(
            contribution,
            idempotency_key=request.headers.get("Idempotency-Key"),
        )
        return Response(
            {
                "contribution": SupportContributionReadSerializer(contribution).data,
                "client_secret": intent.get("client_secret"),
                "detail": "Support contribution record created.",
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(responses={200: SupportContributionReadSerializer(many=True)}),
)
class SupportContributionCollectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        contributions = get_contributions_for_owner(slug, request.user)
        return Response(SupportContributionReadSerializer(contributions, many=True).data)


@extend_schema_view(
    post=extend_schema(responses={200: SupportMessageReadSerializer}),
)
class SupportMessageApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        message = get_support_message_for_owner(message_id, request.user)
        moderate_support_message(message, request.user, SupportMessage.MODERATION_APPROVED)
        return Response(SupportMessageReadSerializer(message).data)


@extend_schema_view(
    post=extend_schema(responses={200: SupportMessageReadSerializer}),
)
class SupportMessageRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        message = get_support_message_for_owner(message_id, request.user)
        moderate_support_message(message, request.user, SupportMessage.MODERATION_REJECTED)
        return Response(SupportMessageReadSerializer(message).data)


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer("SupportMessageReactRequest", fields={"reaction": serializers.CharField()}),
        responses={200: SupportMessageReadSerializer},
    ),
)
class SupportMessageReactView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        message = get_support_message_for_owner(message_id, request.user)
        reaction = request.data.get("reaction", "").strip()
        if not reaction:
            return Response({"detail": "reaction is required."}, status=status.HTTP_400_BAD_REQUEST)
        react_to_support_message(message, request.user, reaction)
        return Response(SupportMessageReadSerializer(message).data)


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer("SupportMessageReplyRequest", fields={"reply_text": serializers.CharField()}),
        responses={200: SupportMessageReadSerializer},
    ),
)
class SupportMessageReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        message = get_support_message_for_owner(message_id, request.user)
        reply_text = request.data.get("reply_text", "").strip()
        if not reply_text:
            return Response({"detail": "reply_text is required."}, status=status.HTTP_400_BAD_REQUEST)
        reply_to_support_message(message, request.user, reply_text)
        return Response(SupportMessageReadSerializer(message).data)


@extend_schema_view(
    get=extend_schema(responses={200: WishlistItemReadSerializer(many=True)}),
)
class PublicWishlistItemListView(APIView):
    """Public endpoint: returns publicly visible items for a profile."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        profile = get_profile_by_slug(slug)
        if not can_view_profile(profile, request.user):
            return Response({"detail": "This birthday profile is private."}, status=status.HTTP_403_FORBIDDEN)
        items = get_public_wishlist_items(profile)
        return Response(WishlistItemReadSerializer(items, many=True).data)


@extend_schema_view(
    post=extend_schema(
        request=WishlistContributionWriteSerializer,
        responses={
            201: inline_serializer(
                name="WishlistContributionIntentResponse",
                fields={
                    "contribution": WishlistContributionReadSerializer(),
                    "client_secret": serializers.CharField(allow_null=True),
                    "detail": serializers.CharField(),
                },
            )
        },
    ),
)
class WishlistContributionIntentView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "contributions"

    def post(self, request, pk):
        item = get_wishlist_item(pk)
        serializer = WishlistContributionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]
        assert_contribution_allowed(item, amount)
        contribution = serializer.save(
            item=item,
            contributor=request.user if request.user.is_authenticated else None,
        )
        if request.user.is_authenticated:
            if not serializer.validated_data.get("contributor_name"):
                contribution.contributor_name = get_user_display_seed(request.user)
                contribution.save(update_fields=["contributor_name"])
        contribution, intent = create_wishlist_contribution_payment_intent(
            contribution,
            idempotency_key=request.headers.get("Idempotency-Key"),
        )
        return Response(
            {
                "contribution": WishlistContributionReadSerializer(contribution).data,
                "client_secret": intent.get("client_secret"),
                "detail": "Wishlist contribution payment intent created.",
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(responses={200: ReferralProductReadSerializer(many=True)}),
)
class ReferralProductListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        category = request.query_params.get("category", "")
        products = get_active_referral_products(category=category)
        return Response(ReferralProductReadSerializer(products, many=True).data)


class ReferralProductClickView(APIView):
    """Track a click and redirect to affiliate URL."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        from apps.birthdays.models import ReferralProduct
        from django.shortcuts import get_object_or_404
        product = get_object_or_404(ReferralProduct, pk=pk, is_active=True)
        product.click_count += 1
        product.save(update_fields=["click_count"])
        return Response({"affiliate_url": product.affiliate_url})
