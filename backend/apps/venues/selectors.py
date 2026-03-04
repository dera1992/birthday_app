from django.shortcuts import get_object_or_404

from apps.venues.models import VenuePartner


def get_recommendation_queryset(
    city: str | None = None,
    category: str | None = None,
    categories: list | None = None,
    neighborhood_tag: str | None = None,
):
    queryset = VenuePartner.objects.filter(is_active=True)
    if city:
        queryset = queryset.filter(city__iexact=city)
    if categories:
        queryset = queryset.filter(category__in=[c.upper() for c in categories])
    elif category:
        queryset = queryset.filter(category__iexact=category)
    if neighborhood_tag:
        queryset = queryset.filter(neighborhood_tags__contains=[neighborhood_tag])
    return queryset.order_by("-is_sponsored", "-priority", "name")


def get_active_venue(venue_id: int) -> VenuePartner:
    return get_object_or_404(VenuePartner, pk=venue_id, is_active=True)


def get_grouped_venue_recommendations(
    city: str | None,
    venue_categories: list,
    neighborhood_tag: str | None = None,
) -> dict:
    return {
        cat: list(get_recommendation_queryset(city=city, category=cat, neighborhood_tag=neighborhood_tag))
        for cat in venue_categories
    }
