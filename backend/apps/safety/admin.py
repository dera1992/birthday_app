from django.contrib import admin

from apps.safety.models import EventRating, UserBlock, UserReport


@admin.register(UserBlock)
class UserBlockAdmin(admin.ModelAdmin):
    list_display = ("blocker", "blocked", "created_at")
    search_fields = ("blocker__username", "blocked__username")


@admin.register(UserReport)
class UserReportAdmin(admin.ModelAdmin):
    list_display = ("reporter", "reported_user", "event", "reason", "created_at")
    search_fields = ("reporter__username", "reported_user__username", "event__title", "reason", "details")
    list_filter = ("created_at",)


@admin.register(EventRating)
class EventRatingAdmin(admin.ModelAdmin):
    list_display = ("event", "rater", "rating", "created_at")
    search_fields = ("event__title", "rater__username", "review")
    list_filter = ("rating",)
