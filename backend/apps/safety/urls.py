from django.urls import path

from apps.safety.views import BlockView, EventRatingView, ReportView


urlpatterns = [
    path("reports", ReportView.as_view(), name="reports"),
    path("blocks", BlockView.as_view(), name="blocks"),
    path("events/<int:event_id>/ratings", EventRatingView.as_view(), name="event-ratings"),
]
