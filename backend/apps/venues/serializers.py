from django.db.models import Avg, Count
from rest_framework import serializers

from apps.venues.models import VenuePartner


class VenuePartnerSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = VenuePartner
        fields = ("id", "name", "city", "category", "approx_area_label", "referral_url", "is_sponsored", "priority", "neighborhood_tags", "avg_rating", "rating_count")

    def get_avg_rating(self, obj):
        result = obj.ratings.aggregate(avg=Avg("score"))["avg"]
        return round(result, 1) if result is not None else None

    def get_rating_count(self, obj):
        return obj.ratings.count()


class VenueAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenuePartner
        fields = ("id", "name", "city", "category", "approx_area_label", "referral_url", "is_active", "is_sponsored", "priority", "neighborhood_tags")
