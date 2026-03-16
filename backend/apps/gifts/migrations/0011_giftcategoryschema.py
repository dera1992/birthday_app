from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gifts", "0010_alter_giftproduct_customization_schema_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="GiftCategorySchema",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("CARD", "Card"),
                            ("FLOWER", "Flower"),
                            ("MESSAGE", "Message"),
                            ("BADGE", "Badge"),
                            ("VIDEO", "Video"),
                        ],
                        help_text="Each category may have exactly one schema.",
                        max_length=20,
                        unique=True,
                    ),
                ),
                (
                    "customization_schema",
                    models.JSONField(
                        blank=True,
                        default=dict,
                        help_text="Dynamic field schema used to build the customization form for all gifts in this category.",
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Gift category schema",
                "verbose_name_plural": "Gift category schemas",
                "ordering": ["category"],
            },
        ),
    ]
