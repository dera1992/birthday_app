from django.conf import settings

from apps.payments.services import get_or_create_connect_account, raise_payment_provider_error


def get_or_create_express_account(user):
    return get_or_create_connect_account(user)


def create_account_link(connect_account, refresh_url=None, return_url=None):
    from apps.payments.services import stripe

    try:
        link = stripe.AccountLink.create(
            account=connect_account.stripe_account_id,
            refresh_url=refresh_url or settings.CONNECT_REFRESH_URL,
            return_url=return_url or settings.CONNECT_RETURN_URL,
            type="account_onboarding",
        )
    except Exception as exc:
        raise_payment_provider_error(exc)
    return link["url"]
