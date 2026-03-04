from django.contrib import admin

from apps.birthdays.models import BirthdayProfile, SupportContribution, SupportMessage, WishlistItem, WishlistReservation


@admin.register(BirthdayProfile)
class BirthdayProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "slug", "day", "month", "visibility", "updated_at")
    search_fields = ("user__username", "user__email", "slug")
    list_filter = ("visibility", "month")


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("title", "profile", "is_reserved", "created_at")
    search_fields = ("title", "profile__slug", "profile__user__username")
    list_filter = ("is_reserved", "currency")


@admin.register(WishlistReservation)
class WishlistReservationAdmin(admin.ModelAdmin):
    list_display = ("item", "reserver_name", "reserver_email", "reserved_at")
    search_fields = ("item__title", "reserver_name", "reserver_email")


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ("profile", "sender_name", "moderation_status", "created_at")
    search_fields = ("profile__slug", "sender_name", "body")
    list_filter = ("moderation_status",)


@admin.register(SupportContribution)
class SupportContributionAdmin(admin.ModelAdmin):
    list_display = ("profile", "amount", "currency", "status", "stripe_payment_intent_id", "created_at")
    search_fields = ("profile__slug", "stripe_payment_intent_id", "supporter_email", "supporter_name")
    list_filter = ("status", "currency")
