from rest_framework import serializers

from apps.gifts.models import GiftProduct, GiftPurchase


class GiftProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftProduct
        fields = ["id", "name", "slug", "category", "description", "price", "currency", "preview_asset_url"]


class GiftPurchaseReadSerializer(serializers.ModelSerializer):
    product = GiftProductSerializer(read_only=True)

    class Meta:
        model = GiftPurchase
        fields = [
            "id",
            "product",
            "buyer_name",
            "from_name",
            "custom_message",
            "visibility",
            "status",
            "gross_amount",
            "celebrant_amount",
            "created_at",
        ]


class GiftPurchaseCreateSerializer(serializers.Serializer):
    product_slug = serializers.SlugField()
    buyer_name = serializers.CharField(max_length=255, required=False, default="")
    buyer_email = serializers.EmailField(required=False, default="")
    custom_message = serializers.CharField(required=False, default="", allow_blank=True)
    from_name = serializers.CharField(max_length=255, required=False, default="")
    visibility = serializers.ChoiceField(choices=GiftPurchase.Visibility.choices, default=GiftPurchase.Visibility.PUBLIC)


class WalletWithdrawSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value="1.00")
