from decimal import Decimal

from rest_framework import serializers

from apps.wallet.models import WalletAccount, WalletLedgerEntry


class WalletAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletAccount
        fields = [
            "pending_balance",
            "available_balance",
            "payout_mode",
            "auto_payout_frequency",
            "auto_payout_min_threshold",
            "updated_at",
        ]
        read_only_fields = ["pending_balance", "available_balance", "updated_at"]


class WalletLedgerEntrySerializer(serializers.ModelSerializer):
    source_description = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.SerializerMethodField()

    def get_source_description(self, obj) -> str:
        if obj.source_purchase_id:
            try:
                return f"Digital Gift — {obj.source_purchase.product.name}"
            except Exception:
                return "Digital Gift"
        if obj.source_wishlist_contribution_id:
            try:
                return f"Wishlist Contribution — {obj.source_wishlist_contribution.item.title}"
            except Exception:
                return "Wishlist Contribution"
        if obj.source_event_payment_id:
            try:
                return f"Event Registration — {obj.source_event_payment.event.title}"
            except Exception:
                return "Event Registration"
        return ""

    def get_sender_name(self, obj) -> str:
        try:
            if obj.source_purchase_id:
                p = obj.source_purchase
                if p.is_anonymous:
                    return "Anonymous"
                return p.from_name or (
                    f"{p.buyer.first_name} {p.buyer.last_name}".strip() if p.buyer else p.buyer_name
                ) or p.buyer_name
            if obj.source_wishlist_contribution_id:
                c = obj.source_wishlist_contribution
                return c.contributor_name or (
                    f"{c.contributor.first_name} {c.contributor.last_name}".strip() if c.contributor else ""
                )
            if obj.source_event_payment_id:
                a = obj.source_event_payment.attendee
                return f"{a.first_name} {a.last_name}".strip() or a.email
        except Exception:
            pass
        return ""

    def get_sender_email(self, obj) -> str:
        try:
            if obj.source_purchase_id:
                p = obj.source_purchase
                if p.is_anonymous:
                    return ""
                return p.buyer_email or (p.buyer.email if p.buyer else "")
            if obj.source_wishlist_contribution_id:
                c = obj.source_wishlist_contribution
                return c.contributor_email or (c.contributor.email if c.contributor else "")
            if obj.source_event_payment_id:
                return obj.source_event_payment.attendee.email
        except Exception:
            pass
        return ""

    class Meta:
        model = WalletLedgerEntry
        fields = ["id", "type", "amount", "currency", "status", "source_description", "sender_name", "sender_email", "created_at"]


class WithdrawSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("1.00"))
