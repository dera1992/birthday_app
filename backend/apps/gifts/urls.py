from django.urls import path

from apps.gifts.views import GiftCreateIntentView, GiftProductListView, PublicGiftListView

urlpatterns = [
    path("gifts/products", GiftProductListView.as_view(), name="gift-product-list"),
    path("birthday-profile/<slug:slug>/gifts", PublicGiftListView.as_view(), name="birthday-gifts"),
    path(
        "birthday-profile/<slug:slug>/gifts/create-intent",
        GiftCreateIntentView.as_view(),
        name="gift-create-intent",
    ),
]
