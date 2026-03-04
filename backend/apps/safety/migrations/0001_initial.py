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
            name="UserBlock",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "blocked",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="blocks_received", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "blocker",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="blocks_made", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"unique_together": {("blocker", "blocked")}},
        ),
        migrations.CreateModel(
            name="UserReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reason", models.CharField(max_length=255)),
                ("details", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("event", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="events.birthdayevent")),
                (
                    "reported_user",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="reports_received", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "reporter",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reports_made", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="EventRating",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.PositiveSmallIntegerField()),
                ("review", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "event",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ratings", to="events.birthdayevent"),
                ),
                (
                    "rater",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="event_ratings", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"unique_together": {("event", "rater")}},
        ),
    ]
