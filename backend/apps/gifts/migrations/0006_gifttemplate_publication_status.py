from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gifts", "0005_replace_template_asset_urls_with_images"),
    ]

    operations = [
        migrations.AddField(
            model_name="gifttemplate",
            name="publication_status",
            field=models.CharField(
                choices=[("DRAFT", "Draft"), ("IN_REVIEW", "In review"), ("PUBLISHED", "Published")],
                default="DRAFT",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="gifttemplate",
            name="review_notes",
            field=models.TextField(blank=True),
        ),
    ]
