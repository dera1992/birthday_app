from decimal import Decimal

from rest_framework import serializers

from apps.birthdays.models import BirthdayProfile, SupportContribution, SupportMessage, WishlistContribution, WishlistItem, WishlistReservation

MAX_CONTRIBUTION_TARGET = Decimal("100.00")


class WishlistReservationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistReservation
        fields = ("reserver_name", "reserver_email")


class WishlistItemWriteSerializer(serializers.ModelSerializer):
    referral_product_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = WishlistItem
        fields = (
            "title",
            "description",
            "external_url",
            "price",
            "currency",
            "visibility",
            "source_type",
            "referral_product_id",
            "allow_contributions",
            "contribution_public",
            "target_amount",
        )
        extra_kwargs = {
            "visibility": {"required": False},
            "source_type": {"required": False},
            "allow_contributions": {"required": False},
            "contribution_public": {"required": False},
            "target_amount": {"required": False},
        }

    def validate_target_amount(self, value):
        if value is not None and value > MAX_CONTRIBUTION_TARGET:
            raise serializers.ValidationError("Contribution target cannot exceed £100.")
        if value is not None and value <= 0:
            raise serializers.ValidationError("Contribution target must be positive.")
        return value

    def validate(self, attrs):
        allow_contributions = attrs.get(
            "allow_contributions",
            self.instance.allow_contributions if self.instance else False,
        )
        target_amount = attrs.get(
            "target_amount",
            self.instance.target_amount if self.instance else None,
        )
        if allow_contributions and target_amount is None:
            raise serializers.ValidationError(
                {"target_amount": "A target amount is required when contributions are enabled."}
            )
        return attrs


class WishlistContributionWriteSerializer(serializers.ModelSerializer):
    contributor_name = serializers.CharField(required=False, allow_blank=True)
    contributor_email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = WishlistContribution
        fields = ("amount", "currency", "contributor_name", "contributor_email")


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
