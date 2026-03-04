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
            name="UserVerification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email_verified_at", models.DateTimeField(blank=True, null=True)),
                ("phone_verified_at", models.DateTimeField(blank=True, null=True)),
                ("phone_number", models.CharField(blank=True, max_length=32)),
                ("risk_flags", models.JSONField(blank=True, default=dict)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="verification",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
