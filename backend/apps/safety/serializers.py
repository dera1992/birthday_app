from rest_framework import serializers

from apps.safety.models import EventRating, UserBlock, UserReport


class UserBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBlock
        fields = ("id", "blocked", "created_at")
        read_only_fields = ("id", "created_at")


class UserReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserReport
        fields = ("id", "reported_user", "event", "reason", "details", "created_at")
        read_only_fields = ("id", "created_at")


class EventRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRating
        fields = ("id", "rating", "review", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
