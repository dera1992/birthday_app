import math

from django.contrib.gis.geos import Point
from rest_framework import permissions, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view, inline_serializer

from common.permissions import IsEventHost
from common.schema import detail_response_serializer
from apps.events.models import BirthdayEvent
from apps.events.selectors import (
    get_active_packs,
    get_applications_for_host_event,
    get_event_application,
    get_event_by_id,
    get_event_for_host,
    get_events_applied_to,
    get_events_for_host,
    get_feed_queryset,
    get_invites_for_host_event,
    get_pack_by_slug,
)
from apps.events.pack_serializers import CuratedPackReadSerializer
from apps.events.read_serializers import BirthdayEventReadSerializer, EventApplicationReadSerializer, EventInviteReadSerializer
from apps.events.services import (
    apply_pack_defaults,
    apply_to_event,
    approve_application,
    cancel_event,
    check_in_attendee,
    complete_event,
    confirm_venue,
    create_event_invite,
    decline_application,
    lock_event,
    mark_no_show,
    propose_venue,
    publish_event,
    toggle_expand,
)
from apps.events.write_serializers import BirthdayEventWriteSerializer, EventInviteWriteSerializer
from apps.birthdays.services import assert_completed_birthday_profile
from apps.venues.selectors import get_grouped_venue_recommendations
from apps.venues.serializers import VenuePartnerSerializer


@extend_schema_view(
    post=extend_schema(request=BirthdayEventWriteSerializer, responses={201: BirthdayEventReadSerializer}),
)
class EventCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        assert_completed_birthday_profile(request.user)
        serializer = BirthdayEventWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pack_slug = serializer.validated_data.pop("pack_slug", None)
        pack = get_pack_by_slug(pack_slug) if pack_slug else None
        if pack:
            apply_pack_defaults(serializer.validated_data, pack)
        event = serializer.save(host=request.user, payee_user=request.user, pack=pack)
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        queryset = get_events_for_host(request.user)
        return Response(BirthdayEventReadSerializer(queryset, many=True, context={"request": request}).data)


class EventAppliedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = get_events_applied_to(request.user)
        data = BirthdayEventReadSerializer(queryset, many=True, context={"request": request}).data
        # Redact venue_name for events not yet locked/confirmed
        for item in data:
            if item.get("state") not in {BirthdayEvent.STATE_CONFIRMED, BirthdayEvent.STATE_LOCKED}:
                item["venue_name"] = ""
        return Response(data)


@extend_schema_view(
    get=extend_schema(responses={200: BirthdayEventReadSerializer}),
    patch=extend_schema(request=BirthdayEventWriteSerializer, responses={200: BirthdayEventReadSerializer}),
)
class EventDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, event_id):
        event = get_event_by_id(event_id)
        data = BirthdayEventReadSerializer(event, context={"request": request}).data
        user_id = request.user.id if request.user.is_authenticated else None
        is_host = user_id is not None and user_id == event.host_id
        is_approved_attendee = not is_host and user_id is not None and event.attendees.filter(user_id=user_id).exists()
        venue_visible = event.venue_status == BirthdayEvent.VENUE_CONFIRMED or event.state in {BirthdayEvent.STATE_CONFIRMED, BirthdayEvent.STATE_LOCKED}
        if not is_host and not is_approved_attendee:
            data["venue_name"] = ""
        elif not is_host and not venue_visible:
            data["venue_name"] = ""
        return Response(data)

    def patch(self, request, event_id):
        event = get_event_for_host(event_id, request.user)
        self.check_object_permissions(request, event)
        serializer = BirthdayEventWriteSerializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data)

    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if getattr(self, "request", None) and self.request.method == "PATCH":
            return [permissions.IsAuthenticated(), IsEventHost()]
        return [permissions.AllowAny()]


@extend_schema_view(
    post=extend_schema(request=None, responses={200: BirthdayEventReadSerializer}),
)
class EventPublishView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        event = publish_event(event, request.user)
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data)


@extend_schema_view(
    get=extend_schema(
        parameters=[
            OpenApiParameter(name="lat", required=True, type=float),
            OpenApiParameter(name="lng", required=True, type=float),
            OpenApiParameter(name="radius", required=False, type=float),
            OpenApiParameter(name="category", required=False, type=str),
            OpenApiParameter(name="q", required=False, type=str),
        ],
        responses={200: BirthdayEventReadSerializer(many=True)},
    ),
)
class EventFeedView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius = float(request.query_params.get("radius", "5000"))
        category = request.query_params.get("category")
        query = request.query_params.get("q")
        if lat is None or lng is None:
            return Response({"detail": "lat and lng are required."}, status=status.HTTP_400_BAD_REQUEST)
        user_point = Point(float(lng), float(lat), srid=4326)
        queryset = get_feed_queryset(user_point, radius, category, query)
        payload = BirthdayEventReadSerializer(queryset, many=True, context={"request": request}).data
        for index, event in enumerate(queryset):
            payload[index]["distance_meters"] = round(event.distance.m, 2)
            payload[index]["venue_name"] = ""
        return Response(payload)


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer(
            name="EventApplyRequest",
            fields={"intro_message": serializers.CharField(required=False), "invite_code": serializers.CharField(required=False)},
        ),
        responses={201: EventApplicationReadSerializer},
    ),
)
class EventApplyView(APIView):
    throttle_scope = "apply"

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        application = apply_to_event(
            event,
            request.user,
            intro_message=request.data.get("intro_message", ""),
            invite_code=request.data.get("invite_code", ""),
        )
        return Response(EventApplicationReadSerializer(application).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    post=extend_schema(request=None, responses={200: EventApplicationReadSerializer}),
)
class EventApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id, app_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        application = get_event_application(event_id, app_id)
        approve_application(event, application, request.user)
        return Response(EventApplicationReadSerializer(application).data)

    def get(self, request, event_id, app_id=None):
        applications = get_applications_for_host_event(event_id, request.user)
        return Response(EventApplicationReadSerializer(applications, many=True).data)


