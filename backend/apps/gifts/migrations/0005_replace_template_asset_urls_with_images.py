from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gifts", "0004_remove_giftproduct_asset_urls"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="gifttemplate",
            name="preview_asset_url",
        ),
        migrations.RemoveField(
            model_name="gifttemplate",
            name="template_asset_url",
        ),
        migrations.AddField(
            model_name="gifttemplate",
            name="preview_asset",
            field=models.ImageField(blank=True, null=True, upload_to="gift_previews/"),
        ),
        migrations.AddField(
            model_name="gifttemplate",
            name="template_asset",
            field=models.ImageField(blank=True, null=True, upload_to="gift_templates/"),
        ),
    ]
