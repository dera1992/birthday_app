from django.contrib import admin

from apps.venues.models import ReferralClick, VenuePartner


@admin.register(VenuePartner)
class VenuePartnerAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "category", "approx_area_label", "is_active")
    search_fields = ("name", "city", "category", "approx_area_label")
    list_filter = ("city", "category", "is_active")


@admin.register(ReferralClick)
class ReferralClickAdmin(admin.ModelAdmin):
    list_display = ("venue", "user", "created_at")
    search_fields = ("venue__name", "user__username")
