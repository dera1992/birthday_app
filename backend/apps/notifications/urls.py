from django.urls import path

from apps.notifications import views

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view(), name="notification-list"),
    path("notifications/unread-count/", views.NotificationUnreadCountView.as_view(), name="notification-unread-count"),
    path("notifications/mark-all-read/", views.NotificationMarkAllReadView.as_view(), name="notification-mark-all-read"),
    path("notifications/<int:notification_id>/read/", views.NotificationMarkReadView.as_view(), name="notification-mark-read"),
]
