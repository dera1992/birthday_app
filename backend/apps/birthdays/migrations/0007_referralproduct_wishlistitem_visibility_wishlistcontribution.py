from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("birthdays", "0006_supportmessage_reaction_reply"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. ReferralProduct
        migrations.CreateModel(
            name="ReferralProduct",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(unique=True)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("TECH", "Tech"),
                            ("BEAUTY", "Beauty"),
                            ("FASHION", "Fashion"),
                            ("HOME", "Home"),
                            ("BOOKS", "Books"),
                            ("FOOD", "Food & Drink"),
                            ("EXPERIENCE", "Experience"),
                            ("OTHER", "Other"),
                        ],
                        default="OTHER",
                        max_length=32,
                    ),
                ),
                ("description", models.TextField(blank=True)),
                ("price", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("currency", models.CharField(default="GBP", max_length=8)),
                ("image_url", models.URLField(blank=True)),
                ("affiliate_url", models.URLField()),
                ("merchant_name", models.CharField(blank=True, max_length=255)),
                ("is_active", models.BooleanField(default=True)),
                ("click_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["name"]},
        ),
        # 2. New fields on WishlistItem
        migrations.AddField(
            model_name="wishlistitem",
            name="visibility",
            field=models.CharField(
                choices=[("PUBLIC", "Public"), ("PRIVATE", "Private")],
                default="PUBLIC",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="wishlistitem",
            name="source_type",
            field=models.CharField(
                choices=[("CUSTOM", "Custom"), ("REFERRAL_PRODUCT", "Referral product")],
                default="CUSTOM",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="wishlistitem",
            name="referral_product",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="wishlist_items",
                to="birthdays.referralproduct",
            ),
        ),
        migrations.AddField(
            model_name="wishlistitem",
            name="allow_contributions",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="wishlistitem",
            name="contribution_public",
            field=models.BooleanField(
                default=True, help_text="Show amount raised publicly."
            ),
        ),
        migrations.AddField(
            model_name="wishlistitem",
            name="target_amount",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Max contribution target (up to £100).",
                max_digits=6,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="wishlistitem",
            name="amount_raised",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        # 3. WishlistContribution
        migrations.CreateModel(
            name="WishlistContribution",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="contributions",
                        to="birthdays.wishlistitem",
                    ),
                ),
                (
                    "contributor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("contributor_name", models.CharField(blank=True, max_length=255)),
                ("contributor_email", models.EmailField(blank=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("currency", models.CharField(default="GBP", max_length=8)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("SUCCEEDED", "Succeeded"),
                            ("FAILED", "Failed"),
                            ("CANCELLED", "Cancelled"),
                        ],
                        default="PENDING",
                        max_length=16,
                    ),
                ),
                ("stripe_payment_intent_id", models.CharField(blank=True, max_length=255)),
                ("last_error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
