import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { WalletAccount, WalletLedgerEntry, WithdrawResponse } from "@/lib/api/types";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiRequest<WalletAccount>("/wallet"),
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Pick<WalletAccount, "payout_mode" | "auto_payout_frequency" | "auto_payout_min_threshold">>) =>
      apiRequest<WalletAccount>("/wallet", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallet"] }),
  });
}

export function useWalletLedger() {
  return useQuery({
    queryKey: ["wallet-ledger"],
    queryFn: () => apiRequest<WalletLedgerEntry[]>("/wallet/ledger"),
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: string) =>
      apiRequest<WithdrawResponse>("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-ledger"] });
    },
  });
}
