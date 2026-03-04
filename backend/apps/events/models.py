from django.conf import settings
from django.contrib.gis.db import models


class CuratedPack(models.Model):
    name = models.CharField(max_length=128)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon_emoji = models.CharField(max_length=8, default="🎂")
    is_active = models.BooleanField(default=True)
    defaults = models.JSONField(default=dict)
    # defaults keys: category, agenda_template, min_guests, max_guests, radius_meters,
    # payment_mode, criteria_defaults (dict), venue_categories (list), budget_range_label

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.icon_emoji} {self.name}"


class BirthdayEvent(models.Model):
    VISIBILITY_DISCOVERABLE = "DISCOVERABLE"
    VISIBILITY_INVITE_ONLY = "INVITE_ONLY"
    VISIBILITY_CHOICES = [
        (VISIBILITY_DISCOVERABLE, "Discoverable"),
        (VISIBILITY_INVITE_ONLY, "Invite only"),
    ]

    PAYMENT_MODE_FREE = "FREE"
    PAYMENT_MODE_PAID = "PAID"
    PAYMENT_MODE_CHOICES = [
        (PAYMENT_MODE_FREE, "Free"),
        (PAYMENT_MODE_PAID, "Paid"),
    ]

    STATE_DRAFT = "DRAFT"
    STATE_OPEN = "OPEN"
    STATE_MIN_MET = "MIN_MET"
    STATE_LOCKED = "LOCKED"
    STATE_CONFIRMED = "CONFIRMED"
    STATE_COMPLETED = "COMPLETED"
    STATE_CANCELLED = "CANCELLED"
    STATE_EXPIRED = "EXPIRED"
    STATE_CHOICES = [
        (STATE_DRAFT, "Draft"),
        (STATE_OPEN, "Open"),
        (STATE_MIN_MET, "Min met"),
        (STATE_LOCKED, "Locked"),
        (STATE_CONFIRMED, "Confirmed"),
        (STATE_COMPLETED, "Completed"),
        (STATE_CANCELLED, "Cancelled"),
        (STATE_EXPIRED, "Expired"),
    ]

    VENUE_NOT_SET = "NOT_SET"
    VENUE_PROPOSED = "PROPOSED"
    VENUE_CONFIRMED = "CONFIRMED"
    VENUE_STATUS_CHOICES = [
        (VENUE_NOT_SET, "Not set"),
        (VENUE_PROPOSED, "Proposed"),
        (VENUE_CONFIRMED, "Confirmed"),
    ]

    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="hosted_events")
    payee_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payable_events",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    agenda = models.TextField(blank=True)
    category = models.CharField(max_length=64)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    visibility = models.CharField(max_length=16, choices=VISIBILITY_CHOICES, default=VISIBILITY_INVITE_ONLY)
    expand_to_strangers = models.BooleanField(default=False)
    location_point = models.PointField(geography=True)
    radius_meters = models.PositiveIntegerField(default=10000)
    approx_area_label = models.CharField(max_length=255)
    min_guests = models.PositiveIntegerField(default=1)
    max_guests = models.PositiveIntegerField(default=20)
    criteria = models.JSONField(default=dict, blank=True)
    pack = models.ForeignKey(
        "events.CuratedPack",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    payment_mode = models.CharField(max_length=16, choices=PAYMENT_MODE_CHOICES, default=PAYMENT_MODE_FREE)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    target_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default="GBP")
    expense_breakdown = models.TextField(blank=True)
    state = models.CharField(max_length=16, choices=STATE_CHOICES, default=STATE_DRAFT)
    venue_status = models.CharField(max_length=16, choices=VENUE_STATUS_CHOICES, default=VENUE_NOT_SET)
    venue_name = models.CharField(max_length=255, blank=True)
    lock_deadline_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["state", "visibility", "category"])]

    @property
    def approved_count(self):
        return self.applications.filter(status=EventApplication.STATUS_APPROVED).count()


class EventInvite(models.Model):
    event = models.ForeignKey(BirthdayEvent, on_delete=models.CASCADE, related_name="invites")
    code = models.CharField(max_length=64, unique=True)
    max_uses = models.PositiveIntegerField(default=0)
    used_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)


class EventApplication(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_DECLINED = "DECLINED"
    STATUS_WITHDRAWN = "WITHDRAWN"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_DECLINED, "Declined"),
        (STATUS_WITHDRAWN, "Withdrawn"),
    ]

    event = models.ForeignKey(BirthdayEvent, on_delete=models.CASCADE, related_name="applications")
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_applications")
    intro_message = models.TextField(blank=True)
    invite_code_used = models.CharField(max_length=64, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("event", "applicant")


class EventAttendee(models.Model):
    STATUS_ACTIVE = "ACTIVE"
    STATUS_CANCELLED = "CANCELLED"
    STATUS_NO_SHOW = "NO_SHOW"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_NO_SHOW, "No show"),
    ]

    event = models.ForeignKey(BirthdayEvent, on_delete=models.CASCADE, related_name="attendees")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendances")
    application = models.OneToOneField("events.EventApplication", on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "user")
