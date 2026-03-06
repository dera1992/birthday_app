from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("safety", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="userreport",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Pending"),
                    ("REVIEWED", "Reviewed — no action"),
                    ("DISMISSED", "Dismissed"),
                    ("ACTIONED", "Actioned"),
                ],
                default="PENDING",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="userreport",
            name="reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reports_reviewed",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="userreport",
            name="admin_note",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="userreport",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterModelOptions(
            name="userreport",
            options={"ordering": ["-created_at"]},
        ),
    ]
