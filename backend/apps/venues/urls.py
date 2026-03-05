from django.urls import path

from apps.venues.views import VenueAdminDetailView, VenueAdminListView, VenueClickView, VenueRateView, VenueRecommendationView


urlpatterns = [
    path("venues/recommendations", VenueRecommendationView.as_view(), name="venues-recommendations"),
    path("venues/admin", VenueAdminListView.as_view(), name="venues-admin-list"),
    path("venues/admin/<int:venue_id>", VenueAdminDetailView.as_view(), name="venues-admin-detail"),
    path("venues/<int:venue_id>/click", VenueClickView.as_view(), name="venues-click"),
    path("venues/<int:venue_id>/rate", VenueRateView.as_view(), name="venues-rate"),
]
