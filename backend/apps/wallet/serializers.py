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
    class Meta:
        model = WalletLedgerEntry
        fields = ["id", "type", "amount", "currency", "status", "created_at"]


class WithdrawSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value="1.00")
