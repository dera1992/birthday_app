from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from apps.gifts.engine import LEGACY_LAYOUT_BY_RENDERER, LEGACY_SCHEMA_BY_CATEGORY, resolve_preview_asset_url, resolve_template_asset_url
from apps.gifts.models import AIGenerationJob, GiftCategorySchema, GiftProduct, GiftPurchase, GiftTemplate


@admin.register(GiftCategorySchema)
class GiftCategorySchemaAdmin(admin.ModelAdmin):
    list_display = ("category", "field_summary", "updated_at")
    readonly_fields = ("updated_at", "schema_guide")
    fields = ("category", "customization_schema", "schema_guide", "updated_at")

    @admin.display(description="Fields")
    def field_summary(self, obj):
        schema = obj.customization_schema or {}
        fields = schema.get("fields", [])
        if not fields:
            return "—"
        return ", ".join(f["name"] for f in fields)

    @admin.display(description="Schema guide")
    def schema_guide(self, obj):
        import json
        example = {
            "fields": [
                {"name": "sender_name", "type": "text", "label": "From", "required": False, "max_length": 80},
                {"name": "recipient_name", "type": "text", "label": "To", "required": False, "max_length": 80},
                {"name": "message", "type": "textarea", "label": "Message", "required": False, "max_length": 300},
                {"name": "theme_color", "type": "select", "label": "Colour theme", "required": False,
                 "options": ["pink", "gold", "blue", "purple"]},
                {"name": "card_style", "type": "select", "label": "Card style", "required": False,
                 "options": ["confetti", "balloons", "stars"]},
                {"name": "font_style", "type": "select", "label": "Font style", "required": False,
                 "options": ["bold", "elegant", "playful", "modern"]},
            ]
        }
        category = getattr(obj, "category", None)
        fallback = LEGACY_SCHEMA_BY_CATEGORY.get(category, {}) if category else {}
        note = (
            "<p style='color:#92400e;margin:0 0 8px'>"
            "<strong>Note:</strong> If this record is empty or missing, the built-in fallback schema is used. "
            "All products in this category will use this schema — no per-product overrides.</p>"
        )
        fallback_section = ""
        if fallback:
            fallback_section = (
                f"<p style='margin:8px 0 4px'><strong>Built-in fallback for {category}:</strong></p>"
                f"<pre style='white-space:pre-wrap;background:#f9fafb;padding:10px;border-radius:6px;font-size:12px'>"
                f"{json.dumps(fallback, indent=2)}</pre>"
            )
        example_section = (
            "<p style='margin:8px 0 4px'><strong>Supported field types:</strong> "
            "<code>text</code>, <code>textarea</code>, <code>select</code>, "
            "<code>color</code>, <code>number</code>, <code>toggle</code></p>"
            f"<pre style='white-space:pre-wrap;background:#f0fdf4;padding:10px;border-radius:6px;font-size:12px'>"
            f"{json.dumps(example, indent=2)}</pre>"
        )
        return mark_safe(note + fallback_section + example_section)


