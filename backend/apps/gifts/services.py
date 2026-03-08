from decimal import Decimal, ROUND_DOWN

import stripe
from django.conf import settings
from django.db import transaction

from apps.gifts.access import gift_purchase_share_url
from apps.gifts.models import GiftProduct, GiftPurchase
from apps.payments.services import raise_payment_provider_error, to_minor_units


stripe.api_key = settings.STRIPE_SECRET_KEY


def _compute_amounts(product: GiftProduct) -> tuple[Decimal, Decimal, Decimal]:
    gross = product.price
    platform_amount = (gross * Decimal(product.platform_fee_bps) / Decimal(10000)).quantize(
        Decimal("0.01"), rounding=ROUND_DOWN
    )
    celebrant_amount = gross - platform_amount
    return gross, platform_amount, celebrant_amount


@transaction.atomic
def create_gift_payment_intent(
    *,
    product: GiftProduct,
    birthday_profile,
    buyer_user=None,
    buyer_name: str = "",
    buyer_email: str = "",
    custom_message: str = "",
    from_name: str = "",
    customization_data: dict | None = None,
    is_anonymous: bool = False,
    visibility: str = GiftPurchase.Visibility.PUBLIC,
    idempotency_key: str | None = None,
    ai_prompt_input: dict | None = None,
) -> tuple[GiftPurchase, dict]:
    celebrant = birthday_profile.user
    gross, platform_amount, celebrant_amount = _compute_amounts(product)

    # Determine initial generation_status
    gen_status = (
        GiftPurchase.GenerationStatus.PENDING
        if product.is_ai_generated_product
        else GiftPurchase.GenerationStatus.NOT_REQUIRED
    )

    purchase = GiftPurchase.objects.create(
        product=product,
        celebrant=celebrant,
        birthday_profile=birthday_profile,
        buyer_user=buyer_user,
        buyer_name=buyer_name or (buyer_user.get_full_name() if buyer_user else ""),
        buyer_email=buyer_email or (buyer_user.email if buyer_user else ""),
        custom_message=custom_message,
        from_name=from_name,
        customization_data=customization_data or {},
        is_anonymous=is_anonymous,
        visibility=visibility,
        status=GiftPurchase.Status.PENDING,
        gross_amount=gross,
        platform_amount=platform_amount,
        celebrant_amount=celebrant_amount,
        generation_status=gen_status,
        ai_prompt_input=ai_prompt_input or {},
    )

    try:
        intent = stripe.PaymentIntent.create(
            amount=to_minor_units(gross, product.currency),
            currency=product.currency.lower(),
            metadata={
                "type": "gift_purchase",
                "purchase_id": str(purchase.id),
                "celebrant_id": str(celebrant.id),
                "product_slug": product.slug,
            },
            idempotency_key=idempotency_key,
        )
    except Exception as exc:
        raise_payment_provider_error(exc)

    purchase.stripe_payment_intent_id = intent["id"]
    purchase.save(update_fields=["stripe_payment_intent_id"])
    return purchase, intent


def mark_gift_purchase_succeeded(purchase: GiftPurchase, charge_id: str = "") -> GiftPurchase:
    purchase.status = GiftPurchase.Status.SUCCEEDED
    purchase.stripe_charge_id = charge_id or purchase.stripe_charge_id
    purchase.rendered_snapshot_url = gift_purchase_share_url(purchase)
    purchase.save(update_fields=["status", "stripe_charge_id", "rendered_snapshot_url"])
    return purchase


def mark_gift_purchase_failed(purchase: GiftPurchase) -> GiftPurchase:
    purchase.status = GiftPurchase.Status.FAILED
    purchase.save(update_fields=["status"])
    return purchase
