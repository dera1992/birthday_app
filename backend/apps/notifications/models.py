from django.contrib.auth.models import User
from django.db import models


class Notification(models.Model):
    TYPE_APPLICATION_RECEIVED = "APPLICATION_RECEIVED"
    TYPE_APPLICATION_APPROVED = "APPLICATION_APPROVED"
    TYPE_APPLICATION_DECLINED = "APPLICATION_DECLINED"
    TYPE_EVENT_REMINDER = "EVENT_REMINDER"
    TYPE_BIRTHDAY_REMINDER = "BIRTHDAY_REMINDER"
    TYPE_MODERATION_PENDING = "MODERATION_PENDING"

    TYPE_CHOICES = [
        (TYPE_APPLICATION_RECEIVED, "Application received"),
        (TYPE_APPLICATION_APPROVED, "Application approved"),
        (TYPE_APPLICATION_DECLINED, "Application declined"),
        (TYPE_EVENT_REMINDER, "Event reminder"),
        (TYPE_BIRTHDAY_REMINDER, "Birthday reminder"),
        (TYPE_MODERATION_PENDING, "Moderation pending"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=40, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    action_url = models.CharField(max_length=500, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_read(self):
        return self.read_at is not None
