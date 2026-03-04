from django.urls import path

from apps.wallet.views import WalletDetailView, WalletLedgerView, WalletWithdrawView

urlpatterns = [
    path("wallet", WalletDetailView.as_view(), name="wallet-detail"),
    path("wallet/ledger", WalletLedgerView.as_view(), name="wallet-ledger"),
    path("wallet/withdraw", WalletWithdrawView.as_view(), name="wallet-withdraw"),
]
