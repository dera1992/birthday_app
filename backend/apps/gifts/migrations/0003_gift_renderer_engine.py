from django.db import migrations, models


def map_legacy_renderers(apps, schema_editor):
    GiftProduct = apps.get_model("gifts", "GiftProduct")
    GiftTemplate = apps.get_model("gifts", "GiftTemplate")

    product_map = {
        "LOTTIE_ANIMATION": "ANIMATED_MESSAGE",
        "SVG_BUNDLE": "FLOWER_GIFT",
        "AUDIO_DEDICATION": "ANIMATED_MESSAGE",
    }
    for old_value, new_value in product_map.items():
        GiftProduct.objects.filter(renderer_type=old_value).update(renderer_type=new_value)
        GiftTemplate.objects.filter(renderer_type=old_value).update(renderer_type=new_value)


class Migration(migrations.Migration):
    dependencies = [
        ("gifts", "0002_gift_engine"),
    ]

    operations = [
        migrations.AddField(
            model_name="giftproduct",
            name="layout_config",
            field=models.JSONField(blank=True, default=dict, help_text="Overlay placement config used by the frontend renderer."),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="template_asset_url",
            field=models.URLField(blank=True, help_text="Primary visual asset used by the renderer as its background or template."),
        ),
        migrations.RunPython(map_legacy_renderers, migrations.RunPython.noop),
    ]
