"""
Brevo Transactional SMS sender.
"""
import requests
from django.conf import settings


def send_sms(to: str, message: str) -> bool:
    """
    Send an SMS via Brevo Transactional SMS API.
    `to` must be in E.164 format e.g. +447700900123
    Returns True on success, False on failure.
    """
    api_key = getattr(settings, "BREVO_API_KEY", "")
    sender = getattr(settings, "BREVO_SMS_SENDER", "Celnoia")

    if not api_key:
        return False

    response = requests.post(
        "https://api.brevo.com/v3/transactionalSMS/sms",
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "sender": sender,
            "recipient": to,
            "content": message,
            "type": "transactional",
        },
        timeout=10,
    )
    return response.status_code in (200, 201)
