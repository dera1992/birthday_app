from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("gifts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="GiftTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(unique=True)),
                (
                    "renderer_type",
                    models.CharField(
                        choices=[
                            ("CARD_TEMPLATE", "Card template"),
                            ("LOTTIE_ANIMATION", "Lottie animation"),
                            ("SVG_BUNDLE", "SVG bundle"),
                            ("AUDIO_DEDICATION", "Audio dedication"),
                            ("VIDEO_TEMPLATE", "Video template"),
                        ],
                        max_length=32,
                    ),
                ),
                ("template_asset_url", models.URLField(blank=True)),
                ("preview_asset_url", models.URLField(blank=True)),
                ("config_schema", models.JSONField(blank=True, default=dict)),
                ("default_config", models.JSONField(blank=True, default=dict)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="allow_anonymous_sender",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="customization_schema",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="purchase_instructions",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="renderer_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("CARD_TEMPLATE", "Card template"),
                    ("LOTTIE_ANIMATION", "Lottie animation"),
                    ("SVG_BUNDLE", "SVG bundle"),
                    ("AUDIO_DEDICATION", "Audio dedication"),
                    ("VIDEO_TEMPLATE", "Video template"),
                ],
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="template",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="products",
                to="gifts.gifttemplate",
            ),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="customization_data",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="is_anonymous",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="rendered_snapshot_url",
            field=models.URLField(blank=True),
        ),
    ]
