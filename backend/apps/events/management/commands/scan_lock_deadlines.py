import json

from django.core.management.base import BaseCommand

from apps.events.tasks import scan_lock_deadlines


class Command(BaseCommand):
    help = "Scan event lock deadlines and queue cancellations/refunds for expired eligible events."

    def handle(self, *args, **options):
        result = scan_lock_deadlines()
        self.stdout.write(self.style.SUCCESS(json.dumps(result)))