@admin.register(GiftTemplate)
class GiftTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "renderer_type", "publication_status", "is_ready_for_publish", "is_active", "updated_at")
    search_fields = ("name", "slug")
    list_filter = ("renderer_type", "publication_status", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = (
        "template_asset_preview",
        "preview_asset_preview",
        "catalog_preview_asset_preview",
        "admin_visual_preview",
        "default_config_guide",
        "quality_checklist",
        "created_at",
        "updated_at",
    )
    actions = ("mark_in_review", "mark_published", "mark_draft")
    fields = (
        "name",
        "slug",
        "renderer_type",
        "publication_status",
        "review_notes",
        "template_asset",
        "preview_asset",
        "catalog_preview_asset",
        "template_asset_preview",
        "preview_asset_preview",
        "catalog_preview_asset_preview",
        "admin_visual_preview",
        "config_schema",
        "default_config",
        "default_config_guide",
        "quality_checklist",
        "is_active",
        "created_at",
        "updated_at",
    )

    @admin.display(description="Template asset")
    def template_asset_preview(self, obj):
        if not obj.template_asset:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noreferrer">{}</a>', obj.template_asset.url, obj.template_asset.url)

    @admin.display(description="Preview asset")
    def preview_asset_preview(self, obj):
        if not obj.preview_asset:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noreferrer">{}</a>', obj.preview_asset.url, obj.preview_asset.url)

    @admin.display(description="Catalog preview asset")
    def catalog_preview_asset_preview(self, obj):
        if not obj.catalog_preview_asset:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noreferrer">{}</a>', obj.catalog_preview_asset.url, obj.catalog_preview_asset.url)

    @admin.display(description="Default config guide")
    def default_config_guide(self, obj):
        example = """{
  "presentation": {
    "preview_shell": "studio_card",
    "aspect_ratio": "square"
  },
  "preview_defaults": {
    "recipient_name": "Happy Birthday Emma",
    "message": "Wishing you joy and laughter",
    "sender_name": "From Alex"
  },
  "layout_config": {
    "title": {"x": "50%", "y": "24%", "align": "center", "fontSize": 34, "fontWeight": 800, "color": "#ffffff"},
    "message": {"x": "50%", "y": "54%", "align": "center", "fontSize": 18, "fontWeight": 500, "color": "#0f172a", "maxWidth": "70%"},
    "sender": {"x": "50%", "y": "79%", "align": "center", "fontSize": 16, "fontWeight": 700, "color": "#0f172a"}
  }
        }"""
        return mark_safe(f"<pre style='white-space:pre-wrap;margin:0'>{example}</pre>")

    @admin.display(description="Visual preview")
    def admin_visual_preview(self, obj):
        if not obj.pk:
            return "Save this template first to see a visual preview."

        default_config = obj.default_config if isinstance(obj.default_config, dict) else {}
        presentation = default_config.get("presentation", {}) if isinstance(default_config.get("presentation", {}), dict) else {}
        preview_defaults = default_config.get("preview_defaults", {}) if isinstance(default_config.get("preview_defaults", {}), dict) else {}
        layout = default_config.get("layout_config", {}) if isinstance(default_config.get("layout_config", {}), dict) else {}
        if not layout:
            layout = LEGACY_LAYOUT_BY_RENDERER.get(obj.renderer_type, {})

        shell = presentation.get("preview_shell", "studio_card" if obj.renderer_type == GiftTemplate.RendererType.CARD_TEMPLATE else "studio_panel")
        aspect_ratio = presentation.get("aspect_ratio", "square")
        frame_width = {"portrait": "320px", "landscape": "420px"}.get(aspect_ratio, "360px")
        frame_height = {"portrait": "420px", "landscape": "260px"}.get(aspect_ratio, "360px")
        asset_url = obj.template_asset.url if obj.template_asset else obj.preview_asset.url if obj.preview_asset else ""

        title_text = preview_defaults.get("recipient_name") or "Happy Birthday Emma"
        message_text = preview_defaults.get("message") or "Wishing you joy and laughter"
        sender_text = preview_defaults.get("sender_name") or "From Alex"

        def slot_style(config, default_top, default_color="#111827"):
            config = config if isinstance(config, dict) else {}
            align = config.get("align", "center")
            transform = "translate(-50%, -50%)" if align == "center" else "translate(0, -50%)"
            if align == "right":
                transform = "translate(-100%, -50%)"
            return (
                f"position:absolute;left:{config.get('x', '50%')};top:{config.get('y', default_top)};"
                f"transform:{transform};text-align:{align};font-size:{config.get('fontSize', 18)}px;"
                f"font-weight:{config.get('fontWeight', 600)};color:{config.get('color', default_color)};"
                f"max-width:{config.get('maxWidth', '70%')};white-space:pre-wrap;"
            )

        title_style = slot_style(layout.get("title"), "24%", "#ffffff")
        message_style = slot_style(layout.get("message"), "54%", "#111827")
        sender_style = slot_style(layout.get("sender"), "79%", "#111827")
        background_style = (
            f"background-image:linear-gradient(rgba(15,23,42,0.10), rgba(15,23,42,0.20)), url('{asset_url}');"
            "background-size:cover;background-position:center;"
        ) if asset_url else "background:linear-gradient(135deg,#fb7185,#f59e0b);"

        shell_start = (
            "<div style='padding:20px;border:1px solid #eadde0;border-radius:28px;"
            "background:radial-gradient(circle at top left,rgba(255,255,255,0.98),rgba(244,244,245,0.92) 46%,rgba(226,232,240,0.86));"
            "box-shadow:0 12px 34px rgba(15,23,42,0.08);max-width:520px'>"
        )
        if shell == "studio_card":
            shell_start = (
                "<div style='position:relative;padding:20px;border:1px solid #eadde0;border-radius:28px;"
                "background:radial-gradient(circle at top left,rgba(255,255,255,0.98),rgba(244,244,245,0.92) 46%,rgba(226,232,240,0.86));"
                "box-shadow:0 12px 34px rgba(15,23,42,0.08);max-width:520px'>"
                "<div style='position:absolute;left:18px;top:20px;width:120px;height:120px;border-radius:999px;background:rgba(251,113,133,0.18);filter:blur(28px)'></div>"
                "<div style='position:absolute;right:18px;top:14px;width:130px;height:130px;border-radius:999px;background:rgba(96,165,250,0.18);filter:blur(28px)'></div>"
            )

        return mark_safe(
            f"""
            {shell_start}
              <div style="position:relative;margin:0 auto;width:{frame_width};height:{frame_height};padding:10px;border-radius:28px;background:rgba(255,255,255,0.92);box-shadow:0 16px 36px rgba(15,23,42,0.12);">
                <div style="position:relative;width:100%;height:100%;overflow:hidden;border-radius:22px;border:1px solid rgba(226,232,240,0.9);{background_style}">
                  <div style="position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(255,255,255,0.20),transparent 32%),radial-gradient(circle at bottom left,rgba(255,255,255,0.18),transparent 30%);"></div>
                  <div style="{title_style}">{title_text}</div>
                  <div style="{message_style}">{message_text}</div>
                  <div style="{sender_style}">{sender_text}</div>
                </div>
              </div>
            </div>
            """
        )

    @admin.display(boolean=True, description="Ready")
    def is_ready_for_publish(self, obj):
        return not self._quality_issues(obj)

    @admin.display(description="Quality checklist")
    def quality_checklist(self, obj):
        issues = self._quality_issues(obj)
        if not issues:
            return mark_safe("<span style='color:#15803d;font-weight:600'>Ready for publishing.</span>")
        items = "".join(f"<li>{issue}</li>" for issue in issues)
        return mark_safe(f"<ul style='margin:0;padding-left:18px'>{items}</ul>")

    def _quality_issues(self, obj):
        issues = []
        if not obj.template_asset:
            issues.append("Template asset is missing.")
        if not obj.preview_asset:
            issues.append("Preview asset is missing.")
        default_config = obj.default_config if isinstance(obj.default_config, dict) else {}
        presentation = default_config.get("presentation", {})
        preview_defaults = default_config.get("preview_defaults", {})
        layout_config = default_config.get("layout_config", {})
        if not isinstance(presentation, dict) or not presentation.get("preview_shell"):
            issues.append("default_config.presentation.preview_shell is missing.")
        if not isinstance(preview_defaults, dict):
            issues.append("default_config.preview_defaults must be a JSON object.")
        if not isinstance(layout_config, dict):
            layout_config = {}
        if not layout_config and obj.renderer_type not in {"CARD_TEMPLATE", "FLOWER_GIFT", "ANIMATED_MESSAGE", "BADGE_GIFT", "VIDEO_TEMPLATE"}:
            issues.append("default_config.layout_config is missing.")
        return issues

    @admin.action(description="Mark selected templates as in review")
    def mark_in_review(self, request, queryset):
        queryset.update(publication_status=GiftTemplate.PublicationStatus.IN_REVIEW)

    @admin.action(description="Mark selected templates as draft")
    def mark_draft(self, request, queryset):
        queryset.update(publication_status=GiftTemplate.PublicationStatus.DRAFT)

    @admin.action(description="Mark selected templates as published")
    def mark_published(self, request, queryset):
        published = 0
        for template in queryset:
            template.publication_status = GiftTemplate.PublicationStatus.PUBLISHED
            try:
                template.full_clean()
                template.save(update_fields=["publication_status", "updated_at"])
                published += 1
            except Exception:
                continue
        self.message_user(request, f"{published} template(s) published.")


@admin.register(GiftProduct)
class GiftProductAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "renderer_type", "category", "price", "currency", "is_active", "is_ai_generated_product")
    search_fields = ("name", "slug")
    list_filter = ("renderer_type", "category", "is_active", "is_ai_generated_product")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("template_asset_preview", "preview_asset_preview", "created_at", "updated_at")
    fieldsets = (
        (None, {
            "fields": (
                "name", "slug", "category", "renderer_type", "template",
                "description", "price", "currency", "platform_fee_bps",
                "layout_config", "purchase_instructions",
                "allow_anonymous_sender", "is_active",
                "template_asset_preview", "preview_asset_preview",
                "created_at", "updated_at",
            )
        }),
        ("AI Generation", {
            "classes": ("collapse",),
            "fields": (
                "is_ai_generated_product",
                "ai_generation_provider",
                "ai_generation_category",
                "ai_option_count",
                "ai_prompt_template",
            ),
        }),
    )

    @admin.display(description="Template asset")
    def template_asset_preview(self, obj):
        asset_url = resolve_template_asset_url(obj)
        if not asset_url:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noreferrer">{}</a>', asset_url, asset_url)

    @admin.display(description="Preview asset")
    def preview_asset_preview(self, obj):
        asset_url = resolve_preview_asset_url(obj)
        if not asset_url:
            return "-"
        return format_html('<a href="{}" target="_blank" rel="noreferrer">{}</a>', asset_url, asset_url)


