import json
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.gifts.models import GiftProduct, GiftTemplate


class Command(BaseCommand):
    help = "Seed gift templates and products from data/gift_products.json"

    def handle(self, *args, **options):
        data_path = Path(__file__).resolve().parent.parent.parent / "data" / "gift_products.json"
        with open(data_path, encoding="utf-8") as file_handle:
            payload = json.load(file_handle)

        templates = payload.get("templates")
        products = payload.get("products")
        if isinstance(payload, list):
            templates = []
            products = payload

        template_map = {}
        created_templates = updated_templates = 0
        for record in templates or []:
            template, was_created = GiftTemplate.objects.update_or_create(
                slug=record["slug"],
                defaults={
                    "name": record["name"],
                    "renderer_type": record["renderer_type"],
                    "template_asset": record.get("template_asset"),
                    "preview_asset": record.get("preview_asset"),
                    "config_schema": record.get("config_schema", {}),
                    "default_config": record.get("default_config", {}),
                    "publication_status": record.get("publication_status", GiftTemplate.PublicationStatus.PUBLISHED),
                    "review_notes": record.get("review_notes", ""),
                    "is_active": record.get("is_active", True),
                },
            )
            template_map[template.slug] = template
            if was_created:
                created_templates += 1
            else:
                updated_templates += 1

        created_products = updated_products = 0
        for record in products or []:
            template = template_map.get(record.get("template_slug")) if record.get("template_slug") else None
            _, was_created = GiftProduct.objects.update_or_create(
                slug=record["slug"],
                defaults={
                    "name": record["name"],
                    "category": record["category"],
                    "template": template,
                    "renderer_type": record.get("renderer_type", ""),
                    "description": record.get("description", ""),
                    "price": record["price"],
                    "currency": record.get("currency", "gbp"),
                    "platform_fee_bps": record.get("platform_fee_bps", 3000),
                    "layout_config": record.get("layout_config", {}),
                    "customization_schema": record.get("customization_schema", {}),
                    "purchase_instructions": record.get("purchase_instructions", ""),
                    "allow_anonymous_sender": record.get("allow_anonymous_sender", True),
                    "is_active": record.get("is_active", True),
                    # AI generation fields (optional in JSON, backward-compatible defaults)
                    "is_ai_generated_product": record.get("is_ai_generated_product", False),
                    "ai_generation_provider": record.get("ai_generation_provider", ""),
                    "ai_prompt_template": record.get("ai_prompt_template", ""),
                    "ai_option_count": record.get("ai_option_count", 2),
                    "ai_generation_category": record.get("ai_generation_category", ""),
                },
            )
            if was_created:
                created_products += 1
            else:
                updated_products += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done - templates: {created_templates} created, {updated_templates} updated; "
                f"products: {created_products} created, {updated_products} updated."
            )
        )
