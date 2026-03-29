from urllib.parse import urlencode

from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.text import slugify
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.exceptions import ValidationError

from apps.accounts.models import UserVerification
from common.email import send_html_email


def get_or_create_user_verification(user):
    verification, _ = UserVerification.objects.get_or_create(user=user)
    return verification


def verify_email(user):
    verification = get_or_create_user_verification(user)
    verification.email_verified_at = timezone.now()
    verification.save(update_fields=["email_verified_at"])
    return verification


def build_email_verification_credentials(user):
    return {
        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
        "token": default_token_generator.make_token(user),
    }


def send_verification_email(user):
    credentials = build_email_verification_credentials(user)
    base_url = getattr(settings, "FRONTEND_EMAIL_VERIFY_URL", "http://localhost:3000/verify-email")
    query = urlencode(credentials)
    verification_url = f"{base_url}?{query}"

    send_html_email(
        subject="Verify your email — Celnoia",
        to=user.email,
        heading="Confirm your email address",
        body_lines=[
            f"Hi {user.first_name or 'there'},",
            "Thanks for signing up! Please verify your email address to activate your Celnoia account.",
            "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
        ],
        cta_text="Verify Email Address",
        cta_url=verification_url,
        footer_note=f"Or copy and paste this link into your browser: {verification_url}",
        fail_silently=False,
    )
    return verification_url


def confirm_email_verification(uid: str, token: str):
    user = get_user_from_reset_uid(uid)
    if not default_token_generator.check_token(user, token):
        raise ValidationError("Invalid or expired email verification link.")
    verify_email(user)
    return user


def store_phone_number(user, phone_number: str):
    if not phone_number:
        raise ValidationError("phone_number is required.")
    verification = get_or_create_user_verification(user)
    verification.phone_number = phone_number
    verification.save(update_fields=["phone_number"])
    return verification


def verify_phone_otp(user, code: str, phone_number: str = ""):
    if code != settings.DEV_OTP_CODE:
        raise ValidationError("Invalid OTP code.")
    verification = get_or_create_user_verification(user)
    verification.mark_phone_verified(phone_number or verification.phone_number)
    return verification


def generate_unique_username(email: str, first_name: str = "", last_name: str = "") -> str:
    base = slugify(f"{first_name} {last_name}".strip()) or slugify(email.split("@")[0]) or "user"
    username = base
    suffix = 2

    while User.objects.filter(username=username).exists():
        username = f"{base}-{suffix}"
        suffix += 1
    return username


def build_password_reset_credentials(user):
    return {
        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
        "token": default_token_generator.make_token(user),
    }


def get_user_from_reset_uid(uid: str):
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        return User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        raise ValidationError("Invalid password reset link.")
