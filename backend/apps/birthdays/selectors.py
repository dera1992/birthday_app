from django.shortcuts import get_object_or_404

from apps.birthdays.models import BirthdayProfile, SupportContribution, SupportMessage, WishlistItem


def get_profile_by_slug(slug: str) -> BirthdayProfile:
    return get_object_or_404(BirthdayProfile, slug=slug)


def get_profile_for_user(slug: str, user) -> BirthdayProfile:
    return get_object_or_404(BirthdayProfile, slug=slug, user=user)


def get_wishlist_item(pk: int) -> WishlistItem:
    return get_object_or_404(WishlistItem.objects.select_related("profile", "profile__user"), pk=pk)


def get_wishlist_item_for_user(pk: int, user) -> WishlistItem:
    return get_object_or_404(WishlistItem.objects.select_related("profile"), pk=pk, profile__user=user)


def get_support_message_for_owner(message_id: int, owner):
    return get_object_or_404(
        SupportMessage.objects.select_related("profile", "profile__user"),
        pk=message_id,
        profile__user=owner,
    )


def get_contributions_for_owner(slug: str, owner):
    profile = get_object_or_404(BirthdayProfile, slug=slug, user=owner)
    return SupportContribution.objects.filter(profile=profile).order_by("-created_at")
