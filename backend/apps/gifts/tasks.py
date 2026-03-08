"""
Celery tasks for the gifts app.

generate_ai_gift_options_task — triggered after a successful AI gift payment.
"""
from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3
_RETRY_BACKOFF_BASE = 60  # seconds


@shared_task(bind=True, max_retries=_MAX_RETRIES, default_retry_delay=_RETRY_BACKOFF_BASE)
def generate_ai_gift_options_task(self, purchase_id: int):
    """
    Async task: generate AI design options for an AI gift purchase.

    Called after payment_intent.succeeded webhook confirms payment.
    On failure, retries up to _MAX_RETRIES times with exponential back-off.
    """
    from apps.gifts.ai_services import run_generation_for_purchase
    from apps.gifts.providers.base import ProviderError

    logger.info("generate_ai_gift_options_task: starting for purchase_id=%s", purchase_id)

    try:
        purchase = run_generation_for_purchase(purchase_id)
        logger.info(
            "generate_ai_gift_options_task: completed for purchase_id=%s, status=%s",
            purchase_id,
            purchase.generation_status,
        )
    except ProviderError as exc:
        logger.warning(
            "generate_ai_gift_options_task: provider error for purchase_id=%s (attempt %s/%s): %s",
            purchase_id,
            self.request.retries + 1,
            _MAX_RETRIES,
            exc,
        )
        raise self.retry(exc=exc, countdown=_RETRY_BACKOFF_BASE * (2 ** self.request.retries))
    except ValueError as exc:
        # Non-retryable errors (purchase not paid, wrong product type, etc.)
        logger.error(
            "generate_ai_gift_options_task: non-retryable error for purchase_id=%s: %s",
            purchase_id,
            exc,
        )
        raise
