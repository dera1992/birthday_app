from django.contrib import admin

from apps.wallet.models import WalletAccount, WalletLedgerEntry


@admin.register(WalletAccount)
class WalletAccountAdmin(admin.ModelAdmin):
    list_display = ("user", "pending_balance", "available_balance", "payout_mode", "auto_payout_frequency", "updated_at")
    list_filter = ("payout_mode", "auto_payout_frequency")
    search_fields = ("user__email", "user__username")
    readonly_fields = ("updated_at",)


@admin.register(WalletLedgerEntry)
class WalletLedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "amount", "currency", "status", "source_purchase", "created_at")
    list_filter = ("type", "status")
    search_fields = ("user__email", "stripe_transfer_id")
    readonly_fields = ("created_at",)