class AIGenerationJobInline(admin.TabularInline):
    model = AIGenerationJob
    extra = 0
    readonly_fields = ("provider", "status", "error_message", "created_at", "updated_at")
    fields = ("provider", "status", "error_message", "created_at", "updated_at")
    can_delete = False


@admin.register(GiftPurchase)
class GiftPurchaseAdmin(admin.ModelAdmin):
    list_display = ("product", "celebrant", "status", "generation_status", "gross_amount", "visibility", "created_at")
    search_fields = ("buyer_name", "buyer_email", "from_name")
    list_filter = ("status", "visibility", "generation_status")
    inlines = [AIGenerationJobInline]
    readonly_fields = (
        "gross_amount",
        "platform_amount",
        "celebrant_amount",
        "stripe_payment_intent_id",
        "stripe_charge_id",
        "customization_data",
        "rendered_snapshot_url",
        "generated_options",
        "selected_asset_url",
        "ai_download_url",
        "ai_prompt_input",
        "created_at",
    )


@admin.register(AIGenerationJob)
class AIGenerationJobAdmin(admin.ModelAdmin):
    list_display = ("id", "purchase", "provider", "status", "created_at", "updated_at")
    search_fields = ("purchase__id",)
    list_filter = ("status", "provider")
    readonly_fields = ("purchase", "provider", "status", "request_payload", "response_payload", "error_message", "created_at", "updated_at")
