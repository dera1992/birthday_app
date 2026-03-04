from rest_framework import permissions, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view, inline_serializer

from apps.venues.models import ReferralClick
from apps.venues.selectors import get_active_venue, get_recommendation_queryset
from apps.venues.serializers import VenuePartnerSerializer


@extend_schema_view(
    get=extend_schema(
        parameters=[
            OpenApiParameter(name="city", required=False, type=str),
            OpenApiParameter(name="category", required=False, type=str),
        ],
        responses={200: VenuePartnerSerializer(many=True)},
    ),
)
class VenueRecommendationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = get_recommendation_queryset(
            city=request.query_params.get("city"),
            category=request.query_params.get("category"),
        )
        return Response(VenuePartnerSerializer(queryset, many=True).data)


@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={
            201: inline_serializer(
                name="VenueClickResponse",
                fields={"redirect_url": serializers.URLField()},
            )
        },
    ),
)
class VenueClickView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, venue_id):
        venue = get_active_venue(venue_id)
        ReferralClick.objects.create(venue=venue, user=request.user if request.user.is_authenticated else None)
        return Response({"redirect_url": venue.referral_url}, status=status.HTTP_201_CREATED)
