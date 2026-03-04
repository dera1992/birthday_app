from datetime import timedelta

from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.events.models import BirthdayEvent, EventApplication, EventAttendee
from apps.safety.models import EventRating, UserBlock, UserReport


class SafetyApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = User.objects.create_user(username="reporter", password="password123")
        self.reported = User.objects.create_user(username="reported", password="password123")
        self.event = BirthdayEvent.objects.create(
            host=self.reported,
            payee_user=self.reported,
            title="Safety Event",
            description="",
            agenda="",
            category="DINING",
            start_at=timezone.now() + timedelta(days=2),
            end_at=timezone.now() + timedelta(days=2, hours=2),
            visibility=BirthdayEvent.VISIBILITY_DISCOVERABLE,
            expand_to_strangers=False,
            location_point=Point(-2.2426, 53.4808, srid=4326),
            radius_meters=5000,
            approx_area_label="Central",
            min_guests=1,
            max_guests=5,
            criteria={},
            payment_mode=BirthdayEvent.PAYMENT_MODE_FREE,
            amount="0.00",
            currency="GBP",
            state=BirthdayEvent.STATE_OPEN,
            venue_status=BirthdayEvent.VENUE_NOT_SET,
            lock_deadline_at=timezone.now() + timedelta(days=1),
        )
        self.client.force_authenticate(user=self.reporter)

    def test_report_block_and_rate(self):
        report = self.client.post(
            "/api/reports",
            {"reported_user": self.reported.id, "event": self.event.id, "reason": "Spam", "details": "Details"},
            format="json",
        )
        block = self.client.post(
            "/api/blocks",
            {"blocked": self.reported.id},
            format="json",
        )
        rating = self.client.post(
            f"/api/events/{self.event.id}/ratings",
            {"rating": 5, "review": "Great"},
            format="json",
        )

        self.assertEqual(report.status_code, 201)
        self.assertEqual(block.status_code, 201)
        self.assertEqual(rating.status_code, 400)
        self.assertEqual(UserReport.objects.count(), 1)
        self.assertEqual(UserBlock.objects.count(), 1)
        self.assertEqual(EventRating.objects.count(), 0)

    def test_rating_requires_completed_and_attended(self):
        EventApplication.objects.create(
            event=self.event,
            applicant=self.reporter,
            status=EventApplication.STATUS_APPROVED,
        )
        EventAttendee.objects.create(event=self.event, user=self.reporter)

        not_completed = self.client.post(
            f"/api/events/{self.event.id}/ratings",
            {"rating": 4, "review": "Good"},
            format="json",
        )
        self.event.state = BirthdayEvent.STATE_COMPLETED
        self.event.save(update_fields=["state"])
        completed = self.client.post(
            f"/api/events/{self.event.id}/ratings",
            {"rating": 4, "review": "Good"},
            format="json",
        )

        self.assertEqual(not_completed.status_code, 400)
        self.assertEqual(completed.status_code, 201)
        self.assertEqual(EventRating.objects.count(), 1)
