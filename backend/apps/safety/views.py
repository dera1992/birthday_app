from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.safety.selectors import get_ratable_event
from apps.safety.services import validate_event_rating_permissions
from apps.safety.serializers import EventRatingSerializer, UserBlockSerializer, UserReportSerializer


@extend_schema_view(
    post=extend_schema(request=UserReportSerializer, responses={201: UserReportSerializer}),
)
class ReportView(APIView):
    def post(self, request):
        serializer = UserReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(reporter=request.user)
        return Response(UserReportSerializer(report).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    post=extend_schema(request=UserBlockSerializer, responses={201: UserBlockSerializer}),
)
class BlockView(APIView):
    def post(self, request):
        serializer = UserBlockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        block = serializer.save(blocker=request.user)
        return Response(UserBlockSerializer(block).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    post=extend_schema(request=EventRatingSerializer, responses={201: EventRatingSerializer}),
)
class EventRatingView(APIView):
    def post(self, request, event_id):
        event = get_ratable_event(event_id)
        validate_event_rating_permissions(event, request.user)
        serializer = EventRatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating = serializer.save(event=event, rater=request.user)
        return Response(EventRatingSerializer(rating).data, status=status.HTTP_201_CREATED)
