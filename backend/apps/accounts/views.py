from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from rest_framework import permissions, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.accounts.auth_serializers import EmailTokenObtainPairSerializer
from apps.accounts.serializers import (
    ChangePasswordSerializer,
    ForgotPasswordConfirmSerializer,
    ForgotPasswordRequestSerializer,
    MeSerializer,
    RegisterSerializer,
)
from apps.accounts.services import build_password_reset_credentials, store_phone_number, verify_email, verify_phone_otp
from apps.accounts.services import confirm_email_verification, send_verification_email
from common.schema import detail_response_serializer


@extend_schema_view(
    post=extend_schema(request=RegisterSerializer, responses={201: MeSerializer}),
)
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_verification_email(user)
        return Response(MeSerializer(user).data, status=status.HTTP_201_CREATED)


class EmailLoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


@extend_schema_view(
    post=extend_schema(
        request=ForgotPasswordRequestSerializer,
        responses={
            200: inline_serializer(
                name="ForgotPasswordRequestResponse",
                fields={
                    "detail": serializers.CharField(),
                    "uid": serializers.CharField(required=False, allow_null=True),
                    "token": serializers.CharField(required=False, allow_null=True),
                },
            )
        },
    ),
)
class ForgotPasswordRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_data = {"detail": "If an account exists for that email, a password reset link has been generated."}
        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
        if user and user.is_active and settings.DEBUG:
            response_data.update(build_password_reset_credentials(user))
        return Response(response_data)


@extend_schema_view(
    post=extend_schema(
        request=ForgotPasswordConfirmSerializer,
        responses={200: detail_response_serializer("ForgotPasswordConfirmResponse")},
    ),
)
class ForgotPasswordConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordConfirmSerializer(
            data=request.data,
            context={"token_generator": default_token_generator},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password reset successful."})


@extend_schema_view(
    post=extend_schema(request=None, responses={200: detail_response_serializer("VerifyEmailResponse")}),
)
class VerifyEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        verification_url = send_verification_email(request.user)
        payload = {"detail": "Verification email sent."}
        if settings.DEBUG:
            payload["verification_url"] = verification_url
        return Response(payload)


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer(
            name="VerifyEmailConfirmRequest",
            fields={"uid": serializers.CharField(), "token": serializers.CharField()},
        ),
        responses={200: detail_response_serializer("VerifyEmailConfirmResponse")},
    ),
)
class VerifyEmailConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user = confirm_email_verification(
            uid=request.data.get("uid", ""),
            token=request.data.get("token", ""),
        )
        return Response({"detail": "Email verified successfully.", "email": user.email})


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer(
            name="RequestOTPRequest",
            fields={"phone_number": serializers.CharField()},
        ),
        responses={
            200: inline_serializer(
                name="RequestOTPResponse",
                fields={"detail": serializers.CharField(), "dev_code": serializers.CharField(allow_null=True, required=False)},
            )
        },
    ),
)
class RequestOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        store_phone_number(request.user, request.data.get("phone_number"))
        from django.conf import settings

        return Response({"detail": "OTP requested.", "dev_code": settings.DEV_OTP_CODE if settings.DEBUG else None})


@extend_schema_view(
    post=extend_schema(
        request=inline_serializer(
            name="VerifyOTPRequest",
            fields={"phone_number": serializers.CharField(required=False), "code": serializers.CharField()},
        ),
        responses={200: detail_response_serializer("VerifyOTPResponse")},
    ),
)
class VerifyOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        verify_phone_otp(
            request.user,
            code=request.data.get("code"),
            phone_number=request.data.get("phone_number", ""),
        )
        return Response({"detail": "Phone verified."})


@extend_schema_view(
    get=extend_schema(responses={200: MeSerializer}),
    patch=extend_schema(request=MeSerializer, responses={200: MeSerializer}),
)
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        serializer = MeSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@extend_schema_view(
    post=extend_schema(
        request=ChangePasswordSerializer,
        responses={200: detail_response_serializer("ChangePasswordResponse")},
    ),
)
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password changed successfully."})
