from datetime import timedelta
import os
from pathlib import Path

from celery.schedules import crontab


BASE_DIR = Path(__file__).resolve().parent.parent


def env(name: str, default=None):
    return os.getenv(name, default)


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-secret-key")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = [host.strip() for host in env("DJANGO_ALLOWED_HOSTS", "*").split(",") if host.strip()]

INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "apps.accounts",
    "apps.birthdays",
    "apps.events",
    "apps.payments",
    "apps.venues",
    "apps.safety",
    "apps.gifts",
    "apps.wallet",
    "apps.notifications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": env("POSTGRES_DB", "birthday_app"),
        "USER": env("POSTGRES_USER", "birthday_user"),
        "PASSWORD": env("POSTGRES_PASSWORD", "birthday_pass"),
        "HOST": env("POSTGRES_HOST", "db"),
        "PORT": env("POSTGRES_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
]

LANGUAGE_CODE = "en-gb"
TIME_ZONE = env("TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTHENTICATION_BACKENDS = [
    "apps.accounts.auth_backends.EmailOrUsernameModelBackend",
    "django.contrib.auth.backends.ModelBackend",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "apply": env("THROTTLE_APPLY_RATE", "20/hour"),
        "messages": env("THROTTLE_MESSAGES_RATE", "30/hour"),
        "contributions": env("THROTTLE_CONTRIBUTIONS_RATE", "10/hour"),
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

CORS_ALLOWED_ORIGINS = [origin.strip() for origin in env("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Birthday Experiences + Support Ecosystem API",
    "DESCRIPTION": "Backend API for birthday profiles, curated events, payments, venues, and safety flows.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_SETTINGS": {
        "persistAuthorization": True,
        "displayRequestDuration": True,
    },
    "COMPONENT_SPLIT_REQUEST": True,
}

REDIS_URL = env("REDIS_URL", "redis://redis:6379/0")
CELERY_BROKER_URL = env("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", "redis://redis:6379/1")
CELERY_TIMEZONE = env("CELERY_TIMEZONE", "Europe/London")
CELERY_BEAT_SCHEDULE = {
    "scan-lock-deadlines-every-5-min": {
        "task": "apps.events.tasks.scan_lock_deadlines",
        "schedule": crontab(minute="*/5"),
    },
    "release-fraud-buffer-daily": {
        "task": "apps.wallet.tasks.release_fraud_buffer_entries",
        "schedule": crontab(hour=2, minute=0),  # 02:00 daily
    },
    "auto-payouts-daily": {
        "task": "apps.wallet.tasks.run_auto_payouts",
        "schedule": crontab(hour=3, minute=0),  # 03:00 daily
    },
    "birthday-reminders-daily": {
        "task": "apps.birthdays.tasks.send_birthday_reminders",
        "schedule": crontab(hour=8, minute=0),  # 08:00 daily
    },
    "moderation-queue-hourly": {
        "task": "apps.birthdays.tasks.process_moderation_queue",
        "schedule": crontab(minute=0),  # top of every hour
    },
    "event-reminders-hourly": {
        "task": "apps.events.tasks.send_event_reminders",
        "schedule": crontab(minute=0),  # top of every hour
    },
}

STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = env("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", "")
CONNECT_REFRESH_URL = env("CONNECT_REFRESH_URL", "http://localhost:3000/connect/refresh")
CONNECT_RETURN_URL = env("CONNECT_RETURN_URL", "http://localhost:3000/connect/return")
STRIPE_CONNECT_REFRESH_URL = env("STRIPE_CONNECT_REFRESH_URL", "http://localhost:8000/connect/refresh")
STRIPE_CONNECT_RETURN_URL = env("STRIPE_CONNECT_RETURN_URL", "http://localhost:8000/connect/return")
STRIPE_PLATFORM_FEE_PERCENT = float(env("STRIPE_PLATFORM_FEE_PERCENT", "10"))
DEV_OTP_CODE = env("DEV_OTP_CODE", "123456")
EMAIL_BACKEND = env("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", "smtp-relay.brevo.com")
EMAIL_PORT = int(env("EMAIL_PORT", "587"))
EMAIL_USE_TLS = env("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "no-reply@celnoia.com")
FRONTEND_EMAIL_VERIFY_URL = env("FRONTEND_EMAIL_VERIFY_URL", "http://localhost:3000/verify-email")
FRONTEND_URL = env("FRONTEND_URL", "http://localhost:3000")
