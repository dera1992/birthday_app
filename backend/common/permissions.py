from rest_framework.permissions import BasePermission


class IsProfileOwner(BasePermission):
    message = "Only the profile owner can perform this action."

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None) or getattr(getattr(obj, "profile", None), "user", None)
        return bool(request.user and request.user.is_authenticated and owner == request.user)


class IsEventHost(BasePermission):
    message = "Only the event host can perform this action."

    def has_object_permission(self, request, view, obj):
        host = getattr(obj, "host", None) or getattr(getattr(obj, "event", None), "host", None)
        return bool(request.user and request.user.is_authenticated and host == request.user)
