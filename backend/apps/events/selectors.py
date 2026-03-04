from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Q
from django.shortcuts import get_object_or_404

from apps.events.models import BirthdayEvent, CuratedPack, EventApplication, EventInvite


def get_active_packs():
    return CuratedPack.objects.filter(is_active=True).order_by("name")


def get_pack_by_slug(slug: str) -> CuratedPack:
    return get_object_or_404(CuratedPack, slug=slug, is_active=True)


def get_event_by_id(event_id: int) -> BirthdayEvent:
    return get_object_or_404(BirthdayEvent.objects.select_related("host", "payee_user"), pk=event_id)


def get_event_for_host(event_id: int, host) -> BirthdayEvent:
    return get_object_or_404(BirthdayEvent.objects.select_related("host", "payee_user"), pk=event_id, host=host)


def get_events_for_host(host):
    return BirthdayEvent.objects.filter(host=host).select_related("host", "payee_user").order_by("-created_at")


def get_applications_for_host_event(event_id: int, host):
    event = get_event_for_host(event_id, host)
    return (
        EventApplication.objects.filter(event=event)
        .select_related("event", "applicant")
        .order_by("-created_at")
    )


def get_event_application(event_id: int, app_id: int) -> EventApplication:
    return get_object_or_404(
        EventApplication.objects.select_related("event", "applicant"),
        pk=app_id,
        event_id=event_id,
    )


def get_invites_for_host_event(event_id: int, host):
    event = get_event_for_host(event_id, host)
    return EventInvite.objects.filter(event=event).order_by("-id")


def get_application_for_event_user(event, user) -> EventApplication:
    return get_object_or_404(
        EventApplication.objects.select_related("event", "applicant"),
        event=event,
        applicant=user,
    )


def get_feed_queryset(user_point: Point, radius_meters: float, category: str | None = None, query: str | None = None):
    queryset = (
        BirthdayEvent.objects.filter(state__in=[BirthdayEvent.STATE_OPEN, BirthdayEvent.STATE_MIN_MET])
        .filter(
            Q(visibility=BirthdayEvent.VISIBILITY_DISCOVERABLE)
            | Q(visibility=BirthdayEvent.VISIBILITY_INVITE_ONLY, expand_to_strangers=True)
        )
        .filter(location_point__distance_lte=(user_point, D(m=radius_meters)))
        .annotate(distance=Distance("location_point", user_point))
        .select_related("host", "payee_user")
        .order_by("distance", "start_at")
    )
    if category:
        queryset = queryset.filter(category__iexact=category)
    if query:
        queryset = queryset.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(agenda__icontains=query)
            | Q(approx_area_label__icontains=query)
            | Q(host__first_name__icontains=query)
            | Q(host__last_name__icontains=query)
        )
    return queryset
