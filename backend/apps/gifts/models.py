from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from uuid import uuid4

from apps.gifts.engine import LEGACY_LAYOUT_BY_RENDERER, validate_customization_schema_definition


def generate_share_token():
    return uuid4().hex


class GiftTemplate(models.Model):
    class RendererType(models.TextChoices):
        CARD_TEMPLATE = "CARD_TEMPLATE", "Card template"
        FLOWER_GIFT = "FLOWER_GIFT", "Flower gift"
        ANIMATED_MESSAGE = "ANIMATED_MESSAGE", "Animated message"
        BADGE_GIFT = "BADGE_GIFT", "Badge gift"
        VIDEO_TEMPLATE = "VIDEO_TEMPLATE", "Video template"

    class PublicationStatus(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        IN_REVIEW = "IN_REVIEW", "In review"
        PUBLISHED = "PUBLISHED", "Published"

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    renderer_type = models.CharField(max_length=32, choices=RendererType.choices)
    template_asset = models.ImageField(upload_to="gift_templates/", blank=True, null=True)
    preview_asset = models.ImageField(upload_to="gift_previews/", blank=True, null=True)
    catalog_preview_asset = models.ImageField(upload_to="gift_catalog_previews/", blank=True, null=True)
    config_schema = models.JSONField(default=dict, blank=True)
    default_config = models.JSONField(default=dict, blank=True)
    publication_status = models.CharField(max_length=16, choices=PublicationStatus.choices, default=PublicationStatus.DRAFT)
    review_notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def clean(self):
        self.config_schema = validate_customization_schema_definition(self.config_schema)
        if self.default_config and not isinstance(self.default_config, dict):
            raise ValidationError("Default config must be a JSON object.")
        if self.publication_status == self.PublicationStatus.PUBLISHED:
            errors = {}
            if not self.template_asset:
                errors["template_asset"] = "Template asset is required before publishing."
            if not self.preview_asset:
                errors["preview_asset"] = "Preview asset is required before publishing."

            presentation = self.default_config.get("presentation", {}) if isinstance(self.default_config, dict) else {}
            preview_defaults = self.default_config.get("preview_defaults", {}) if isinstance(self.default_config, dict) else {}
            layout_config = self.default_config.get("layout_config", {}) if isinstance(self.default_config, dict) else {}

            if not isinstance(presentation, dict) or not presentation.get("preview_shell"):
                errors["default_config"] = "Published templates require default_config.presentation.preview_shell."
            if not isinstance(preview_defaults, dict):
                preview_defaults = {}
            if not isinstance(layout_config, dict):
                layout_config = {}
            if not layout_config and self.renderer_type not in LEGACY_LAYOUT_BY_RENDERER:
                errors["default_config"] = "Published templates require default_config.layout_config."

            if errors:
                raise ValidationError(errors)

    def __str__(self):
        return self.name


class GiftProduct(models.Model):
    class Category(models.TextChoices):
        CARD = "CARD", "Card"
        FLOWER = "FLOWER", "Flower"
        MESSAGE = "MESSAGE", "Message"
        BADGE = "BADGE", "Badge"
        VIDEO = "VIDEO", "Video"

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    template = models.ForeignKey("gifts.GiftTemplate", null=True, blank=True, on_delete=models.SET_NULL, related_name="products")
    renderer_type = models.CharField(max_length=32, choices=GiftTemplate.RendererType.choices, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="gbp")
    platform_fee_bps = models.PositiveIntegerField(default=3000)
    layout_config = models.JSONField(default=dict, blank=True, help_text="Overlay placement config used by the frontend renderer.")
    customization_schema = models.JSONField(default=dict, blank=True, help_text="Dynamic field schema used to build the gift customization form.")
    purchase_instructions = models.TextField(blank=True)
    allow_anonymous_sender = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    # AI generation fields
    is_ai_generated_product = models.BooleanField(default=False, help_text="If true, this product triggers AI image generation after purchase.")
    ai_generation_provider = models.CharField(max_length=50, blank=True, default="", help_text="Provider key, e.g. NANO_BANANA.")
    ai_prompt_template = models.TextField(blank=True, help_text="Prompt template with {celebrant_name}, {message}, {sender_name}, {style} placeholders.")
    ai_option_count = models.PositiveSmallIntegerField(default=2, help_text="Number of design options to generate.")
    ai_generation_category = models.CharField(
        max_length=32,
        blank=True,
        default="",
        help_text="Category used to select default prompt template. Allowed: CARD, FLOWER, MESSAGE, BADGE, VIDEO.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "price"]

    def clean(self):
        if self.layout_config and not isinstance(self.layout_config, dict):
            raise ValidationError("Layout config must be a JSON object.")
        self.customization_schema = validate_customization_schema_definition(self.customization_schema)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()}) - {self.currency.upper()} {self.price}"


class GiftPurchase(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "Public"
        PRIVATE = "PRIVATE", "Private"

    class GenerationStatus(models.TextChoices):
        NOT_REQUIRED = "NOT_REQUIRED", "Not required"
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        GENERATED = "GENERATED", "Generated"
        SELECTED = "SELECTED", "Selected"
        FAILED = "FAILED", "Failed"

    product = models.ForeignKey("gifts.GiftProduct", on_delete=models.PROTECT, related_name="purchases")
    celebrant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_gifts",
    )
    birthday_profile = models.ForeignKey(
        "birthdays.BirthdayProfile",
        on_delete=models.CASCADE,
        related_name="gift_purchases",
    )
    buyer_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="gift_purchases",
    )
    buyer_name = models.CharField(max_length=255, blank=True)
    buyer_email = models.EmailField(blank=True)
    custom_message = models.TextField(blank=True)
    from_name = models.CharField(max_length=255, blank=True)
    customization_data = models.JSONField(default=dict, blank=True)
    rendered_snapshot_url = models.URLField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    visibility = models.CharField(max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    gross_amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_amount = models.DecimalField(max_digits=10, decimal_places=2)
    celebrant_amount = models.DecimalField(max_digits=10, decimal_places=2)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)
    share_token = models.CharField(max_length=32, unique=True, default=generate_share_token, editable=False)
    # AI generation fields
    generation_status = models.CharField(
        max_length=20,
        choices=GenerationStatus.choices,
        default=GenerationStatus.NOT_REQUIRED,
    )
    generated_options = models.JSONField(default=list, blank=True)
    selected_option_index = models.PositiveSmallIntegerField(null=True, blank=True)
    selected_asset_url = models.URLField(blank=True)
    ai_download_url = models.URLField(blank=True)
    ai_prompt_input = models.JSONField(default=dict, blank=True)
    is_downloadable = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Gift {self.product.name} -> {self.celebrant} [{self.status}]"


class AIGenerationJob(models.Model):
    class JobStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"

    purchase = models.ForeignKey("gifts.GiftPurchase", on_delete=models.CASCADE, related_name="ai_generation_jobs")
    provider = models.CharField(max_length=50, default="NANO_BANANA")
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.PENDING)
    request_payload = models.JSONField(default=dict, blank=True)
    response_payload = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AIJob #{self.pk} for Purchase #{self.purchase_id} [{self.status}]"
