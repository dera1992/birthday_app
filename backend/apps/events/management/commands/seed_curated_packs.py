import json
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.events.models import CuratedPack


class Command(BaseCommand):
    help = "Seed CuratedPack data from the bundled JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default=str(Path(__file__).resolve().parents[2] / "data" / "curated_packs.json"),
        )

    def handle(self, *args, **options):
        path = Path(options["path"])
        records = json.loads(path.read_text(encoding="utf-8"))
        created = 0
        updated = 0
        for record in records:
            _, was_created = CuratedPack.objects.update_or_create(
                slug=record["slug"],
                defaults={
                    "name": record["name"],
                    "description": record.get("description", ""),
                    "icon_emoji": record.get("icon_emoji", "🎂"),
                    "is_active": record.get("is_active", True),
                    "defaults": record.get("defaults", {}),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Packs seed complete. Created: {created}, Updated: {updated}"))
