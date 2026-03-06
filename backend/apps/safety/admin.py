from django.contrib import admin
from django.utils import timezone

from apps.safety.models import EventRating, UserBlock, UserReport


@admin.register(UserBlock)
class UserBlockAdmin(admin.ModelAdmin):
    list_display = ("blocker", "blocked", "created_at")
    search_fields = ("blocker__username", "blocked__username")


def _mark_status(status_value):
    def action(modeladmin, request, queryset):
        queryset.update(
            status=status_value,
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )
    action.short_description = f"Mark selected as {status_value.lower()}"
    action.__name__ = f"mark_{status_value.lower()}"
    return action


mark_reviewed = _mark_status(UserReport.STATUS_REVIEWED)
mark_dismissed = _mark_status(UserReport.STATUS_DISMISSED)
mark_actioned = _mark_status(UserReport.STATUS_ACTIONED)


@admin.register(UserReport)
class UserReportAdmin(admin.ModelAdmin):
    list_display = ("reporter", "reported_user", "event", "reason", "status", "reviewed_by", "created_at")
    search_fields = ("reporter__username", "reported_user__username", "event__title", "reason", "details")
    list_filter = ("status", "created_at")
    readonly_fields = ("reporter", "reported_user", "event", "reason", "details", "created_at", "reviewed_at")
    fields = ("reporter", "reported_user", "event", "reason", "details", "created_at", "status", "reviewed_by", "admin_note", "reviewed_at")
    actions = [mark_reviewed, mark_dismissed, mark_actioned]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Pending reports first, then newest
        return qs.extra(
            select={"is_pending": "status = 'PENDING'"}
        ).order_by("-is_pending", "-created_at")


@admin.register(EventRating)
class EventRatingAdmin(admin.ModelAdmin):
    list_display = ("event", "rater", "rating", "created_at")
    search_fields = ("event__title", "rater__username", "review")
    list_filter = ("rating",)
