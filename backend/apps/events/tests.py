from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.birthdays.models import BirthdayProfile
from apps.events.models import BirthdayEvent, EventApplication
from apps.payments.models import ConnectAccount, EventPayment
from apps.events.tasks import cancel_and_refund_event, scan_lock_deadlines


class EventFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.host = User.objects.create_user(username="host", password="password123")
        self.attendee = User.objects.create_user(username="attendee", password="password123")
        self.other = User.objects.create_user(username="other", password="password123")
        BirthdayProfile.objects.create(user=self.host, slug="host-profile", day=1, month=1, hide_year=True, bio="", preferences={}, visibility="PUBLIC")
        BirthdayProfile.objects.create(user=self.attendee, slug="attendee-profile", day=1, month=1, hide_year=True, bio="", preferences={}, visibility="PUBLIC")
        BirthdayProfile.objects.create(user=self.other, slug="other-profile", day=1, month=1, hide_year=True, bio="", preferences={}, visibility="PUBLIC")
        self.attendee.verification.phone_verified_at = timezone.now()
        self.attendee.verification.save(update_fields=["phone_verified_at"])
        self.other.verification.phone_verified_at = timezone.now()
        self.other.verification.save(update_fields=["phone_verified_at"])

    def make_event(self, **overrides):
        payload = {
            "host": self.host,
            "payee_user": self.host,
            "title": "Rooftop Dinner",
            "description": "Private dinner",
            "agenda": "Eat",
            "category": "DINING",
            "start_at": timezone.now() + timedelta(days=7),
            "end_at": timezone.now() + timedelta(days=7, hours=3),
            "visibility": BirthdayEvent.VISIBILITY_DISCOVERABLE,
            "expand_to_strangers": False,
            "location_point": Point(-2.2426, 53.4808, srid=4326),
            "radius_meters": 10000,
            "approx_area_label": "Northern Quarter",
            "min_guests": 1,
            "max_guests": 2,
            "criteria": {},
            "payment_mode": BirthdayEvent.PAYMENT_MODE_FREE,
            "amount": "0.00",
            "currency": "GBP",
            "state": BirthdayEvent.STATE_OPEN,
            "venue_status": BirthdayEvent.VENUE_NOT_SET,
            "lock_deadline_at": timezone.now() + timedelta(days=5),
        }
        payload.update(overrides)
        return BirthdayEvent.objects.create(**payload)

    def test_feed_respects_discoverability_rules(self):
        visible = self.make_event(title="Visible", visibility=BirthdayEvent.VISIBILITY_DISCOVERABLE)
        expanded = self.make_event(
            title="Expanded",
            visibility=BirthdayEvent.VISIBILITY_INVITE_ONLY,
            expand_to_strangers=True,
            location_point=Point(-2.24, 53.48, srid=4326),
        )
        self.make_event(
            title="Hidden invite",
            visibility=BirthdayEvent.VISIBILITY_INVITE_ONLY,
            expand_to_strangers=False,
            location_point=Point(-2.25, 53.49, srid=4326),
        )
        self.make_event(
            title="Cancelled",
            visibility=BirthdayEvent.VISIBILITY_DISCOVERABLE,
            state=BirthdayEvent.STATE_CANCELLED,
            location_point=Point(-2.26, 53.47, srid=4326),
        )

        response = self.client.get("/api/events/feed", {"lat": 53.4808, "lng": -2.2426, "radius": 5000})

        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.json()]
        self.assertEqual(ids, [visible.id, expanded.id])

    def test_application_approval_enforces_capacity(self):
        event = self.make_event(max_guests=1)
        app_one = EventApplication.objects.create(event=event, applicant=self.attendee)
        app_two = EventApplication.objects.create(event=event, applicant=self.other)
        self.client.force_authenticate(user=self.host)

        approve_one = self.client.post(f"/api/events/{event.id}/applications/{app_one.id}/approve")
        approve_two = self.client.post(f"/api/events/{event.id}/applications/{app_two.id}/approve")

        self.assertEqual(approve_one.status_code, 200)
        self.assertEqual(approve_two.status_code, 400)

    def test_event_creation_requires_completed_birthday_profile(self):
        self.client.force_authenticate(user=self.host)
        payload = {
            "title": "Brunch",
            "description": "Weekend brunch gathering.",
            "agenda": "Eat and celebrate.",
            "category": "DINING",
            "start_at": (timezone.now() + timedelta(days=3)).isoformat(),
            "end_at": (timezone.now() + timedelta(days=3, hours=2)).isoformat(),
            "visibility": BirthdayEvent.VISIBILITY_DISCOVERABLE,
            "expand_to_strangers": False,
            "location_point": {"lng": -2.2426, "lat": 53.4808},
            "radius_meters": 5000,
            "approx_area_label": "Northern Quarter",
            "min_guests": 2,
            "max_guests": 6,
            "criteria": {},
            "payment_mode": BirthdayEvent.PAYMENT_MODE_FREE,
            "amount": "0.00",
            "target_amount": "180.00",
            "currency": "GBP",
            "expense_breakdown": "Venue deposit: 90\nCake and flowers: 90",
            "lock_deadline_at": (timezone.now() + timedelta(days=2)).isoformat(),
        }

        blocked = self.client.post("/api/events", payload, format="json")

        host_profile = self.host.birthday_profile
        host_profile.bio = "Host profile"
        host_profile.gender = "MALE"
        host_profile.date_of_birth = timezone.now().date() - timedelta(days=30 * 365)
        host_profile.marital_status = "SINGLE"
        host_profile.occupation = "Designer"
        host_profile.preferences = {"interests": ["brunch"]}
        host_profile.social_links = {"instagram": "https://instagram.com/host"}
        host_profile.save(
            update_fields=[
                "bio",
                "gender",
                "date_of_birth",
                "marital_status",
                "occupation",
                "preferences",
                "social_links",
            ]
        )

        allowed = self.client.post("/api/events", payload, format="json")

        self.assertEqual(blocked.status_code, 400)
        self.assertEqual(allowed.status_code, 201)
        self.assertEqual(allowed.json()["target_amount"], "180.00")
        self.assertEqual(allowed.json()["expense_breakdown"], "Venue deposit: 90\nCake and flowers: 90")

    @patch("apps.payments.services.stripe.PaymentIntent.create")
    def test_payment_intent_creation_requires_approval(self, payment_intent_create):
        payment_intent_create.return_value = {"id": "pi_123", "client_secret": "secret_123"}
        event = self.make_event(payment_mode=BirthdayEvent.PAYMENT_MODE_PAID, amount="25.00")
        EventApplication.objects.create(event=event, applicant=self.attendee, status=EventApplication.STATUS_PENDING)
        self.client.force_authenticate(user=self.attendee)

        pending_response = self.client.post(f"/api/events/{event.id}/payment/create-intent")
        self.assertEqual(pending_response.status_code, 400)

        application = EventApplication.objects.get(event=event, applicant=self.attendee)
        application.status = EventApplication.STATUS_APPROVED
        application.save(update_fields=["status"])

        approved_response = self.client.post(f"/api/events/{event.id}/payment/create-intent")

        self.assertEqual(approved_response.status_code, 200)
        self.assertEqual(approved_response.json()["stripe_payment_intent_id"], "pi_123")

    @patch("apps.events.tasks.refund_event_payment")
    def test_cancel_and_refund_event_task_cancels_and_refunds_held_payments(self, refund_event_payment_mock):
        event = self.make_event(payment_mode=BirthdayEvent.PAYMENT_MODE_PAID)
        application = EventApplication.objects.create(
            event=event,
            applicant=self.attendee,
            status=EventApplication.STATUS_APPROVED,
        )
        EventPayment.objects.create(
            event=event,
            attendee=self.attendee,
            application=application,
            amount="25.00",
            currency="GBP",
            status=EventPayment.STATUS_HELD_ESCROW,
        )

        result = cancel_and_refund_event(event.id)

        event.refresh_from_db()
        self.assertEqual(result["status"], "cancelled")
        self.assertEqual(result["refunded_count"], 1)
        self.assertEqual(event.state, BirthdayEvent.STATE_CANCELLED)
        refund_event_payment_mock.assert_called_once()

    @patch("apps.events.tasks.cancel_and_refund_event.delay")
    def test_scan_lock_deadlines_queues_only_failed_events(self, delay_mock):
        due_event = self.make_event(
            lock_deadline_at=timezone.now() - timedelta(minutes=1),
            min_guests=2,
            venue_status=BirthdayEvent.VENUE_NOT_SET,
        )
        EventApplication.objects.create(
            event=due_event,
            applicant=self.attendee,
            status=EventApplication.STATUS_APPROVED,
        )
        safe_event = self.make_event(
            lock_deadline_at=timezone.now() - timedelta(minutes=1),
            venue_status=BirthdayEvent.VENUE_CONFIRMED,
            state=BirthdayEvent.STATE_MIN_MET,
        )
        EventApplication.objects.create(
            event=safe_event,
            applicant=self.other,
            status=EventApplication.STATUS_APPROVED,
        )

        result = scan_lock_deadlines()

        self.assertEqual(result["checked"], 2)
        self.assertEqual(result["queued_cancellations"], 1)
        delay_mock.assert_called_once_with(due_event.id)

    def test_paid_event_lock_requires_payout_enabled_connect_account(self):
        event = self.make_event(
            payment_mode=BirthdayEvent.PAYMENT_MODE_PAID,
            amount="25.00",
            venue_status=BirthdayEvent.VENUE_CONFIRMED,
            min_guests=1,
        )
        app = EventApplication.objects.create(
            event=event,
            applicant=self.attendee,
            status=EventApplication.STATUS_APPROVED,
        )
        self.client.force_authenticate(user=self.host)

        no_connect = self.client.post(f"/api/events/{event.id}/lock")
        ConnectAccount.objects.create(
            user=self.host,
            stripe_account_id="acct_lock_test",
            charges_enabled=True,
            payouts_enabled=False,
            requirements={},
            details_submitted=True,
        )
        disabled_payout = self.client.post(f"/api/events/{event.id}/lock")
        self.host.connect_account.payouts_enabled = True
        self.host.connect_account.save(update_fields=["payouts_enabled"])
        with patch("apps.payments.services.release_event_transfers"):
            success = self.client.post(f"/api/events/{event.id}/lock")

        self.assertEqual(no_connect.status_code, 400)
        self.assertEqual(disabled_payout.status_code, 400)
        self.assertEqual(success.status_code, 200)

    def test_complete_endpoint_marks_past_event_completed(self):
        event = self.make_event(
            start_at=timezone.now() - timedelta(hours=2),
            end_at=timezone.now() - timedelta(hours=1),
            state=BirthdayEvent.STATE_LOCKED,
        )
        self.client.force_authenticate(user=self.host)

        response = self.client.post(f"/api/events/{event.id}/complete")

        event.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(event.state, BirthdayEvent.STATE_COMPLETED)

    def test_host_application_list_includes_applicant_profile_and_social_links(self):
        event = self.make_event()
        self.attendee.first_name = "Ada"
        self.attendee.last_name = "Stone"
        self.attendee.email = "ada@example.com"
        self.attendee.save(update_fields=["first_name", "last_name", "email"])
        profile = self.attendee.birthday_profile
        profile.bio = "Designer and brunch person."
        profile.preferences = {"interests": ["brunch", "galleries"]}
        profile.social_links = {"instagram": "https://instagram.com/adastone"}
        profile.gender = "FEMALE"
        profile.marital_status = "SINGLE"
        profile.occupation = "Designer"
        profile.save(update_fields=["bio", "preferences", "social_links", "gender", "marital_status", "occupation"])
        EventApplication.objects.create(event=event, applicant=self.attendee, intro_message="I'd love to join.")
        self.client.force_authenticate(user=self.host)

        response = self.client.get(f"/api/events/{event.id}/applications")

        self.assertEqual(response.status_code, 200)
        payload = response.json()[0]["applicant_profile"]
        self.assertEqual(payload["first_name"], "Ada")
        self.assertEqual(payload["social_links"]["instagram"], "https://instagram.com/adastone")
        self.assertEqual(payload["gender"], "FEMALE")
        self.assertEqual(payload["occupation"], "Designer")
        self.assertTrue(payload["phone_verified"])

    def test_event_detail_includes_host_profile_for_viewers(self):
        host_profile = self.host.birthday_profile
        host_profile.bio = "Birthday host with a love for rooftop dinners."
        host_profile.preferences = {"interests": ["dining", "music"]}
        host_profile.social_links = {"instagram": "https://instagram.com/host"}
        host_profile.gender = "MALE"
        host_profile.marital_status = "SINGLE"
        host_profile.occupation = "Creative Director"
        host_profile.save(update_fields=["bio", "preferences", "social_links", "gender", "marital_status", "occupation"])
        self.host.first_name = "Ezra"
        self.host.last_name = "Cole"
        self.host.save(update_fields=["first_name", "last_name"])
        event = self.make_event()

        response = APIClient().get(f"/api/events/{event.id}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()["host_profile"]
        self.assertEqual(payload["first_name"], "Ezra")
        self.assertEqual(payload["social_links"]["instagram"], "https://instagram.com/host")
        self.assertEqual(payload["occupation"], "Creative Director")

    def test_apply_enforces_gender_age_marital_status_and_occupation_criteria(self):
        event = self.make_event(
            criteria={
                "allowed_genders": ["FEMALE"],
                "min_age": 25,
                "max_age": 35,
                "allowed_marital_statuses": ["SINGLE"],
                "allowed_occupations": ["Designer"],
            }
        )
        profile = self.attendee.birthday_profile
        profile.gender = "MALE"
        profile.date_of_birth = timezone.now().date() - timedelta(days=30 * 365)
        profile.marital_status = "MARRIED"
        profile.occupation = "Engineer"
        profile.save(update_fields=["gender", "date_of_birth", "marital_status", "occupation"])
        self.client.force_authenticate(user=self.attendee)

        wrong_gender = self.client.post(f"/api/events/{event.id}/apply", {"intro_message": "Please accept me."}, format="json")

        profile.gender = "FEMALE"
        profile.marital_status = "SINGLE"
        profile.occupation = "Designer"
        profile.date_of_birth = timezone.now().date() - timedelta(days=28 * 365)
        profile.save(update_fields=["gender", "marital_status", "occupation", "date_of_birth"])
        accepted = self.client.post(f"/api/events/{event.id}/apply", {"intro_message": "Please accept me."}, format="json")

        self.assertEqual(wrong_gender.status_code, 400)
        self.assertEqual(accepted.status_code, 201)

    def test_apply_requires_completed_birthday_profile(self):
        event = self.make_event()
        self.client.force_authenticate(user=self.attendee)

        blocked = self.client.post(f"/api/events/{event.id}/apply", {"intro_message": "Please accept me."}, format="json")

        profile = self.attendee.birthday_profile
        profile.bio = "Love birthday dinners."
        profile.gender = "FEMALE"
        profile.date_of_birth = timezone.now().date() - timedelta(days=29 * 365)
        profile.marital_status = "SINGLE"
        profile.occupation = "Designer"
        profile.preferences = {"interests": ["dining"]}
        profile.social_links = {"instagram": "https://instagram.com/attendee"}
        profile.save(
            update_fields=[
                "bio",
                "gender",
                "date_of_birth",
                "marital_status",
                "occupation",
                "preferences",
                "social_links",
            ]
        )

        allowed = self.client.post(f"/api/events/{event.id}/apply", {"intro_message": "Please accept me."}, format="json")

        self.assertEqual(blocked.status_code, 400)
        self.assertEqual(allowed.status_code, 201)

    def test_host_can_create_and_list_invite_codes_for_published_invite_only_event(self):
        event = self.make_event(
            visibility=BirthdayEvent.VISIBILITY_INVITE_ONLY,
        )
        self.client.force_authenticate(user=self.host)

        create_response = self.client.post(
            f"/api/events/{event.id}/invites",
            {"max_uses": 3},
            format="json",
        )
        list_response = self.client.get(f"/api/events/{event.id}/invites")

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.json()["max_uses"], 3)
        self.assertTrue(create_response.json()["code"])
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)

    def test_cannot_create_invite_codes_for_draft_event(self):
        event = self.make_event(
            visibility=BirthdayEvent.VISIBILITY_INVITE_ONLY,
            state=BirthdayEvent.STATE_DRAFT,
        )
        self.client.force_authenticate(user=self.host)

        response = self.client.post(f"/api/events/{event.id}/invites", {"max_uses": 2}, format="json")

        self.assertEqual(response.status_code, 400)
