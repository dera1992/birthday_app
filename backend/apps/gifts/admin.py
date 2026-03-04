from django.contrib import admin

from apps.gifts.models import GiftProduct, GiftPurchase


@admin.register(GiftProduct)
class GiftProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "currency", "platform_fee_bps", "is_active")
    list_filter = ("category", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(GiftPurchase)
class GiftPurchaseAdmin(admin.ModelAdmin):
    list_display = ("product", "celebrant", "buyer_name", "gross_amount", "status", "visibility", "created_at")
    list_filter = ("status", "visibility")
    search_fields = ("celebrant__email", "buyer_email", "buyer_name", "stripe_payment_intent_id")
    readonly_fields = ("gross_amount", "platform_amount", "celebrant_amount", "stripe_payment_intent_id", "stripe_charge_id", "created_at")
