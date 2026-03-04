from django.urls import path

from apps.payments.views_connect import ConnectOnboardView, ConnectStatusView


urlpatterns = [
    path("connect/onboard", ConnectOnboardView.as_view()),
    path("connect/status", ConnectStatusView.as_view()),
]
