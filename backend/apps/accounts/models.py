from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class UserVerification(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="verification")
    email_verified_at = models.DateTimeField(null=True, blank=True)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    phone_number = models.CharField(max_length=32, blank=True)
    risk_flags = models.JSONField(default=dict, blank=True)

    def mark_email_verified(self):
        self.email_verified_at = timezone.now()
        self.save(update_fields=["email_verified_at"])

    def mark_phone_verified(self, phone_number: str):
        self.phone_number = phone_number
        self.phone_verified_at = timezone.now()
        self.save(update_fields=["phone_number", "phone_verified_at"])


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_user_verification(sender, instance, created, **kwargs):
    if created:
        UserVerification.objects.create(user=instance)
