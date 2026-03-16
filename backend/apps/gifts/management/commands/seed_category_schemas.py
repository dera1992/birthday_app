from django.core.management.base import BaseCommand

from apps.gifts.engine import LEGACY_SCHEMA_BY_CATEGORY
from apps.gifts.models import GiftCategorySchema


class Command(BaseCommand):
    help = "Seed GiftCategorySchema rows from the built-in LEGACY_SCHEMA_BY_CATEGORY definitions."

    def add_arguments(self, parser):
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Overwrite existing category schemas. Without this flag, existing rows are skipped.",
        )

    def handle(self, *args, **options):
        overwrite = options["overwrite"]
        created = 0
        skipped = 0
        updated = 0

        for category, schema in LEGACY_SCHEMA_BY_CATEGORY.items():
            obj, was_created = GiftCategorySchema.objects.get_or_create(
                category=category,
                defaults={"customization_schema": schema},
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"  Created schema for {category}"))
            elif overwrite:
                obj.customization_schema = schema
                obj.save(update_fields=["customization_schema", "updated_at"])
                updated += 1
                self.stdout.write(self.style.WARNING(f"  Updated schema for {category}"))
            else:
                skipped += 1
                self.stdout.write(f"  Skipped {category} (already exists — use --overwrite to replace)")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Created: {created}, Updated: {updated}, Skipped: {skipped}."
            )
        )
