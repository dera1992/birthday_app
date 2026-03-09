"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingBlock } from "@/components/ui/state-block";
import { useWallet, useWalletLedger, useWithdraw, useUpdateWallet } from "@/features/wallet/api";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { formatCurrency, formatDate } from "@/lib/utils";

type PaymentHistoryEntry = {
  id: string;
  type: "GIFT" | "CONTRIBUTION" | "EVENT_REGISTRATION";
  description: string;
  to: string;
  amount: string;
  currency: string;
  reference: string;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  GIFT: "🎁 Digital Gift",
  CONTRIBUTION: "💝 Wishlist Contribution",
  EVENT_REGISTRATION: "🎟️ Event Registration",
};

const LEDGER_STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  AVAILABLE: "success",
  PENDING: "warning",
  SETTLED: "outline",
};

export default function WalletPage() {
  const walletQuery = useWallet();
  const ledgerQuery = useWalletLedger();
  const withdrawMutation = useWithdraw();
  const updateWallet = useUpdateWallet();
  const paymentHistoryQuery = useQuery({
    queryKey: ["payment-history"],
    queryFn: () => apiRequest<PaymentHistoryEntry[]>("/payments/history"),
  });
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  if (walletQuery.isLoading) {
    return <LoadingBlock message="Loading wallet..." />;
  }

  if (walletQuery.error) {
    return <ErrorState description={getErrorMessage(walletQuery.error, "Unable to load wallet.")} />;
  }

  const wallet = walletQuery.data!;

  async function handleWithdraw() {
    setWithdrawError(null);
    const amount = withdrawAmount.trim();
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setWithdrawError("Enter a valid amount.");
      return;
    }
    try {
      const res = await withdrawMutation.mutateAsync(amount);
      toast.success(`Payout of ${formatCurrency(res.amount, "GBP")} initiated.`);
      setWithdrawAmount("");
    } catch (error) {
      setWithdrawError(getErrorMessage(error, "Unable to process withdrawal."));
    }
  }

  async function handleModeToggle(mode: "MANUAL" | "AUTO") {
    setSettingsError(null);
    try {
      await updateWallet.mutateAsync({ payout_mode: mode });
      toast.success("Payout mode updated.");
    } catch (error) {
      setSettingsError(getErrorMessage(error, "Unable to update payout settings."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earnings from gifts, contributions, and event registrations appear here. Funds are held for 5 days before becoming available to withdraw.
        </p>
      </div>

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pending balance</p>
            <p className="mt-2 font-display text-4xl">{formatCurrency(wallet.pending_balance, "GBP")}</p>
            <p className="mt-1 text-xs text-muted-foreground">Held for fraud buffer (5-day window)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Available balance</p>
            <p className="mt-2 font-display text-4xl text-emerald-600">{formatCurrency(wallet.available_balance, "GBP")}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ready to withdraw</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
        {/* Manual withdraw */}
        <Card>
          <CardHeader>
            <CardTitle>Withdraw funds</CardTitle>
            <CardDescription>
              Transfers to your Stripe Connect account. Requires completed{" "}
              <Link href="/connect" className="underline underline-offset-2">
                Connect onboarding
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorNotice message={withdrawError} />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount (GBP)"
                min="1"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
                {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {formatCurrency(wallet.available_balance, "GBP")}
            </p>
          </CardContent>
        </Card>

        {/* Payout settings */}
        <Card>
          <CardHeader>
            <CardTitle>Payout settings</CardTitle>
            <CardDescription>Configure how and when funds are paid out automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorNotice message={settingsError} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mode</span>
              <div className="flex rounded-full border border-border p-0.5">
                {(["MANUAL", "AUTO"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeToggle(mode)}
                    disabled={updateWallet.isPending}
                    className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                      wallet.payout_mode === mode
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === "MANUAL" ? "Manual" : "Auto"}
                  </button>
                ))}
              </div>
            </div>
            {wallet.payout_mode === "AUTO" ? (
              <div className="rounded-[16px] border border-border bg-secondary/50 p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <Badge variant="outline">{wallet.auto_payout_frequency}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min threshold</span>
                  <span className="font-medium">{formatCurrency(wallet.auto_payout_min_threshold, "GBP")}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription>Full audit trail of earnings, reversals, and payouts.</CardDescription>
        </CardHeader>
        <CardContent>
          {ledgerQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          ) : null}
          {!ledgerQuery.isLoading && !(ledgerQuery.data ?? []).length ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : null}
          <div className="space-y-2">
            {(ledgerQuery.data ?? []).map((entry) => {
              const typeLabel: Record<string, string> = {
                GIFT_EARNED: "🎁 Digital Gift",
                GIFT_REFUND_REVERSAL: "↩️ Gift Refund",
                CONTRIBUTION_EARNED: "💝 Wishlist Contribution",
                EVENT_REGISTRATION_EARNED: "🎟️ Event Registration",
                PAYOUT: "💸 Payout",
                ADJUSTMENT: "⚙️ Adjustment",
              };
              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-border bg-background/70 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{typeLabel[entry.type] ?? entry.type.replaceAll("_", " ")}</p>
                    {entry.source_description ? (
                      <p className="text-xs text-muted-foreground truncate">{entry.source_description}</p>
                    ) : null}
                    {entry.sender_name ? (
                      <p className="text-xs text-muted-foreground truncate">
                        From: {entry.sender_name}{entry.sender_email ? ` · ${entry.sender_email}` : ""}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={LEDGER_STATUS_VARIANT[entry.status] ?? "outline"}>{entry.status}</Badge>
                    <p className={`font-semibold tabular-nums ${Number(entry.amount) < 0 ? "text-destructive" : "text-emerald-600"}`}>
                      {Number(entry.amount) >= 0 ? "+" : ""}
                      {formatCurrency(entry.amount, entry.currency.toUpperCase())}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payments made by this user */}
      <Card>
        <CardHeader>
          <CardTitle>Payments made</CardTitle>
          <CardDescription>Gifts sent, wishlist contributions, and event registrations you have paid for.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistoryQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading payments...</p>
          ) : null}
          {!paymentHistoryQuery.isLoading && !(paymentHistoryQuery.data ?? []).length ? (
            <p className="text-sm text-muted-foreground">No payments made yet.</p>
          ) : null}
          <div className="space-y-2">
            {(paymentHistoryQuery.data ?? []).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-border bg-background/70 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{TYPE_LABEL[entry.type] ?? entry.type}</p>
                  <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">To: {entry.to}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-destructive">
                    -{formatCurrency(entry.amount, entry.currency)}
                  </p>
                  {entry.reference ? (
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">{entry.reference.slice(-12)}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
