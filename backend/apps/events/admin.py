from django.contrib import admin

from apps.events.models import BirthdayEvent, EventApplication, EventAttendee, EventInvite


@admin.register(BirthdayEvent)
class BirthdayEventAdmin(admin.ModelAdmin):
    list_display = ("title", "host", "category", "visibility", "state", "amount", "target_amount", "venue_status", "start_at")
    search_fields = ("title", "host__username", "approx_area_label", "category")
    list_filter = ("state", "visibility", "venue_status", "category")


@admin.register(EventInvite)
class EventInviteAdmin(admin.ModelAdmin):
    list_display = ("event", "code", "max_uses", "used_count", "expires_at")
    search_fields = ("event__title", "code")


@admin.register(EventApplication)
class EventApplicationAdmin(admin.ModelAdmin):
    list_display = ("event", "applicant", "status", "approved_at", "created_at")
    search_fields = ("event__title", "applicant__username", "invite_code_used")
    list_filter = ("status",)


@admin.register(EventAttendee)
class EventAttendeeAdmin(admin.ModelAdmin):
    list_display = ("event", "user", "status", "joined_at")
    search_fields = ("event__title", "user__username")
    list_filter = ("status",)
