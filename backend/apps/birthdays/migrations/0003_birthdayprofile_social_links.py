from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("birthdays", "0002_supportcontribution_last_error_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="birthdayprofile",
            name="social_links",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
