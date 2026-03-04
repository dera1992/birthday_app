from django.contrib.gis.geos import Point
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field, inline_serializer

from apps.events.models import BirthdayEvent, CuratedPack, EventApplication, EventInvite


@extend_schema_field(
    inline_serializer(
        name="PointValue",
        fields={
            "lng": serializers.FloatField(),
            "lat": serializers.FloatField(),
        },
    )
)
class PointFieldSerializer(serializers.Field):
    def to_representation(self, value):
        return {"lng": value.x, "lat": value.y}

    def to_internal_value(self, data):
        try:
            lng = float(data["lng"])
            lat = float(data["lat"])
        except (KeyError, TypeError, ValueError):
            raise serializers.ValidationError("location_point must contain numeric lat and lng.")
        return Point(lng, lat, srid=4326)


class BirthdayEventWriteSerializer(serializers.ModelSerializer):
    location_point = PointFieldSerializer()
    pack_slug = serializers.SlugField(write_only=True, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = BirthdayEvent
        fields = (
            "pack_slug",
            "title",
            "description",
            "agenda",
            "category",
            "start_at",
            "end_at",
            "visibility",
            "expand_to_strangers",
            "location_point",
            "radius_meters",
            "approx_area_label",
            "min_guests",
            "max_guests",
            "criteria",
            "payment_mode",
            "amount",
            "target_amount",
            "currency",
            "expense_breakdown",
            "lock_deadline_at",
        )

    def validate_pack_slug(self, value):
        if not value:
            return None
        if not CuratedPack.objects.filter(slug=value, is_active=True).exists():
            raise serializers.ValidationError("Pack not found or inactive.")
        return value


class EventApplicationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventApplication
        fields = ("intro_message", "invite_code_used")


class EventInviteWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventInvite
        fields = ("max_uses", "expires_at")

    def validate_max_uses(self, value):
        if value < 0:
            raise serializers.ValidationError("max_uses cannot be negative.")
        return value
