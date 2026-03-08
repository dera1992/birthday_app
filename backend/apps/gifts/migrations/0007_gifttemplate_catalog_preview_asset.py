from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gifts", "0006_gifttemplate_publication_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="gifttemplate",
            name="catalog_preview_asset",
            field=models.ImageField(blank=True, null=True, upload_to="gift_catalog_previews/"),
        ),
    ]
