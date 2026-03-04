from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("events", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConnectAccount",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stripe_account_id", models.CharField(max_length=255, unique=True)),
                ("charges_enabled", models.BooleanField(default=False)),
                ("payouts_enabled", models.BooleanField(default=False)),
                ("requirements", models.JSONField(blank=True, default=dict)),
                ("details_submitted", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="connect_account", to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="StripeEventProcessed",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stripe_event_id", models.CharField(max_length=255, unique=True)),
                ("event_type", models.CharField(max_length=255)),
                ("processed_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="EventPayment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("currency", models.CharField(default="GBP", max_length=8)),
                ("transfer_group", models.CharField(blank=True, max_length=255)),
                ("stripe_payment_intent_id", models.CharField(blank=True, max_length=255)),
                ("stripe_charge_id", models.CharField(blank=True, max_length=255)),
                ("stripe_transfer_id", models.CharField(blank=True, max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("REQUIRES_PAYMENT", "Requires payment"),
                            ("HELD_ESCROW", "Held escrow"),
                            ("RELEASED", "Released"),
                            ("REFUNDED", "Refunded"),
                            ("FAILED", "Failed"),
                            ("CANCELLED", "Cancelled"),
                        ],
                        default="REQUIRES_PAYMENT",
                        max_length=32,
                    ),
                ),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("transferred_at", models.DateTimeField(blank=True, null=True)),
                ("refunded_at", models.DateTimeField(blank=True, null=True)),
                ("last_error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "application",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="payments", to="events.eventapplication"),
                ),
                (
                    "attendee",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="event_payments", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "event",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="payments", to="events.birthdayevent"),
                ),
            ],
            options={"unique_together": {("event", "attendee")}},
        ),
    ]
