from django.db import migrations


def copy_product_assets_to_template(apps, schema_editor):
    GiftProduct = apps.get_model("gifts", "GiftProduct")

    for product in GiftProduct.objects.select_related("template").exclude(template__isnull=True):
        template = product.template
        changed = False

        product_template_asset_url = getattr(product, "template_asset_url", "") or ""
        product_preview_asset_url = getattr(product, "preview_asset_url", "") or ""

        if product_template_asset_url and not template.template_asset_url:
            template.template_asset_url = product_template_asset_url
            changed = True

        if product_preview_asset_url and not template.preview_asset_url:
            template.preview_asset_url = product_preview_asset_url
            changed = True

        if changed:
            template.save(update_fields=["template_asset_url", "preview_asset_url"])


class Migration(migrations.Migration):
    dependencies = [
        ("gifts", "0003_gift_renderer_engine"),
    ]

    operations = [
        migrations.RunPython(copy_product_assets_to_template, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="giftproduct",
            name="preview_asset_url",
        ),
        migrations.RemoveField(
            model_name="giftproduct",
            name="template_asset_url",
        ),
    ]
