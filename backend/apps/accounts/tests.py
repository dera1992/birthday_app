from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.contrib.auth import authenticate
from django.test import override_settings
from rest_framework.test import APIClient


class AccountApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="account-user", password="password123", email="user@example.com")

    def test_register_creates_user_and_verification(self):
        response = self.client.post(
            "/api/auth/register",
            {
                "email": "new@example.com",
                "password": "password123",
                "first_name": "New",
                "last_name": "User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        created = User.objects.get(email="new@example.com")
        self.assertTrue(hasattr(created, "verification"))
        self.assertTrue(created.username)
        self.assertNotIn("username", response.json())

    def test_login_uses_email_and_password(self):
        response = self.client.post(
            "/api/auth/login",
            {"email": "user@example.com", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())
        self.assertIn("refresh", response.json())

    @patch("apps.accounts.services.send_sms")
    @patch("common.email.EmailMultiAlternatives.send")
    def test_request_verify_otp_and_patch_me(self, mock_email_send, mock_sms):
        self.client.force_authenticate(user=self.user)

        with patch("apps.accounts.services.random.SystemRandom.randint", return_value=123456):
            otp_response = self.client.post(
                "/api/auth/request-otp",
                {"phone_number": "+447700900123"},
                format="json",
            )

        verify_response = self.client.post(
            "/api/auth/verify-otp",
            {"phone_number": "+447700900123", "code": "123456"},
            format="json",
        )
        me_patch = self.client.patch(
            "/api/me",
            {"first_name": "Updated"},
            format="json",
        )

        # /api/auth/verify-email only sends the email; confirm via the confirm endpoint
        from apps.accounts.services import build_email_verification_credentials
        creds = build_email_verification_credentials(self.user)
        verify_email = self.client.post(
            "/api/auth/verify-email/confirm",
            {"uid": creds["uid"], "token": creds["token"]},
            format="json",
        )

        self.user.refresh_from_db()
        self.assertEqual(otp_response.status_code, 200)
        self.assertEqual(verify_response.status_code, 200)
        self.assertEqual(me_patch.status_code, 200)
        self.assertEqual(verify_email.status_code, 200)
        self.assertEqual(self.user.first_name, "Updated")
        self.assertEqual(self.user.verification.phone_number, "+447700900123")
        self.assertIsNotNone(self.user.verification.phone_verified_at)
        self.assertIsNotNone(self.user.verification.email_verified_at)

    def test_auth_backend_accepts_email(self):
        authenticated = authenticate(email="user@example.com", password="password123")

        self.assertIsNotNone(authenticated)
        self.assertEqual(authenticated.pk, self.user.pk)

    @override_settings(DEBUG=True)
    def test_forgot_password_request_and_confirm(self):
        request_response = self.client.post(
            "/api/auth/forgot-password/request",
            {"email": "user@example.com"},
            format="json",
        )

        self.assertEqual(request_response.status_code, 200)
        self.assertIn("uid", request_response.json())
        self.assertIn("token", request_response.json())

        confirm_response = self.client.post(
            "/api/auth/forgot-password/confirm",
            {
                "uid": request_response.json()["uid"],
                "token": request_response.json()["token"],
                "new_password": "newpassword123",
            },
            format="json",
        )

        self.assertEqual(confirm_response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_change_password_requires_current_password(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/auth/change-password",
            {
                "current_password": "password123",
                "new_password": "newpassword123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))
