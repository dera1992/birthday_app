from rest_framework import permissions, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer

from common.permissions import IsProfileOwner
from common.schema import detail_response_serializer
from apps.birthdays.models import BirthdayProfile, SupportMessage
from apps.birthdays.selectors import (
    get_contributions_for_owner,
    get_profile_by_slug,
    get_profile_for_user,
    get_support_message_for_owner,
    get_wishlist_item,
    get_wishlist_item_for_user,
)
from apps.birthdays.read_serializers import (
    BirthdayProfileReadSerializer,
    SupportContributionReadSerializer,
    SupportMessageReadSerializer,
    WishlistItemReadSerializer,
    WishlistReservationReadSerializer,
)
from apps.birthdays.write_serializers import (
    BirthdayProfileWriteSerializer,
    SupportContributionWriteSerializer,
    SupportMessageWriteSerializer,
    WishlistItemWriteSerializer,
    WishlistReservationWriteSerializer,
)
from apps.birthdays.services import (
    can_view_profile,
    cancel_wishlist_reservation,
    generate_unique_profile_slug,
    get_user_display_seed,
    moderate_support_message,
)
from apps.payments.services import create_support_contribution_payment_intent
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
            cancel_wishlist_reservation(item, request.user)
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
