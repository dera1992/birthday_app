from django.shortcuts import get_object_or_404

from apps.venues.models import VenuePartner


def get_recommendation_queryset(city: str | None = None, category: str | None = None):
    queryset = VenuePartner.objects.filter(is_active=True)
    if city:
        queryset = queryset.filter(city__iexact=city)
    if category:
        queryset = queryset.filter(category__iexact=category)
    return queryset


def get_active_venue(venue_id: int) -> VenuePartner:
    return get_object_or_404(VenuePartner, pk=venue_id, is_active=True)
