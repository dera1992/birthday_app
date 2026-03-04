from django.urls import path

from apps.venues.views import VenueClickView, VenueRecommendationView


urlpatterns = [
    path("venues/recommendations", VenueRecommendationView.as_view(), name="venues-recommendations"),
    path("venues/<int:venue_id>/click", VenueClickView.as_view(), name="venues-click"),
]
