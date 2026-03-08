from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("gifts", "0008_giftpurchase_share_token"),
    ]

    operations = [
        # GiftProduct: add AI generation fields
        migrations.AddField(
            model_name="giftproduct",
            name="is_ai_generated_product",
            field=models.BooleanField(default=False, help_text="If true, this product triggers AI image generation after purchase."),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="ai_generation_provider",
            field=models.CharField(blank=True, default="", max_length=50, help_text="Provider key, e.g. NANO_BANANA."),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="ai_prompt_template",
            field=models.TextField(blank=True, help_text="Prompt template with {celebrant_name}, {message}, {sender_name}, {style} placeholders."),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="ai_option_count",
            field=models.PositiveSmallIntegerField(default=2, help_text="Number of design options to generate."),
        ),
        migrations.AddField(
            model_name="giftproduct",
            name="ai_generation_category",
            field=models.CharField(
                blank=True,
                default="",
                max_length=32,
                help_text="Category used to select default prompt template. Allowed: CARD, FLOWER, MESSAGE, BADGE, VIDEO.",
            ),
        ),
        # GiftPurchase: add AI generation fields
        migrations.AddField(
            model_name="giftpurchase",
            name="generation_status",
            field=models.CharField(
                choices=[
                    ("NOT_REQUIRED", "Not required"),
                    ("PENDING", "Pending"),
                    ("PROCESSING", "Processing"),
                    ("GENERATED", "Generated"),
                    ("SELECTED", "Selected"),
                    ("FAILED", "Failed"),
                ],
                default="NOT_REQUIRED",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="generated_options",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="selected_option_index",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="selected_asset_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="ai_download_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="ai_prompt_input",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="giftpurchase",
            name="is_downloadable",
            field=models.BooleanField(default=False),
        ),
        # AIGenerationJob model
        migrations.CreateModel(
            name="AIGenerationJob",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "purchase",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_generation_jobs",
                        to="gifts.giftpurchase",
                    ),
                ),
                ("provider", models.CharField(default="NANO_BANANA", max_length=50)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("PROCESSING", "Processing"),
                            ("SUCCEEDED", "Succeeded"),
                            ("FAILED", "Failed"),
                        ],
                        default="PENDING",
                        max_length=20,
                    ),
                ),
                ("request_payload", models.JSONField(blank=True, default=dict)),
                ("response_payload", models.JSONField(blank=True, default=dict)),
                ("error_message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
