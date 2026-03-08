"""
AI gift generation service layer.

Responsibilities:
- Build prompts from product + user input
- Invoke provider (Nano Banana) to generate image options
- Persist results back to GiftPurchase and AIGenerationJob
- Select a generated option and mark the gift as downloadable

This module is intentionally decoupled from Celery — tasks in tasks.py call these
functions.  Direct calls are fine for testing and admin tooling.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.db import transaction

from apps.gifts.providers.nano_banana import get_nano_banana_provider
from apps.gifts.providers.base import ProviderError

if TYPE_CHECKING:
    from apps.gifts.models import AIGenerationJob, GiftProduct, GiftPurchase

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default prompt templates per AI generation category
# ---------------------------------------------------------------------------
_DEFAULT_PROMPTS: dict[str, str] = {
    "CARD": (
        "Create a premium birthday card design for {celebrant_name}. "
        "Include the message: '{message}'. Sender: {sender_name}. Style: {style}. "
        "Make it celebratory, polished, visually readable, and suitable for gifting."
    ),
    "FLOWER": (
        "Create a beautiful virtual flower birthday gift for {celebrant_name}. "
        "Include the message: '{message}'. Sender: {sender_name}. Style: {style}. "
        "Make it decorative, elegant, and gift-worthy."
    ),
    "MESSAGE": (
        "Create a beautifully designed birthday message card for {celebrant_name}. "
        "Include the message: '{message}'. Sender: {sender_name}. Style: {style}. "
        "Make it warm, expressive, and visually appealing."
    ),
    "BADGE": (
        "Create a celebratory birthday badge design for {celebrant_name}. "
        "Include the message: '{message}'. Sender: {sender_name}. Style: {style}. "
        "Make it premium, fun, and highly shareable."
    ),
    "VIDEO": (
        "Create a still cover image for a birthday video gift for {celebrant_name}. "
        "Include the message: '{message}'. Sender: {sender_name}. Style: {style}. "
        "Make it cinematic, celebratory, and visually rich. "
        "(Note: V1 generates a still cover; full video generation is a future feature.)"
    ),
}


def _get_provider(product: "GiftProduct"):
    """Return the appropriate provider instance for the given product."""
    provider_key = (product.ai_generation_provider or "NANO_BANANA").upper()
    if provider_key == "NANO_BANANA":
        return get_nano_banana_provider()
    raise ValueError(f"Unknown AI generation provider: {provider_key!r}")


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def build_prompt(product: "GiftProduct", prompt_input: dict) -> str:
    """
    Build the final generation prompt from product config + user-supplied input.

    `prompt_input` should contain: celebrant_name, sender_name, message, style.
    Falls back to sensible defaults for missing fields.
    """
    template = product.ai_prompt_template or _DEFAULT_PROMPTS.get(
        product.ai_generation_category or product.category, _DEFAULT_PROMPTS["CARD"]
    )
    return template.format(
        celebrant_name=prompt_input.get("celebrant_name", "the birthday celebrant"),
        sender_name=prompt_input.get("sender_name", "a friend"),
        message=prompt_input.get("message", "Happy Birthday!"),
        style=prompt_input.get("style", "Elegant"),
    )


def generate_ai_gift_options(purchase: "GiftPurchase") -> list[dict]:
    """
    Generate AI design options for `purchase`.

    Returns a list of option dicts (see providers/base.py for shape).
    Raises ProviderError on provider failure.
    """
    product = purchase.product
    prompt_input = purchase.ai_prompt_input or {}
    prompt = build_prompt(product, prompt_input)
    count = product.ai_option_count or 2

    provider = _get_provider(product)
    options = provider.generate_images(prompt, count=count)
    return options


@transaction.atomic
def persist_generated_options(purchase: "GiftPurchase", options: list[dict]) -> "GiftPurchase":
    """
    Persist generated options to the purchase and mark generation_status as GENERATED.
    """
    from apps.gifts.models import GiftPurchase

    purchase.generated_options = options
    purchase.generation_status = GiftPurchase.GenerationStatus.GENERATED
    purchase.save(update_fields=["generated_options", "generation_status"])
    return purchase


@transaction.atomic
def select_generated_option(purchase: "GiftPurchase", option_index: int) -> "GiftPurchase":
    """
    Mark option_index as selected, set selected_asset_url and ai_download_url,
    and flip is_downloadable.  Returns the updated purchase.

    Raises ValueError if the index is out of range or options are not yet generated.
    """
    from apps.gifts.models import GiftPurchase

    options = purchase.generated_options or []
    if not options:
        raise ValueError("No generated options available for this purchase.")

    # Find option by index
    option = next((o for o in options if o.get("option_index") == option_index), None)
    if option is None:
        if 0 <= option_index < len(options):
            option = options[option_index]
        else:
            raise ValueError(f"Option index {option_index} is out of range.")

    asset_url = option.get("asset_url", "")

    purchase.selected_option_index = option_index
    purchase.selected_asset_url = asset_url
    purchase.ai_download_url = asset_url  # same URL; extend here for storage copy
    purchase.is_downloadable = bool(asset_url)
    purchase.generation_status = GiftPurchase.GenerationStatus.SELECTED
    purchase.save(update_fields=[
        "selected_option_index",
        "selected_asset_url",
        "ai_download_url",
        "is_downloadable",
        "generation_status",
    ])
    return purchase


def run_generation_for_purchase(purchase_id: int) -> "GiftPurchase":
    """
    Full end-to-end generation pipeline for a single purchase.
    Called from the Celery task.

    Returns the updated purchase on success.
    Raises on failure (caller should handle and update job status).
    """
    from apps.gifts.models import AIGenerationJob, GiftPurchase

    purchase = GiftPurchase.objects.select_related("product").get(pk=purchase_id)

    if purchase.status != GiftPurchase.Status.SUCCEEDED:
        raise ValueError(f"Purchase {purchase_id} has not been paid (status={purchase.status}).")

    if not purchase.product.is_ai_generated_product:
        raise ValueError(f"Purchase {purchase_id} product is not an AI generated product.")

    # Create / retrieve job record
    job: AIGenerationJob = AIGenerationJob.objects.create(
        purchase=purchase,
        provider=purchase.product.ai_generation_provider or "NANO_BANANA",
        status=AIGenerationJob.JobStatus.PROCESSING,
        request_payload={"prompt_input": purchase.ai_prompt_input},
    )

    # Mark purchase as processing
    purchase.generation_status = GiftPurchase.GenerationStatus.PROCESSING
    purchase.save(update_fields=["generation_status"])

    try:
        options = generate_ai_gift_options(purchase)
        purchase = persist_generated_options(purchase, options)

        job.status = AIGenerationJob.JobStatus.SUCCEEDED
        job.response_payload = {"options": options}
        job.save(update_fields=["status", "response_payload", "updated_at"])

    except ProviderError as exc:
        logger.error("AI generation failed for purchase %s: %s", purchase_id, exc)

        job.status = AIGenerationJob.JobStatus.FAILED
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_message", "updated_at"])

        purchase.generation_status = GiftPurchase.GenerationStatus.FAILED
        purchase.save(update_fields=["generation_status"])
        raise

    return purchase
