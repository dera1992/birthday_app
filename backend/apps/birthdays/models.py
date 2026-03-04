from django.conf import settings
from django.db import models


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
    profile = models.ForeignKey(BirthdayProfile, on_delete=models.CASCADE, related_name="wishlist_items")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    external_url = models.URLField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default="GBP")
    is_reserved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class WishlistReservation(models.Model):
    item = models.OneToOneField(WishlistItem, on_delete=models.CASCADE, related_name="reservation")
    reserver_name = models.CharField(max_length=255)
    reserver_email = models.EmailField(blank=True)
    reserved_at = models.DateTimeField(auto_now_add=True)


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
