from rest_framework import serializers

from apps.birthdays.models import BirthdayProfile, ReferralProduct, SupportContribution, SupportMessage, WishlistContribution, WishlistItem, WishlistReservation


class ReferralProductReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralProduct
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "description",
            "price",
            "currency",
            "image_url",
            "affiliate_url",
            "merchant_name",
        )


class WishlistReservationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistReservation
        fields = ("id", "reserver_name", "reserver_email", "reserved_at")


class WishlistContributionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistContribution
        fields = (
            "id",
            "contributor_name",
            "contributor_email",
            "amount",
            "currency",
            "status",
            "stripe_payment_intent_id",
            "created_at",
        )


class WishlistItemReadSerializer(serializers.ModelSerializer):
    reservation = WishlistReservationReadSerializer(read_only=True)
    referral_product = ReferralProductReadSerializer(read_only=True)
    remaining_amount = serializers.SerializerMethodField()
    is_fully_funded = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = (
            "id",
            "title",
            "description",
            "external_url",
            "price",
            "currency",
            "is_reserved",
            "reservation",
            "visibility",
            "source_type",
            "referral_product",
            "allow_contributions",
            "contribution_public",
            "target_amount",
            "amount_raised",
            "remaining_amount",
            "is_fully_funded",
            "created_at",
        )

    def get_remaining_amount(self, obj):
        if obj.target_amount is None:
            return None
        return max(obj.target_amount - obj.amount_raised, 0)

    def get_is_fully_funded(self, obj):
        if not obj.allow_contributions or obj.target_amount is None:
            return False
        return obj.amount_raised >= obj.target_amount


class SupportMessageReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportMessage
        fields = (
            "id",
            "sender_name",
            "body",
            "moderation_status",
            "created_at",
            "celebrant_reaction",
            "reply_text",
            "reply_created_at",
        )


class BirthdayProfileReadSerializer(serializers.ModelSerializer):
    wishlist_items = WishlistItemReadSerializer(many=True, read_only=True)
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()

    class Meta:
        model = BirthdayProfile
        fields = (
            "id",
            "user",
            "slug",
            "first_name",
            "last_name",
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
            "wishlist_items",
            "created_at",
            "updated_at",
        )

    def get_first_name(self, obj):
        return obj.user.first_name

    def get_last_name(self, obj):
        return obj.user.last_name


class SupportContributionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportContribution
        fields = (
            "id",
            "amount",
            "currency",
            "status",
            "stripe_payment_intent_id",
            "supporter_name",
            "supporter_email",
            "created_at",
        )
