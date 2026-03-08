"""
Management command: seed AI gift products.

Creates (or updates) the five canonical AI gift products:
  - AI Birthday Card      (CARD)
  - AI Flower Gift        (FLOWER)
  - AI Badge Gift         (BADGE)
  - AI Message Gift       (MESSAGE)
  - AI Video Cover Gift   (VIDEO)

Usage:
  python manage.py seed_ai_gift_products
  python manage.py seed_ai_gift_products --price 4.99 --currency usd
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.gifts.models import GiftProduct

AI_GIFT_CUSTOMIZATION_SCHEMA = {
    "fields": [
        {
            "name": "celebrant_name",
            "type": "text",
            "label": "Celebrant Name",
            "required": True,
            "max_length": 100,
            "placeholder": "e.g. Emma",
        },
        {
            "name": "sender_name",
            "type": "text",
            "label": "Your Name",
            "required": False,
            "max_length": 100,
            "placeholder": "e.g. Alex",
        },
        {
            "name": "message",
            "type": "textarea",
            "label": "Message",
            "required": True,
            "max_length": 300,
            "placeholder": "Write a personal birthday message...",
        },
        {
            "name": "style",
            "type": "select",
            "label": "Style",
            "required": True,
            "options": ["Playful", "Elegant", "Luxury", "Floral", "Minimal", "Bold"],
        },
    ]
}

AI_PRODUCTS = [
    {
        "slug": "ai-birthday-card",
        "name": "AI Birthday Card",
        "category": "CARD",
        "ai_generation_category": "CARD",
        "description": "Can't find the perfect card? Let AI create a unique, personalised birthday card just for them.",
        "purchase_instructions": "After payment, 2 unique AI-generated card designs will be created. Pick your favourite to send.",
    },
    {
        "slug": "ai-flower-gift",
        "name": "AI Flower Gift",
        "category": "FLOWER",
        "ai_generation_category": "FLOWER",
        "description": "A bespoke AI-generated virtual flower arrangement tailored to the celebrant's personality and your message.",
        "purchase_instructions": "After payment, 2 unique AI-generated flower designs will be created. Pick your favourite to send.",
    },
    {
        "slug": "ai-badge-gift",
        "name": "AI Badge Gift",
        "category": "BADGE",
        "ai_generation_category": "BADGE",
        "description": "A one-of-a-kind AI-generated celebratory badge — premium, fun, and shareable.",
        "purchase_instructions": "After payment, 2 unique AI-generated badge designs will be created. Pick your favourite to send.",
    },
    {
        "slug": "ai-message-gift",
        "name": "AI Message Gift",
        "category": "MESSAGE",
        "ai_generation_category": "MESSAGE",
        "description": "A beautifully designed AI-generated message card with your personal words and chosen style.",
        "purchase_instructions": "After payment, 2 unique AI-generated message designs will be created. Pick your favourite to send.",
    },
    {
        "slug": "ai-video-cover-gift",
        "name": "AI Video Cover Gift",
        "category": "VIDEO",
        "ai_generation_category": "VIDEO",
        "description": "An AI-generated cinematic video cover image personalised for the birthday celebration. (V1: still cover; full video in a future release.)",
        "purchase_instructions": "After payment, 2 unique AI-generated video cover designs will be created. Pick your favourite to send.",
    },
]


class Command(BaseCommand):
    help = "Seed AI gift products (one per category)."

    def add_arguments(self, parser):
        parser.add_argument("--price", type=str, default="7.99", help="Price per AI gift product (default: 7.99)")
        parser.add_argument("--currency", type=str, default="gbp", help="Currency (default: gbp)")
        parser.add_argument("--provider", type=str, default="NANO_BANANA", help="AI provider key (default: NANO_BANANA)")
        parser.add_argument("--fee-bps", type=int, default=3000, help="Platform fee in basis points (default: 3000 = 30%%)")

    def handle(self, *args, **options):
        price = options["price"]
        currency = options["currency"]
        provider = options["provider"]
        fee_bps = options["fee_bps"]

        created = updated = 0
        for spec in AI_PRODUCTS:
            _, was_created = GiftProduct.objects.update_or_create(
                slug=spec["slug"],
                defaults={
                    "name": spec["name"],
                    "category": spec["category"],
                    "description": spec["description"],
                    "price": price,
                    "currency": currency,
                    "platform_fee_bps": fee_bps,
                    "purchase_instructions": spec["purchase_instructions"],
                    "customization_schema": AI_GIFT_CUSTOMIZATION_SCHEMA,
                    "allow_anonymous_sender": True,
                    "is_active": True,
                    "is_ai_generated_product": True,
                    "ai_generation_provider": provider,
                    "ai_generation_category": spec["ai_generation_category"],
                    "ai_option_count": 2,
                    "ai_prompt_template": "",  # use default per-category templates from ai_services
                },
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"  Created: {spec['name']} ({spec['slug']})"))
            else:
                updated += 1
                self.stdout.write(f"  Updated: {spec['name']} ({spec['slug']})")

        self.stdout.write(
            self.style.SUCCESS(f"\nDone — AI gift products: {created} created, {updated} updated.")
        )
