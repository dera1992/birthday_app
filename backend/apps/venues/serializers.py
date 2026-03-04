from rest_framework import serializers

from apps.venues.models import VenuePartner


class VenuePartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenuePartner
        fields = ("id", "name", "city", "category", "approx_area_label", "referral_url", "is_sponsored", "priority", "neighborhood_tags")


class VenueAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenuePartner
        fields = ("id", "name", "city", "category", "approx_area_label", "referral_url", "is_active", "is_sponsored", "priority", "neighborhood_tags")
