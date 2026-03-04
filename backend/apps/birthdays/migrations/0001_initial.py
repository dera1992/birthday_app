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
            name="BirthdayProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(unique=True)),
                ("day", models.PositiveSmallIntegerField()),
                ("month", models.PositiveSmallIntegerField()),
                ("hide_year", models.BooleanField(default=True)),
                ("bio", models.TextField(blank=True)),
                ("preferences", models.JSONField(blank=True, default=dict)),
                (
                    "visibility",
                    models.CharField(
                        choices=[("PUBLIC", "Public"), ("PRIVATE", "Private")], default="PUBLIC", max_length=16
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="birthday_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SupportContribution",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("currency", models.CharField(default="GBP", max_length=8)),
                (
                    "status",
                    models.CharField(
                        choices=[("PENDING", "Pending"), ("SUCCEEDED", "Succeeded"), ("FAILED", "Failed")],
                        default="PENDING",
                        max_length=16,
                    ),
                ),
                ("stripe_payment_intent_id", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="contributions", to="birthdays.birthdayprofile"
                    ),
                ),
                (
                    "supporter",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SupportMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sender_name", models.CharField(blank=True, max_length=255)),
                ("body", models.TextField()),
                (
                    "moderation_status",
                    models.CharField(
                        choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")],
                        default="PENDING",
                        max_length=16,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "author",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
                ),
                (
                    "profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="support_messages",
                        to="birthdays.birthdayprofile",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WishlistItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("external_url", models.URLField(blank=True)),
                ("price", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("currency", models.CharField(default="GBP", max_length=8)),
                ("is_reserved", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="wishlist_items", to="birthdays.birthdayprofile"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WishlistReservation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reserver_name", models.CharField(max_length=255)),
                ("reserver_email", models.EmailField(blank=True, max_length=254)),
                ("reserved_at", models.DateTimeField(auto_now_add=True)),
                (
                    "item",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="reservation", to="birthdays.wishlistitem"
                    ),
                ),
            ],
        ),
    ]
