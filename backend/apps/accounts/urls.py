from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    ChangePasswordView,
    EmailLoginView,
    ForgotPasswordConfirmView,
    ForgotPasswordRequestView,
    MeView,
    RegisterView,
    RequestOTPView,
    VerifyEmailView,
    VerifyEmailConfirmView,
    VerifyOTPView,
)


urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", EmailLoginView.as_view(), name="login"),
    path("auth/forgot-password/request", ForgotPasswordRequestView.as_view(), name="forgot-password-request"),
    path("auth/forgot-password/confirm", ForgotPasswordConfirmView.as_view(), name="forgot-password-confirm"),
    path("auth/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/verify-email", VerifyEmailView.as_view(), name="verify-email"),
    path("auth/verify-email/confirm", VerifyEmailConfirmView.as_view(), name="verify-email-confirm"),
    path("auth/request-otp", RequestOTPView.as_view(), name="request-otp"),
    path("auth/verify-otp", VerifyOTPView.as_view(), name="verify-otp"),
    path("auth/change-password", ChangePasswordView.as_view(), name="change-password"),
    path("me", MeView.as_view(), name="me"),
]
