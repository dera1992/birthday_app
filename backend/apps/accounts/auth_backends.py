from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User


class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        email = kwargs.get("email")
        identifier = (email or username or "").strip().lower()
        if not identifier or not password:
            return None

        user = User.objects.filter(email__iexact=identifier).first()
        if user is None:
            user = User.objects.filter(username=identifier).first()
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