@extend_schema_view(
    post=extend_schema(request=None, responses={200: EventApplicationReadSerializer}),
)
class EventDeclineView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id, app_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        application = get_event_application(event_id, app_id)
        decline_application(event, application, request.user)
        return Response(EventApplicationReadSerializer(application).data)


@extend_schema_view(
    post=extend_schema(request=None, responses={200: BirthdayEventReadSerializer}),
)
class EventToggleExpandView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        event = toggle_expand(event, request.user)
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data)


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer(
            name="EventVenueProposeRequest",
            fields={"venue_name": serializers.CharField()},
        ),
        responses={200: BirthdayEventReadSerializer},
    ),
)
class EventVenueProposeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        event = propose_venue(
            event,
            request.user,
            venue_name=request.data.get("venue_name", ""),
        )
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data)


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer(
            name="EventVenueConfirmRequest",
            fields={"venue_name": serializers.CharField(required=False)},
        ),
        responses={200: BirthdayEventReadSerializer},
    ),
)
class EventVenueConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        event = confirm_venue(
            event,
            request.user,
            venue_name=request.data.get("venue_name", ""),
        )
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data)


@extend_schema_view(
    post=extend_schema(request=None, responses={200: BirthdayEventReadSerializer}),
)
class EventLockView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        event = lock_event(event, request.user)
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data)


@extend_schema_view(
    post=extend_schema(request=None, responses={200: BirthdayEventReadSerializer}),
)
class EventCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        event = cancel_event(event, request.user)
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data)


@extend_schema_view(
    post=extend_schema(request=None, responses={200: BirthdayEventReadSerializer}),
)
class EventCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        event = complete_event(event, request.user)
        return Response(BirthdayEventReadSerializer(event, context={"request": request}).data)


@extend_schema_view(
    get=extend_schema(responses={200: EventInviteReadSerializer(many=True)}),
    post=extend_schema(request=EventInviteWriteSerializer, responses={201: EventInviteReadSerializer}),
)
class EventInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def get(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        invites = get_invites_for_host_event(event_id, request.user)
        return Response(EventInviteReadSerializer(invites, many=True).data)

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        serializer = EventInviteWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invite = create_event_invite(
            event,
            request.user,
            max_uses=serializer.validated_data.get("max_uses", 0),
            expires_at=serializer.validated_data.get("expires_at"),
        )
        return Response(EventInviteReadSerializer(invite).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(responses={200: CuratedPackReadSerializer(many=True)}),
)
class PackListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        packs = get_active_packs()
        return Response(CuratedPackReadSerializer(packs, many=True).data)


@extend_schema_view(
    get=extend_schema(responses={200: CuratedPackReadSerializer}),
)
class PackDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        pack = get_pack_by_slug(slug)
        return Response(CuratedPackReadSerializer(pack).data)


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer(
            name="CheckInRequest",
            fields={
                "contact_name": serializers.CharField(required=False, allow_blank=True),
                "contact_email": serializers.EmailField(required=False, allow_blank=True),
            },
        ),
        responses={200: inline_serializer(name="CheckInResponse", fields={"checked_in_at": serializers.DateTimeField()})},
    ),
)
class EventCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        event = get_event_by_id(event_id)
        attendee = check_in_attendee(
            event,
            request.user,
            contact_name=request.data.get("contact_name", ""),
            contact_email=request.data.get("contact_email", ""),
        )
        return Response({"checked_in_at": attendee.checked_in_at})


@extend_schema_view(
    post=extend_schema(request=None, responses={200: inline_serializer(name="NoShowResponse", fields={"status": serializers.CharField()})}),
)
class EventNoShowView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEventHost]

    def post(self, request, event_id, user_id):
        event = get_event_by_id(event_id)
        self.check_object_permissions(request, event)
        attendee = mark_no_show(event, attendee_user_id=user_id, actor=request.user)
        return Response({"status": attendee.status})


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


@extend_schema_view(
    get=extend_schema(
        responses={
            200: inline_serializer(
                name="GroupedVenueRecommendations",
                fields={
                    "category": serializers.CharField(),
                    "venues": VenuePartnerSerializer(many=True),
                },
                many=True,
            )
        }
    ),
)
class EventVenueRecommendationsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, event_id):
        event = get_event_by_id(event_id)
        venue_categories = []
        if event.pack_id:
            venue_categories = event.pack.defaults.get("venue_categories") or []
        if not venue_categories:
            venue_categories = [event.category]
        area = (event.approx_area_label or "").lower()
        if "manchester" in area:
            city = "Manchester"
        elif "london" in area:
            city = "London"
        else:
            city = None
        grouped = get_grouped_venue_recommendations(
            city=city,
            venue_categories=venue_categories,
        )

        # Optional user coordinates for distance calculation
        try:
            user_lat = float(request.query_params["lat"])
            user_lng = float(request.query_params["lng"])
        except (KeyError, ValueError):
            user_lat = user_lng = None

        payload = []
        for cat, venues in grouped.items():
            serialized = VenuePartnerSerializer(venues, many=True).data
            if user_lat is not None:
                for i, venue in enumerate(venues):
                    if venue.latitude is not None and venue.longitude is not None:
                        serialized[i]["distance_km"] = _haversine_km(
                            user_lat, user_lng, venue.latitude, venue.longitude
                        )
                    else:
                        serialized[i]["distance_km"] = None
            payload.append({"category": cat, "venues": serialized})
        return Response(payload)
