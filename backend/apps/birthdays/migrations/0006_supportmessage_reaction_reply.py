from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("birthdays", "0005_birthdayprofile_profile_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="supportmessage",
            name="celebrant_reaction",
            field=models.CharField(blank=True, default="", max_length=10, help_text="Single emoji reaction from the celebrant."),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="supportmessage",
            name="reply_text",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="supportmessage",
            name="reply_created_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
