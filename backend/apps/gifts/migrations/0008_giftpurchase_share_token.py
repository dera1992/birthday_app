from django.db import migrations, models
import apps.gifts.models as gift_models


def populate_share_tokens(state_apps, schema_editor):
    GiftPurchase = state_apps.get_model("gifts", "GiftPurchase")
    for purchase in GiftPurchase.objects.filter(share_token__isnull=True):
        purchase.share_token = gift_models.generate_share_token()
        purchase.save(update_fields=["share_token"])


class Migration(migrations.Migration):
    dependencies = [
        ("gifts", "0007_gifttemplate_catalog_preview_asset"),
    ]

    operations = [
        migrations.AddField(
            model_name="giftpurchase",
            name="share_token",
            field=models.CharField(blank=True, max_length=32, null=True, unique=True),
        ),
        migrations.RunPython(populate_share_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="giftpurchase",
            name="share_token",
            field=models.CharField(default=gift_models.generate_share_token, editable=False, max_length=32, unique=True),
        ),
    ]
