from rest_framework.exceptions import NotFound

from apps.gifts.models import GiftProduct, GiftPurchase


def get_active_products():
    return GiftProduct.objects.filter(is_active=True)


def get_product_by_slug(slug: str) -> GiftProduct:
    try:
        return GiftProduct.objects.get(slug=slug, is_active=True)
    except GiftProduct.DoesNotExist:
        raise NotFound("Gift product not found.")


def get_purchase_by_payment_intent(intent_id: str) -> GiftPurchase:
    try:
        return GiftPurchase.objects.select_related("product", "celebrant").get(
            stripe_payment_intent_id=intent_id
        )
    except GiftPurchase.DoesNotExist:
        raise NotFound("Gift purchase not found.")


def get_public_gifts_for_profile(birthday_profile):
    return GiftPurchase.objects.filter(
        birthday_profile=birthday_profile,
        status=GiftPurchase.Status.SUCCEEDED,
        visibility=GiftPurchase.Visibility.PUBLIC,
    ).select_related("product").order_by("-created_at")
