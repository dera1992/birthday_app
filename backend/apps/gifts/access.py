from __future__ import annotations

from django.conf import settings
from django.http import Http404


def gift_purchase_share_url(purchase) -> str:
    base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{base}/gifts/{purchase.id}?token={purchase.share_token}"


def gift_purchase_download_url(request, purchase) -> str:
    path = f"/api/gifts/purchases/{purchase.id}/download?token={purchase.share_token}"
    if request is not None:
        return request.build_absolute_uri(path)
    return path


def user_can_access_gift_purchase(request, purchase) -> bool:
    token = request.query_params.get("token") or request.GET.get("token")
    if token and token == purchase.share_token:
        return True

    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return False

    if user == purchase.celebrant:
        return True
    if purchase.buyer_user_id and user.id == purchase.buyer_user_id:
        return True
    return False


def assert_gift_purchase_access(request, purchase):
    if purchase.status == purchase.Status.FAILED:
        raise Http404("Gift purchase is not available.")
    if not user_can_access_gift_purchase(request, purchase):
        raise Http404("Gift purchase not found.")
