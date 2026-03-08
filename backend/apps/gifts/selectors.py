from django.db.models import Q
from rest_framework.exceptions import NotFound

from apps.gifts.models import GiftProduct, GiftPurchase


def get_active_products(category: str | None = None):
    queryset = GiftProduct.objects.filter(is_active=True).select_related("template").filter(
        Q(template__isnull=True)
        | Q(template__is_active=True, template__publication_status="PUBLISHED")
    )
    if category:
        queryset = queryset.filter(category=category)
    return queryset


def get_product_by_slug(slug: str) -> GiftProduct:
    try:
        return GiftProduct.objects.select_related("template").filter(
            Q(template__isnull=True)
            | Q(template__is_active=True, template__publication_status="PUBLISHED"),
            slug=slug,
            is_active=True,
        ).get()
    except GiftProduct.DoesNotExist:
        raise NotFound("Gift product not found.")


def get_purchase_by_payment_intent(intent_id: str) -> GiftPurchase:
    try:
        return GiftPurchase.objects.select_related("product", "product__template", "celebrant").get(
            stripe_payment_intent_id=intent_id
        )
    except GiftPurchase.DoesNotExist:
        raise NotFound("Gift purchase not found.")


def get_visible_gifts_for_profile(birthday_profile, include_private: bool = False):
    queryset = GiftPurchase.objects.filter(
        birthday_profile=birthday_profile,
        status=GiftPurchase.Status.SUCCEEDED,
    )
    if not include_private:
        queryset = queryset.filter(visibility=GiftPurchase.Visibility.PUBLIC)
    return queryset.select_related("product", "product__template").order_by("-created_at")


def get_purchase_by_id(purchase_id: int) -> GiftPurchase:
    try:
        return GiftPurchase.objects.select_related("product", "product__template", "celebrant", "buyer_user").get(id=purchase_id)
    except GiftPurchase.DoesNotExist:
        raise NotFound("Gift purchase not found.")
