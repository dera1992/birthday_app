from django.urls import path

from apps.payments.views_connect import ConnectDashboardView, ConnectOnboardView, ConnectStatusView


urlpatterns = [
    path("connect/onboard", ConnectOnboardView.as_view()),
    path("connect/status", ConnectStatusView.as_view()),
    path("connect/dashboard", ConnectDashboardView.as_view()),
]
