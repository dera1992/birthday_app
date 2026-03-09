from django.conf import settings
from django.db import models


class ReferralProduct(models.Model):
    CATEGORY_TECH = "TECH"
    CATEGORY_BEAUTY = "BEAUTY"
    CATEGORY_FASHION = "FASHION"
    CATEGORY_HOME = "HOME"
    CATEGORY_BOOKS = "BOOKS"
    CATEGORY_FOOD = "FOOD"
    CATEGORY_EXPERIENCE = "EXPERIENCE"
    CATEGORY_OTHER = "OTHER"
    CATEGORY_CHOICES = [
        (CATEGORY_TECH, "Tech"),
        (CATEGORY_BEAUTY, "Beauty"),
        (CATEGORY_FASHION, "Fashion"),
        (CATEGORY_HOME, "Home"),
        (CATEGORY_BOOKS, "Books"),
        (CATEGORY_FOOD, "Food & Drink"),
        (CATEGORY_EXPERIENCE, "Experience"),
        (CATEGORY_OTHER, "Other"),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default=CATEGORY_OTHER)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default="GBP")
    image_url = models.URLField(blank=True)
    affiliate_url = models.URLField()
    merchant_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    click_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class BirthdayProfile(models.Model):
    VISIBILITY_PUBLIC = "PUBLIC"
    VISIBILITY_LINK_ONLY = "LINK_ONLY"
    VISIBILITY_PRIVATE = "PRIVATE"
    VISIBILITY_CHOICES = [
        (VISIBILITY_PUBLIC, "Public"),
        (VISIBILITY_LINK_ONLY, "Link only"),
        (VISIBILITY_PRIVATE, "Private"),
    ]
    GENDER_MALE = "MALE"
    GENDER_FEMALE = "FEMALE"
    GENDER_OTHER = "OTHER"
    GENDER_PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"
    GENDER_CHOICES = [
        (GENDER_MALE, "Male"),
        (GENDER_FEMALE, "Female"),
        (GENDER_OTHER, "Other"),
        (GENDER_PREFER_NOT_TO_SAY, "Prefer not to say"),
    ]
    MARITAL_SINGLE = "SINGLE"
    MARITAL_IN_A_RELATIONSHIP = "IN_A_RELATIONSHIP"
    MARITAL_MARRIED = "MARRIED"
    MARITAL_DIVORCED = "DIVORCED"
    MARITAL_WIDOWED = "WIDOWED"
    MARITAL_PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"
    MARITAL_STATUS_CHOICES = [
        (MARITAL_SINGLE, "Single"),
        (MARITAL_IN_A_RELATIONSHIP, "In a relationship"),
        (MARITAL_MARRIED, "Married"),
        (MARITAL_DIVORCED, "Divorced"),
        (MARITAL_WIDOWED, "Widowed"),
        (MARITAL_PREFER_NOT_TO_SAY, "Prefer not to say"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="birthday_profile")
    slug = models.SlugField(unique=True)
    day = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()
    hide_year = models.BooleanField(default=True)
    bio = models.TextField(blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    gender = models.CharField(max_length=32, choices=GENDER_CHOICES, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    marital_status = models.CharField(max_length=32, choices=MARITAL_STATUS_CHOICES, blank=True)
    occupation = models.CharField(max_length=255, blank=True)
    visibility = models.CharField(max_length=16, choices=VISIBILITY_CHOICES, default=VISIBILITY_PUBLIC)
    profile_image = models.ImageField(upload_to="profile-images/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class WishlistItem(models.Model):
    VISIBILITY_PUBLIC = "PUBLIC"
    VISIBILITY_PRIVATE = "PRIVATE"
    VISIBILITY_CHOICES = [
        (VISIBILITY_PUBLIC, "Public"),
        (VISIBILITY_PRIVATE, "Private"),
    ]
    SOURCE_CUSTOM = "CUSTOM"
    SOURCE_REFERRAL = "REFERRAL_PRODUCT"
    SOURCE_CHOICES = [
        (SOURCE_CUSTOM, "Custom"),
        (SOURCE_REFERRAL, "Referral product"),
    ]

    profile = models.ForeignKey(BirthdayProfile, on_delete=models.CASCADE, related_name="wishlist_items")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    external_url = models.URLField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default="GBP")
    is_reserved = models.BooleanField(default=False)
    visibility = models.CharField(max_length=16, choices=VISIBILITY_CHOICES, default=VISIBILITY_PUBLIC)
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES, default=SOURCE_CUSTOM)
    referral_product = models.ForeignKey(
        ReferralProduct, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlist_items"
    )
    allow_contributions = models.BooleanField(default=False)
    contribution_public = models.BooleanField(default=True, help_text="Show amount raised publicly.")
    target_amount = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        help_text="Max contribution target (up to £100).",
    )
    amount_raised = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class WishlistReservation(models.Model):
    item = models.OneToOneField(WishlistItem, on_delete=models.CASCADE, related_name="reservation")
    reserver_name = models.CharField(max_length=255)
    reserver_email = models.EmailField(blank=True)
    reserved_at = models.DateTimeField(auto_now_add=True)


class WishlistContribution(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_SUCCEEDED = "SUCCEEDED"
    STATUS_FAILED = "FAILED"
    STATUS_CANCELLED = "CANCELLED"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCEEDED, "Succeeded"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    item = models.ForeignKey(WishlistItem, on_delete=models.CASCADE, related_name="contributions")
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
    )
    contributor_name = models.CharField(max_length=255, blank=True)
    contributor_email = models.EmailField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    celebrant_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=8, default="GBP")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class SupportMessage(models.Model):
    MODERATION_PENDING = "PENDING"
    MODERATION_APPROVED = "APPROVED"
    MODERATION_REJECTED = "REJECTED"
    MODERATION_CHOICES = [
        (MODERATION_PENDING, "Pending"),
        (MODERATION_APPROVED, "Approved"),
        (MODERATION_REJECTED, "Rejected"),
    ]

    profile = models.ForeignKey(BirthdayProfile, on_delete=models.CASCADE, related_name="support_messages")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    sender_name = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    moderation_status = models.CharField(max_length=16, choices=MODERATION_CHOICES, default=MODERATION_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    # Celebrant reaction / reply (only set on APPROVED messages, by profile owner)
    celebrant_reaction = models.CharField(max_length=10, blank=True, help_text="Single emoji reaction from the celebrant.")
    reply_text = models.TextField(blank=True)
    reply_created_at = models.DateTimeField(null=True, blank=True)


class SupportContribution(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_SUCCEEDED = "SUCCEEDED"
    STATUS_FAILED = "FAILED"
    STATUS_CANCELLED = "CANCELLED"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCEEDED, "Succeeded"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    profile = models.ForeignKey(BirthdayProfile, on_delete=models.CASCADE, related_name="contributions")
    supporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, default="GBP")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    supporter_name = models.CharField(max_length=255, blank=True)
    supporter_email = models.EmailField(blank=True)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
