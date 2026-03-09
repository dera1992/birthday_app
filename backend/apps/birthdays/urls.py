from django.urls import path

from apps.birthdays.views import (
    BirthdayProfileCreateView,
    BirthdayProfileDetailView,
    PublicWishlistItemListView,
    ReferralProductClickView,
    ReferralProductListView,
    SupportMessageApproveView,
    SupportContributionCollectionView,
    SupportContributionIntentView,
    SupportMessageCollectionView,
    SupportMessageReactView,
    SupportMessageRejectView,
    SupportMessageReplyView,
    WishlistContributionIntentView,
    WishlistItemCreateView,
    WishlistItemDetailView,
    WishlistReserveView,
)


urlpatterns = [
    path("birthday-profile", BirthdayProfileCreateView.as_view(), name="birthday-profile-create"),
    path("birthday-profile/<slug:slug>", BirthdayProfileDetailView.as_view(), name="birthday-profile-detail"),
    path("birthday-profile/<slug:slug>/wishlist-items", WishlistItemCreateView.as_view(), name="wishlist-item-create"),
    path("birthday-profile/<slug:slug>/public-wishlist", PublicWishlistItemListView.as_view(), name="public-wishlist"),
    path("wishlist-items/<int:pk>", WishlistItemDetailView.as_view(), name="wishlist-item-detail"),
    path("wishlist-items/<int:pk>/reserve", WishlistReserveView.as_view(), name="wishlist-reserve"),
    path("wishlist-items/<int:pk>/contributions/create-intent", WishlistContributionIntentView.as_view(), name="wishlist-contribution-intent"),
    path("birthday-profile/<slug:slug>/messages", SupportMessageCollectionView.as_view(), name="birthday-messages"),
    path("birthday-profile/<slug:slug>/contributions", SupportContributionCollectionView.as_view(), name="birthday-contributions"),
    path(
        "birthday-profile/<slug:slug>/contributions/create-intent",
        SupportContributionIntentView.as_view(),
        name="birthday-contribution-intent",
    ),
    path("support-messages/<int:message_id>/approve", SupportMessageApproveView.as_view(), name="support-message-approve"),
    path("support-messages/<int:message_id>/reject", SupportMessageRejectView.as_view(), name="support-message-reject"),
    path("support-messages/<int:message_id>/react", SupportMessageReactView.as_view(), name="support-message-react"),
    path("support-messages/<int:message_id>/reply", SupportMessageReplyView.as_view(), name="support-message-reply"),
    path("referral-products", ReferralProductListView.as_view(), name="referral-products"),
    path("referral-products/<int:pk>/click", ReferralProductClickView.as_view(), name="referral-product-click"),
]
