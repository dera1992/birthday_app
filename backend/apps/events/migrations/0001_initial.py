import django.contrib.gis.db.models.fields
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BirthdayEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("agenda", models.TextField(blank=True)),
                ("category", models.CharField(max_length=64)),
                ("start_at", models.DateTimeField()),
                ("end_at", models.DateTimeField()),
                (
                    "visibility",
                    models.CharField(
                        choices=[("DISCOVERABLE", "Discoverable"), ("INVITE_ONLY", "Invite only")],
                        default="INVITE_ONLY",
                        max_length=16,
                    ),
                ),
                ("expand_to_strangers", models.BooleanField(default=False)),
                ("location_point", django.contrib.gis.db.models.fields.PointField(geography=True, srid=4326)),
                ("radius_meters", models.PositiveIntegerField(default=10000)),
                ("approx_area_label", models.CharField(max_length=255)),
                ("min_guests", models.PositiveIntegerField(default=1)),
                ("max_guests", models.PositiveIntegerField(default=20)),
                ("criteria", models.JSONField(blank=True, default=dict)),
                (
                    "payment_mode",
                    models.CharField(choices=[("FREE", "Free"), ("PAID", "Paid")], default="FREE", max_length=16),
                ),
                ("amount", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("currency", models.CharField(default="GBP", max_length=8)),
                (
                    "state",
                    models.CharField(
                        choices=[
                            ("DRAFT", "Draft"),
                            ("OPEN", "Open"),
                            ("MIN_MET", "Min met"),
                            ("LOCKED", "Locked"),
                            ("CONFIRMED", "Confirmed"),
                            ("COMPLETED", "Completed"),
                            ("CANCELLED", "Cancelled"),
                            ("EXPIRED", "Expired"),
                        ],
                        default="DRAFT",
                        max_length=16,
                    ),
                ),
                (
                    "venue_status",
                    models.CharField(
                        choices=[("NOT_SET", "Not set"), ("PROPOSED", "Proposed"), ("CONFIRMED", "Confirmed")],
                        default="NOT_SET",
                        max_length=16,
                    ),
                ),
                ("venue_name", models.CharField(blank=True, max_length=255)),
                ("lock_deadline_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "host",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="hosted_events", to=settings.AUTH_USER_MODEL
                    ),
                ),
                (
                    "payee_user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payable_events",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"indexes": [models.Index(fields=["state", "visibility", "category"], name="events_birt_state_3d9546_idx")]},
        ),
        migrations.CreateModel(
            name="EventInvite",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=64, unique=True)),
                ("max_uses", models.PositiveIntegerField(default=0)),
                ("used_count", models.PositiveIntegerField(default=0)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                (
                    "event",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="invites", to="events.birthdayevent"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="EventApplication",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("intro_message", models.TextField(blank=True)),
                ("invite_code_used", models.CharField(blank=True, max_length=64)),
                (
                    "status",
                    models.CharField(
                        choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("DECLINED", "Declined"), ("WITHDRAWN", "Withdrawn")],
                        default="PENDING",
                        max_length=16,
                    ),
                ),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "applicant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="event_applications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="applications", to="events.birthdayevent"
                    ),
                ),
            ],
            options={"unique_together": {("event", "applicant")}},
        ),
        migrations.CreateModel(
            name="EventAttendee",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("ACTIVE", "Active"), ("CANCELLED", "Cancelled"), ("NO_SHOW", "No show")], default="ACTIVE", max_length=16)),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                (
                    "application",
                    models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="events.eventapplication"),
                ),
                (
                    "event",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attendees", to="events.birthdayevent"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attendances", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"unique_together": {("event", "user")}},
        ),
    ]
