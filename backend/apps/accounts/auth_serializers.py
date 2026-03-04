from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    default_error_messages = {
        "no_active_account": "No active account found with the given email and password.",
    }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        return token

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError(self.error_messages["no_active_account"])
        if not user.is_active or not user.check_password(password):
            raise serializers.ValidationError(self.error_messages["no_active_account"])
        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
