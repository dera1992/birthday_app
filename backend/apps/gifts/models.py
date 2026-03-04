from django.conf import settings
from django.db import models


class GiftProduct(models.Model):
    class Category(models.TextChoices):
        CARD = "CARD", "Card"
        FLOWER = "FLOWER", "Flower"
        MESSAGE = "MESSAGE", "Message"
        BADGE = "BADGE", "Badge"
        VIDEO = "VIDEO", "Video"

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="gbp")
    platform_fee_bps = models.PositiveIntegerField(default=3000)  # 3000 = 30%
    preview_asset_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "price"]

    def __str__(self):
        return f"{self.name} ({self.get_category_display()}) — {self.currency.upper()} {self.price}"


class GiftPurchase(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "Public"
        PRIVATE = "PRIVATE", "Private"

    product = models.ForeignKey("gifts.GiftProduct", on_delete=models.PROTECT, related_name="purchases")
    celebrant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_gifts",
    )
    birthday_profile = models.ForeignKey(
        "birthdays.BirthdayProfile",
        on_delete=models.CASCADE,
        related_name="gift_purchases",
    )
    buyer_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="gift_purchases",
    )
    buyer_name = models.CharField(max_length=255, blank=True)
    buyer_email = models.EmailField(blank=True)

    custom_message = models.TextField(blank=True)
    from_name = models.CharField(max_length=255, blank=True)
    visibility = models.CharField(max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC)

    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)

    gross_amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_amount = models.DecimalField(max_digits=10, decimal_places=2)
    celebrant_amount = models.DecimalField(max_digits=10, decimal_places=2)

    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Gift {self.product.name} → {self.celebrant} [{self.status}]"
