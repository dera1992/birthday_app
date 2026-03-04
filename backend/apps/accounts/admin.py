from django.contrib import admin

from apps.accounts.admin_forms import EmailAdminAuthenticationForm
from apps.accounts.models import UserVerification


admin.site.login_form = EmailAdminAuthenticationForm


@admin.register(UserVerification)
class UserVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number", "phone_verified_at", "email_verified_at")
    search_fields = ("user__username", "user__email", "phone_number")
