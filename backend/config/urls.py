from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-docs-swagger"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="api-schema"), name="api-docs-redoc"),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.birthdays.urls")),
    path("api/", include("apps.events.urls")),
    path("api/", include("apps.payments.urls_connect")),
    path("api/", include("apps.payments.urls")),
    path("api/", include("apps.venues.urls")),
    path("api/", include("apps.safety.urls")),
    path("api/", include("apps.gifts.urls")),
    path("api/", include("apps.wallet.urls")),
    path("api/", include("apps.notifications.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
