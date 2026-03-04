from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from apps.payments.models_connect import ConnectAccount


class ConnectStatusSerializer(serializers.ModelSerializer):
    account_type = serializers.SerializerMethodField()

    class Meta:
        model = ConnectAccount
        fields = [
            "account_type",
            "stripe_account_id",
            "charges_enabled",
            "payouts_enabled",
            "details_submitted",
            "requirements",
            "updated_at",
        ]

    @extend_schema_field(serializers.CharField())
    def get_account_type(self, obj) -> str:
        return "express"
