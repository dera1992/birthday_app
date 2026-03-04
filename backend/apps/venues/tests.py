from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from apps.venues.models import ReferralClick, VenuePartner


class VenueApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="venue-user", password="password123")
        self.venue = VenuePartner.objects.create(
            name="Sky Lounge",
            city="Manchester",
            category="DINING",
            approx_area_label="Central",
            referral_url="https://example.com/venue",
            is_active=True,
        )
        VenuePartner.objects.create(
            name="Other Venue",
            city="London",
            category="PARTY",
            approx_area_label="Zone 1",
            referral_url="https://example.com/other",
            is_active=True,
        )

    def test_recommendations_filter(self):
        response = self.client.get("/api/venues/recommendations", {"city": "Manchester", "category": "DINING"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["name"], "Sky Lounge")

    def test_click_tracks_referral(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/venues/{self.venue.id}/click", format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["redirect_url"], self.venue.referral_url)
        self.assertEqual(ReferralClick.objects.filter(venue=self.venue, user=self.user).count(), 1)
