from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from rest_framework import serializers

from apps.accounts.models import UserVerification
from apps.accounts.services import generate_unique_username, get_user_from_reset_uid
from apps.birthdays.services import is_birthday_profile_complete


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "password")

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def create(self, validated_data):
        password = validated_data.pop("password")
        username = generate_unique_username(
            validated_data["email"],
            validated_data.get("first_name", ""),
            validated_data.get("last_name", ""),
        )
        validated_data["username"] = username
        return User.objects.create_user(password=password, **validated_data)


class UserVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserVerification
        fields = ("email_verified_at", "phone_verified_at", "phone_number", "risk_flags")
        read_only_fields = ("email_verified_at", "phone_verified_at", "risk_flags")


class MeSerializer(serializers.ModelSerializer):
    verification = UserVerificationSerializer(read_only=True)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    birthday_profile_slug = serializers.SerializerMethodField(read_only=True)
    birthday_profile_completed = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "verification",
            "phone_number",
            "birthday_profile_slug",
            "birthday_profile_completed",
        )
        read_only_fields = ("id", "email", "is_staff")

    def get_birthday_profile_slug(self, obj):
        profile = getattr(obj, "birthday_profile", None)
        return getattr(profile, "slug", None)

    def get_birthday_profile_completed(self, obj):
        return is_birthday_profile_complete(obj)

    def update(self, instance, validated_data):
        phone_number = validated_data.pop("phone_number", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if phone_number is not None:
            verification, _ = UserVerification.objects.get_or_create(user=instance)
            verification.phone_number = phone_number
            verification.save(update_fields=["phone_number"])
        return instance


class ForgotPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class ForgotPasswordConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        user = get_user_from_reset_uid(attrs["uid"])
        if not user.is_active:
            raise serializers.ValidationError("Invalid password reset link.")
        if not self.context["token_generator"].check_token(user, attrs["token"]):
            raise serializers.ValidationError("Invalid or expired password reset token.")
        validate_password(attrs["new_password"], user=user)
        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["request"].user)
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
