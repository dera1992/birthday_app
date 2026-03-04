from rest_framework import serializers

from apps.venues.models import VenuePartner


class VenuePartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenuePartner
        fields = ("id", "name", "city", "category", "approx_area_label", "referral_url")
