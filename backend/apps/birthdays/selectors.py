import datetime

from django.shortcuts import get_object_or_404

from apps.birthdays.models import BirthdayProfile, ReferralProduct, SupportContribution, SupportMessage, WishlistContribution, WishlistItem


def get_profile_by_slug(slug: str) -> BirthdayProfile:
    return get_object_or_404(BirthdayProfile, slug=slug)


def get_profile_for_user(slug: str, user) -> BirthdayProfile:
    return get_object_or_404(BirthdayProfile, slug=slug, user=user)


def get_wishlist_item(pk: int) -> WishlistItem:
    return get_object_or_404(WishlistItem.objects.select_related("profile", "profile__user"), pk=pk)


def get_wishlist_item_for_user(pk: int, user) -> WishlistItem:
    return get_object_or_404(WishlistItem.objects.select_related("profile"), pk=pk, profile__user=user)


def get_public_wishlist_items(profile: BirthdayProfile):
    """Items visible to non-owners: PUBLIC only, and birthday not yet passed this year."""
    today = datetime.date.today()
    try:
        birthday_this_year = datetime.date(today.year, profile.month, profile.day)
        birthday_passed = today > birthday_this_year
    except ValueError:
        birthday_passed = False
    qs = profile.wishlist_items.select_related("referral_product").filter(
        visibility=WishlistItem.VISIBILITY_PUBLIC
    )
    if birthday_passed:
        qs = qs.none()
    return qs


def get_wishlist_contribution(pk: int) -> WishlistContribution:
    return get_object_or_404(WishlistContribution.objects.select_related("item", "item__profile"), pk=pk)


def get_active_referral_products(category: str = ""):
    qs = ReferralProduct.objects.filter(is_active=True)
    if category:
        qs = qs.filter(category=category)
    return qs


def get_support_message_for_owner(message_id: int, owner):
    return get_object_or_404(
        SupportMessage.objects.select_related("profile", "profile__user"),
        pk=message_id,
        profile__user=owner,
    )


def get_contributions_for_owner(slug: str, owner):
    profile = get_object_or_404(BirthdayProfile, slug=slug, user=owner)
    return SupportContribution.objects.filter(profile=profile).order_by("-created_at")
