from rest_framework import serializers

from apps.events.models import BirthdayEvent, EventApplication, EventInvite
from apps.events.pack_serializers import CuratedPackReadSerializer
from apps.events.write_serializers import PointFieldSerializer


class BirthdayEventReadSerializer(serializers.ModelSerializer):
    location_point = PointFieldSerializer()
    approved_count = serializers.IntegerField(read_only=True)
    distance_meters = serializers.FloatField(read_only=True)
    host_profile = serializers.SerializerMethodField()
    my_application = serializers.SerializerMethodField()
    pending_application_count = serializers.SerializerMethodField()
    pack = CuratedPackReadSerializer(read_only=True)

    class Meta:
        model = BirthdayEvent
        fields = (
            "id",
            "host",
            "host_profile",
            "payee_user",
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
            "pack",
            "payment_mode",
            "amount",
            "target_amount",
            "currency",
            "expense_breakdown",
            "state",
            "venue_status",
            "venue_name",
            "lock_deadline_at",
            "approved_count",
            "distance_meters",
            "my_application",
            "pending_application_count",
            "created_at",
            "updated_at",
        )

    def get_my_application(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        app = obj.applications.filter(applicant=request.user).first()
        if not app:
            return None
        return {"id": app.id, "status": app.status}

    def get_pending_application_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        if obj.host_id != request.user.id:
            return None
        return obj.applications.filter(status=EventApplication.STATUS_PENDING).count()

    def get_host_profile(self, obj):
        profile = getattr(obj.host, "birthday_profile", None)
        verification = getattr(obj.host, "verification", None)
        return {
            "first_name": obj.host.first_name,
            "last_name": obj.host.last_name,
            "slug": getattr(profile, "slug", ""),
            "bio": getattr(profile, "bio", ""),
            "preferences": getattr(profile, "preferences", {}) or {},
            "social_links": getattr(profile, "social_links", {}) or {},
            "gender": getattr(profile, "gender", ""),
            "marital_status": getattr(profile, "marital_status", ""),
            "occupation": getattr(profile, "occupation", ""),
            "phone_verified": bool(getattr(verification, "phone_verified_at", None)),
            "email_verified": bool(getattr(verification, "email_verified_at", None)),
        }


class EventApplicationReadSerializer(serializers.ModelSerializer):
    applicant_profile = serializers.SerializerMethodField()

    class Meta:
        model = EventApplication
        fields = (
            "id",
            "event",
            "applicant",
            "intro_message",
            "invite_code_used",
            "status",
            "approved_at",
            "created_at",
            "applicant_profile",
        )

    def get_applicant_profile(self, obj):
        profile = getattr(obj.applicant, "birthday_profile", None)
        verification = getattr(obj.applicant, "verification", None)
        return {
            "first_name": obj.applicant.first_name,
            "last_name": obj.applicant.last_name,
            "email": obj.applicant.email,
            "bio": getattr(profile, "bio", ""),
            "slug": getattr(profile, "slug", ""),
            "preferences": getattr(profile, "preferences", {}) or {},
            "social_links": getattr(profile, "social_links", {}) or {},
            "gender": getattr(profile, "gender", ""),
            "date_of_birth": getattr(profile, "date_of_birth", None),
            "marital_status": getattr(profile, "marital_status", ""),
            "occupation": getattr(profile, "occupation", ""),
            "phone_verified": bool(getattr(verification, "phone_verified_at", None)),
            "email_verified": bool(getattr(verification, "email_verified_at", None)),
        }


class EventInviteReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventInvite
        fields = ("id", "event", "code", "max_uses", "used_count", "expires_at")
