import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { toast } from "sonner-native";
import { ArrowUpRight, Clock, TrendingUp } from "lucide-react-native";

import { useWallet, useWalletLedger, useWithdraw, type LedgerEntry } from "@/features/wallet/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getErrorMessage } from "@/lib/api/client";

function formatCurrency(amount: string | number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(amount));
}

function ledgerStatusVariant(status: LedgerEntry["status"]): "warning" | "success" | "default" {
  if (status === "PENDING") return "warning";
  if (status === "AVAILABLE") return "success";
  return "default";
}

function ledgerLabel(type: string) {
  const map: Record<string, string> = {
    GIFT_EARNED: "Gift received",
    CONTRIBUTION_EARNED: "Wishlist contribution",
    EVENT_REGISTRATION_EARNED: "Event ticket sale",
    PAYOUT: "Withdrawal",
    ADJUSTMENT: "Adjustment",
    GIFT_REFUND_REVERSAL: "Refund reversal",
  };
  return map[type] ?? type;
}

export default function WalletScreen() {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: ledger, isLoading: ledgerLoading } = useWalletLedger();
  const withdraw = useWithdraw();
  const [amount, setAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);

  async function handleWithdraw() {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      await withdraw.mutateAsync(amount);
      toast.success("Withdrawal initiated successfully.");
      setAmount("");
      setShowWithdraw(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Withdrawal failed."));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="py-5">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Wallet</Text>
          <Text className="mt-0.5 text-sm text-slate-500">Your earnings and payouts</Text>
        </View>

        {walletLoading ? (
          <ActivityIndicator color="#e11d48" />
        ) : wallet ? (
          <>
            {/* Balance cards */}
            <View className="flex-row gap-3">
              <Card className="flex-1 bg-rose-600">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <TrendingUp size={18} color="#fff" />
                </View>
                <Text className="mt-3 text-sm text-rose-200">Available</Text>
                <Text className="mt-0.5 text-2xl font-bold text-white">
                  {formatCurrency(wallet.available_balance)}
                </Text>
              </Card>
              <Card className="flex-1">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Clock size={18} color="#d97706" />
                </View>
                <Text className="mt-3 text-sm text-slate-500">Pending</Text>
                <Text className="mt-0.5 text-2xl font-bold text-slate-800 dark:text-white">
                  {formatCurrency(wallet.pending_balance)}
                </Text>
              </Card>
            </View>

            {/* Withdraw */}
            <View className="mt-4">
              {showWithdraw ? (
                <Card>
                  <Text className="mb-3 font-semibold text-slate-800 dark:text-white">Withdraw funds</Text>
                  <Input
                    label="Amount (GBP)"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                  />
                  <View className="mt-4 flex-row gap-3">
                    <Button
                      label="Cancel"
                      variant="outline"
                      className="flex-1"
                      onPress={() => setShowWithdraw(false)}
                    />
                    <Button
                      label="Withdraw"
                      className="flex-1"
                      loading={withdraw.isPending}
                      onPress={handleWithdraw}
                    />
                  </View>
                </Card>
              ) : (
                <Button
                  label="Withdraw funds"
                  variant="outline"
                  onPress={() => setShowWithdraw(true)}
                />
              )}
            </View>

            {/* Ledger */}
            <Text className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Transaction history
            </Text>
            {ledgerLoading ? (
              <ActivityIndicator color="#e11d48" />
            ) : (ledger ?? []).length === 0 ? (
              <Text className="text-center text-sm text-slate-400 py-8">No transactions yet.</Text>
            ) : (
              <View className="gap-3">
                {(ledger ?? []).map((entry) => (
                  <View
                    key={entry.id}
                    className="flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
                      <ArrowUpRight size={18} color="#e11d48" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-800 dark:text-white">
                        {ledgerLabel(entry.type)}
                      </Text>
                      {entry.sender_name ? (
                        <Text className="text-xs text-slate-400">From {entry.sender_name}</Text>
                      ) : null}
                      <Text className="text-xs text-slate-400">
                        {new Date(entry.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className={`font-bold ${Number(entry.amount) < 0 ? "text-slate-500" : "text-emerald-600"}`}>
                        {Number(entry.amount) < 0 ? "-" : "+"}
                        {formatCurrency(Math.abs(Number(entry.amount)))}
                      </Text>
                      <Badge label={entry.status} variant={ledgerStatusVariant(entry.status)} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text className="text-center text-slate-400">Wallet not found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
