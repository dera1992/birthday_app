from rest_framework import serializers

from apps.birthdays.models import BirthdayProfile, SupportContribution, SupportMessage, WishlistItem, WishlistReservation


class WishlistReservationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistReservation
        fields = ("id", "reserver_name", "reserver_email", "reserved_at")


class WishlistItemReadSerializer(serializers.ModelSerializer):
    reservation = WishlistReservationReadSerializer(read_only=True)

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
            "created_at",
        )


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
