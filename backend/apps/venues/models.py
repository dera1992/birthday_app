from django.conf import settings
from django.db import models


class VenuePartner(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=128)
    category = models.CharField(max_length=64)
    approx_area_label = models.CharField(max_length=255, blank=True)
    referral_url = models.URLField()
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0)
    is_sponsored = models.BooleanField(default=False)
    neighborhood_tags = models.JSONField(default=list)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)


class ReferralClick(models.Model):
    venue = models.ForeignKey(VenuePartner, on_delete=models.CASCADE, related_name="referral_clicks")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class VenueRating(models.Model):
    venue = models.ForeignKey(VenuePartner, on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="venue_ratings")
    score = models.PositiveSmallIntegerField()  # 1–5
    review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("user", "venue")]
