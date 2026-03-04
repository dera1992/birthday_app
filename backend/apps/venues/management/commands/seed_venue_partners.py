import json
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.venues.models import VenuePartner


class Command(BaseCommand):
    help = "Seed VenuePartner data from the bundled sample JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default=str(Path(__file__).resolve().parents[2] / "data" / "venue_partners.json"),
            help="Optional path to a JSON file with venue partner seed data.",
        )

    def handle(self, *args, **options):
        path = Path(options["path"])
        records = json.loads(path.read_text(encoding="utf-8"))
        created = 0
        updated = 0
        for record in records:
            _, was_created = VenuePartner.objects.update_or_create(
                name=record["name"],
                city=record["city"],
                category=record["category"],
                defaults={
                    "approx_area_label": record.get("approx_area_label", ""),
                    "referral_url": record["referral_url"],
                    "is_active": record.get("is_active", True),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Seed complete. Created: {created}, Updated: {updated}"))
