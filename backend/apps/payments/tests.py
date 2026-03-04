import json
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.events.models import BirthdayEvent, EventApplication
from apps.birthdays.models import BirthdayProfile, SupportContribution
from apps.payments.models import ConnectAccount, EventPayment, StripeEventProcessed


class StripeWebhookTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.host = User.objects.create_user(username="host2", password="password123")
        self.user = User.objects.create_user(username="guest2", password="password123")
        self.event = BirthdayEvent.objects.create(
            host=self.host,
            payee_user=self.host,
            title="Paid Brunch",
            description="",
            agenda="",
            category="DINING",
            start_at=timezone.now() + timedelta(days=2),
            end_at=timezone.now() + timedelta(days=2, hours=2),
            visibility=BirthdayEvent.VISIBILITY_DISCOVERABLE,
            expand_to_strangers=False,
            location_point=Point(-2.2426, 53.4808, srid=4326),
            radius_meters=10000,
            approx_area_label="Central",
            min_guests=1,
            max_guests=5,
            criteria={},
            payment_mode=BirthdayEvent.PAYMENT_MODE_PAID,
            amount="35.00",
            currency="GBP",
            state=BirthdayEvent.STATE_OPEN,
            venue_status=BirthdayEvent.VENUE_NOT_SET,
            lock_deadline_at=timezone.now() + timedelta(days=1),
        )
        self.application = EventApplication.objects.create(
            event=self.event, applicant=self.user, status=EventApplication.STATUS_APPROVED
        )
        self.payment = EventPayment.objects.create(
            event=self.event,
            attendee=self.user,
            application=self.application,
            amount="35.00",
            currency="GBP",
            transfer_group=f"event_{self.event.id}",
            stripe_payment_intent_id="pi_test_123",
        )

    def test_webhook_is_idempotent(self):
        payload = {
            "id": "evt_test_123",
            "type": "payment_intent.succeeded",
            "data": {"object": {"id": "pi_test_123", "latest_charge": "ch_test_123"}},
        }

        first = self.client.post(
            "/api/webhooks/stripe",
            data=json.dumps(payload),
            content_type="application/json",
        )
        second = self.client.post(
            "/api/webhooks/stripe",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.payment.refresh_from_db()
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(self.payment.status, EventPayment.STATUS_HELD_ESCROW)
        self.assertEqual(StripeEventProcessed.objects.filter(stripe_event_id="evt_test_123").count(), 1)

    @patch("apps.payments.views_connect.create_account_link")
    @patch("apps.payments.views_connect.get_or_create_express_account")
    def test_connect_onboard_returns_link_and_account(self, get_or_create_express_account_mock, create_account_link_mock):
        self.client.force_authenticate(user=self.host)
        connect_account = ConnectAccount.objects.create(
            user=self.host,
            stripe_account_id="acct_123",
            charges_enabled=False,
            payouts_enabled=False,
            requirements={},
            details_submitted=False,
        )
        get_or_create_express_account_mock.return_value = connect_account
        create_account_link_mock.return_value = "https://stripe.test/onboard"

        response = self.client.post("/api/connect/onboard", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["onboarding_url"], "https://stripe.test/onboard")
        self.assertEqual(response.json()["connect_account"]["stripe_account_id"], "acct_123")

    def test_connect_status_reports_presence_or_absence(self):
        self.client.force_authenticate(user=self.host)

        no_account = self.client.get("/api/connect/status")
        ConnectAccount.objects.create(
            user=self.host,
            stripe_account_id="acct_456",
            charges_enabled=True,
            payouts_enabled=False,
            requirements={"currently_due": ["external_account"]},
            details_submitted=True,
        )
        with_account = self.client.get("/api/connect/status")

        self.assertEqual(no_account.status_code, 200)
        self.assertFalse(no_account.json()["has_account"])
        self.assertEqual(with_account.status_code, 200)
        self.assertTrue(with_account.json()["has_account"])
        self.assertEqual(with_account.json()["connect_account"]["stripe_account_id"], "acct_456")

    def test_support_contribution_webhook_updates_status(self):
        profile = BirthdayProfile.objects.create(
            user=self.host,
            slug="host-support",
            day=1,
            month=1,
            hide_year=True,
            bio="",
            preferences={},
            visibility="PUBLIC",
        )
        contribution = SupportContribution.objects.create(
            profile=profile,
            supporter=self.user,
            amount="15.00",
            currency="GBP",
            stripe_payment_intent_id="pi_support_123",
        )
        payload = {
            "id": "evt_support_123",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_support_123",
                    "metadata": {"type": "support_contribution"},
                }
            },
        }

        response = self.client.post(
            "/api/webhooks/stripe",
            data=json.dumps(payload),
            content_type="application/json",
        )

        contribution.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(contribution.status, SupportContribution.STATUS_SUCCEEDED)
