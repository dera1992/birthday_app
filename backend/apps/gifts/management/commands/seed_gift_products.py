import json
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.gifts.models import GiftProduct


class Command(BaseCommand):
    help = "Seed gift products from data/gift_products.json"

    def handle(self, *args, **options):
        data_path = Path(__file__).resolve().parent.parent.parent / "data" / "gift_products.json"
        with open(data_path) as f:
            products = json.load(f)

        created = updated = 0
        for record in products:
            slug = record["slug"]
            obj, was_created = GiftProduct.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": record["name"],
                    "category": record["category"],
                    "description": record.get("description", ""),
                    "price": record["price"],
                    "currency": record.get("currency", "gbp"),
                    "platform_fee_bps": record.get("platform_fee_bps", 3000),
                    "is_active": record.get("is_active", True),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Done — {created} created, {updated} updated."))
