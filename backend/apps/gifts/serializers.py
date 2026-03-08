from rest_framework import serializers

from apps.gifts.engine import (
    resolve_catalog_preview_asset_url,
    map_legacy_fields_to_customization,
    resolve_customization_schema,
    resolve_default_config,
    resolve_gift_renderer,
    resolve_layout_config,
    resolve_preview_asset_url,
    resolve_template_asset_url,
    validate_customization_data,
)
from apps.gifts.access import gift_purchase_download_url, gift_purchase_share_url
from apps.gifts.models import GiftProduct, GiftPurchase


class GiftTemplateSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    renderer_type = serializers.CharField()
    catalog_preview_asset_url = serializers.CharField()
    template_asset_url = serializers.CharField()
    preview_asset_url = serializers.CharField()
    default_config = serializers.JSONField()


class GiftProductSerializer(serializers.ModelSerializer):
    catalog_preview_asset_url = serializers.SerializerMethodField()
    preview_asset_url = serializers.SerializerMethodField()
    template_asset_url = serializers.SerializerMethodField()
    renderer_type = serializers.SerializerMethodField()
    customization_schema = serializers.SerializerMethodField()
    layout_config = serializers.SerializerMethodField()
    default_config = serializers.SerializerMethodField()
    template = serializers.SerializerMethodField()

    class Meta:
        model = GiftProduct
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "description",
            "price",
            "currency",
            "catalog_preview_asset_url",
            "preview_asset_url",
            "template_asset_url",
            "renderer_type",
            "customization_schema",
            "layout_config",
            "default_config",
            "purchase_instructions",
            "allow_anonymous_sender",
            "template",
            # AI generation fields
            "is_ai_generated_product",
            "ai_generation_provider",
            "ai_option_count",
            "ai_generation_category",
        ]

    def get_catalog_preview_asset_url(self, obj):
        return resolve_catalog_preview_asset_url(obj)

    def get_preview_asset_url(self, obj):
        return resolve_preview_asset_url(obj)

    def get_template_asset_url(self, obj):
        return resolve_template_asset_url(obj)

    def get_renderer_type(self, obj):
        return resolve_gift_renderer(obj)

    def get_customization_schema(self, obj):
        return resolve_customization_schema(obj)

    def get_layout_config(self, obj):
        return resolve_layout_config(obj)

    def get_default_config(self, obj):
        return resolve_default_config(obj)

    def get_template(self, obj):
        if not obj.template:
            return None
        return GiftTemplateSummarySerializer(
            {
                "id": obj.template.id,
                "name": obj.template.name,
                "slug": obj.template.slug,
                "renderer_type": obj.template.renderer_type,
                "catalog_preview_asset_url": resolve_catalog_preview_asset_url(obj),
                "template_asset_url": resolve_template_asset_url(obj),
                "preview_asset_url": resolve_preview_asset_url(obj),
                "default_config": obj.template.default_config or {},
            }
        ).data


class GiftPurchaseReadSerializer(serializers.ModelSerializer):
    product = GiftProductSerializer(read_only=True)
    renderer_type = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    effective_asset_url = serializers.SerializerMethodField()

    class Meta:
        model = GiftPurchase
        fields = [
            "id",
            "product",
            "buyer_name",
            "from_name",
            "custom_message",
            "customization_data",
            "rendered_snapshot_url",
            "is_anonymous",
            "renderer_type",
            "visibility",
            "status",
            "gross_amount",
            "celebrant_amount",
            "share_url",
            "download_url",
            "created_at",
            # AI generation fields
            "generation_status",
            "generated_options",
            "selected_option_index",
            "selected_asset_url",
            "ai_download_url",
            "is_downloadable",
            "ai_prompt_input",
            "effective_asset_url",
        ]

    def get_renderer_type(self, obj):
        return resolve_gift_renderer(obj.product)

    def get_share_url(self, obj):
        return gift_purchase_share_url(obj)

    def get_download_url(self, obj):
        return gift_purchase_download_url(self.context.get("request"), obj)

    def get_effective_asset_url(self, obj):
        """Returns the best available asset URL (AI-selected or rendered snapshot)."""
        if obj.selected_asset_url:
            return obj.selected_asset_url
        return obj.rendered_snapshot_url or ""


class AIGenerationStatusSerializer(serializers.Serializer):
    purchase_id = serializers.IntegerField()
    generation_status = serializers.CharField()
    generated_options = serializers.ListField(child=serializers.DictField())
    selected_option_index = serializers.IntegerField(allow_null=True)
    selected_asset_url = serializers.CharField(allow_blank=True)
    is_downloadable = serializers.BooleanField()
    ai_download_url = serializers.CharField(allow_blank=True)


class AISelectOptionSerializer(serializers.Serializer):
    option_index = serializers.IntegerField(min_value=0)


class GiftPurchaseCreateSerializer(serializers.Serializer):
    product_slug = serializers.SlugField()
    buyer_name = serializers.CharField(max_length=255, required=False, default="")
    buyer_email = serializers.EmailField(required=False, default="")
    custom_message = serializers.CharField(required=False, default="", allow_blank=True)
    from_name = serializers.CharField(max_length=255, required=False, default="")
    customization_data = serializers.JSONField(required=False, default=dict)
    is_anonymous = serializers.BooleanField(required=False, default=False)
    visibility = serializers.ChoiceField(choices=GiftPurchase.Visibility.choices, default=GiftPurchase.Visibility.PUBLIC)
    # AI prompt input — used only for AI gift products
    ai_prompt_input = serializers.JSONField(required=False, default=dict)

    def validate_customization_payload(self, product: GiftProduct) -> dict:
        payload = dict(self.validated_data)
        # For AI products, customization_data validation is relaxed — schema may contain
        # ai-specific fields (celebrant_name, style) that the engine validates separately.
        if product.is_ai_generated_product:
            return payload.get("customization_data") or {}
        customization_data = map_legacy_fields_to_customization(product, payload)
        return validate_customization_data(resolve_customization_schema(product), customization_data)

    def validate_ai_prompt_input(self, value):
        allowed_keys = {"celebrant_name", "sender_name", "message", "style", "color_palette", "tone", "occasion_subtype"}
        unexpected = sorted(set(value.keys()) - allowed_keys)
        if unexpected:
            raise serializers.ValidationError(f"Unexpected ai_prompt_input fields: {', '.join(unexpected)}.")
        return value


class WalletWithdrawSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value="1.00")
