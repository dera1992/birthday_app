from django.conf import settings
from django.db import models


class VenuePartner(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=128)
    category = models.CharField(max_length=64)
    approx_area_label = models.CharField(max_length=255, blank=True)
    referral_url = models.URLField()
    is_active = models.BooleanField(default=True)


class ReferralClick(models.Model):
    venue = models.ForeignKey(VenuePartner, on_delete=models.CASCADE, related_name="referral_clicks")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
