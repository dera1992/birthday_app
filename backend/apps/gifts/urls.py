from django.urls import path

from apps.gifts.views import (
    AIGiftGenerationStatusView,
    AIGiftSelectOptionView,
    GiftCreateIntentView,
    GiftProductDetailView,
    GiftProductListView,
    GiftPurchaseDetailView,
    GiftPurchaseDownloadView,
    PublicGiftListView,
)

urlpatterns = [
    path("gifts/catalog", GiftProductListView.as_view(), name="gift-catalog"),
    path("gifts/products", GiftProductListView.as_view(), name="gift-product-list"),
    path("gifts/<slug:slug>", GiftProductDetailView.as_view(), name="gift-product-detail"),
    path("gifts/purchases/<int:purchase_id>", GiftPurchaseDetailView.as_view(), name="gift-purchase-detail"),
    path("gifts/purchases/<int:purchase_id>/download", GiftPurchaseDownloadView.as_view(), name="gift-purchase-download"),
    path("gifts/purchases/<int:purchase_id>/generation-status", AIGiftGenerationStatusView.as_view(), name="gift-generation-status"),
    path("gifts/purchases/<int:purchase_id>/select-option", AIGiftSelectOptionView.as_view(), name="gift-select-option"),
    path("birthday-profile/<slug:slug>/gifts", PublicGiftListView.as_view(), name="birthday-gifts"),
    path(
        "birthday-profile/<slug:slug>/gifts/create-intent",
        GiftCreateIntentView.as_view(),
        name="gift-create-intent",
    ),
]
