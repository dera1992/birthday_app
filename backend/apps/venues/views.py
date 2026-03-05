from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view, inline_serializer

from apps.venues.models import ReferralClick, VenuePartner, VenueRating
from apps.venues.selectors import get_active_venue, get_recommendation_queryset
from apps.venues.serializers import VenueAdminSerializer, VenuePartnerSerializer


@extend_schema_view(
    get=extend_schema(
        parameters=[
            OpenApiParameter(name="city", required=False, type=str),
            OpenApiParameter(name="category", required=False, type=str),
            OpenApiParameter(name="q", required=False, type=str),
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
            search=request.query_params.get("q"),
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


class VenueAdminListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = VenuePartner.objects.all()
        city = request.query_params.get("city")
        category = request.query_params.get("category")
        is_active = request.query_params.get("is_active")
        is_sponsored = request.query_params.get("is_sponsored")
        search = request.query_params.get("search")
        if city:
            qs = qs.filter(city__iexact=city)
        if category:
            qs = qs.filter(category__iexact=category)
        if is_active is not None and is_active != "":
            qs = qs.filter(is_active=is_active.lower() == "true")
        if is_sponsored is not None and is_sponsored != "":
            qs = qs.filter(is_sponsored=is_sponsored.lower() == "true")
        if search:
            qs = qs.filter(name__icontains=search)
        qs = qs.order_by("-is_sponsored", "-priority", "name")
        return Response(VenueAdminSerializer(qs, many=True).data)

    def post(self, request):
        serializer = VenueAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VenueAdminDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, venue_id):
        venue = get_object_or_404(VenuePartner, id=venue_id)
        serializer = VenueAdminSerializer(venue, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, venue_id):
        venue = get_object_or_404(VenuePartner, id=venue_id)
        venue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer(
            name="VenueRateRequest",
            fields={
                "score": serializers.IntegerField(min_value=1, max_value=5),
                "review": serializers.CharField(required=False, allow_blank=True),
            },
        ),
        responses={
            200: inline_serializer(
                name="VenueRateResponse",
                fields={
                    "avg_rating": serializers.FloatField(allow_null=True),
                    "rating_count": serializers.IntegerField(),
                    "my_score": serializers.IntegerField(),
                },
            )
        },
    ),
)
class VenueRateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, venue_id):
        venue = get_active_venue(venue_id)
        score = request.data.get("score")
        review = request.data.get("review", "")
        if not isinstance(score, int) or not (1 <= score <= 5):
            return Response({"detail": "score must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        VenueRating.objects.update_or_create(
            user=request.user,
            venue=venue,
            defaults={"score": score, "review": review},
        )
        updated = VenuePartnerSerializer(venue).data
        return Response({
            "avg_rating": updated["avg_rating"],
            "rating_count": updated["rating_count"],
            "my_score": score,
        })
