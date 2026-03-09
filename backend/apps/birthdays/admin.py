from django.contrib import admin

from apps.birthdays.models import BirthdayProfile, ReferralProduct, SupportContribution, SupportMessage, WishlistContribution, WishlistItem, WishlistReservation


@admin.register(BirthdayProfile)
class BirthdayProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "slug", "day", "month", "visibility", "updated_at")
    search_fields = ("user__username", "user__email", "slug")
    list_filter = ("visibility", "month")


@admin.register(ReferralProduct)
class ReferralProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "merchant_name", "price", "currency", "is_active", "click_count")
    search_fields = ("name", "slug", "merchant_name")
    list_filter = ("category", "is_active", "currency")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("title", "profile", "visibility", "source_type", "is_reserved", "allow_contributions", "amount_raised", "target_amount", "created_at")
    search_fields = ("title", "profile__slug", "profile__user__username")
    list_filter = ("is_reserved", "visibility", "source_type", "currency", "allow_contributions")
    raw_id_fields = ("referral_product",)


@admin.register(WishlistReservation)
class WishlistReservationAdmin(admin.ModelAdmin):
    list_display = ("item", "reserver_name", "reserver_email", "reserved_at")
    search_fields = ("item__title", "reserver_name", "reserver_email")


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ("profile", "sender_name", "moderation_status", "celebrant_reaction", "created_at")
    search_fields = ("profile__slug", "sender_name", "body", "reply_text")
    list_filter = ("moderation_status",)
    readonly_fields = ("created_at", "reply_created_at")


@admin.register(WishlistContribution)
class WishlistContributionAdmin(admin.ModelAdmin):
    list_display = ("item", "contributor_name", "amount", "currency", "status", "created_at")
    search_fields = ("item__title", "contributor_name", "contributor_email", "stripe_payment_intent_id")
    list_filter = ("status", "currency")
    readonly_fields = ("created_at",)


@admin.register(SupportContribution)
class SupportContributionAdmin(admin.ModelAdmin):
    list_display = ("profile", "amount", "currency", "status", "stripe_payment_intent_id", "created_at")
    search_fields = ("profile__slug", "stripe_payment_intent_id", "supporter_email", "supporter_name")
    list_filter = ("status", "currency")
