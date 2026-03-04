from rest_framework import serializers

from apps.birthdays.models import BirthdayProfile, SupportContribution, SupportMessage, WishlistItem, WishlistReservation


class WishlistReservationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistReservation
        fields = ("reserver_name", "reserver_email")


class WishlistItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistItem
        fields = ("title", "description", "external_url", "price", "currency")


class SupportMessageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportMessage
        fields = ("sender_name", "body")


class BirthdayProfileWriteSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = BirthdayProfile
        fields = (
            "slug",
            "day",
            "month",
            "hide_year",
            "bio",
            "preferences",
            "social_links",
            "gender",
            "date_of_birth",
            "marital_status",
            "occupation",
            "visibility",
            "profile_image",
        )
        extra_kwargs = {
            "day": {"required": False},
            "month": {"required": False},
        }

    def validate(self, attrs):
        date_of_birth = attrs.get("date_of_birth")
        if date_of_birth:
            attrs["day"] = date_of_birth.day
            attrs["month"] = date_of_birth.month
            return attrs

        if self.instance:
            return attrs

        if "day" not in attrs or "month" not in attrs:
            raise serializers.ValidationError("date_of_birth is required to derive birthday day and month.")
        return attrs


class SupportContributionWriteSerializer(serializers.ModelSerializer):
    supporter_name = serializers.CharField(required=False, allow_blank=True)
    supporter_email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = SupportContribution
        fields = ("amount", "currency", "supporter_name", "supporter_email")
