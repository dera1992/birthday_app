import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface WalletAccount {
  pending_balance: string;
  available_balance: string;
  payout_mode: "MANUAL" | "AUTO";
  updated_at: string;
}

export interface LedgerEntry {
  id: number;
  type: string;
  amount: string;
  currency: string;
  status: "PENDING" | "AVAILABLE" | "SETTLED";
  sender_name: string | null;
  sender_email: string | null;
  created_at: string;
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data } = await apiClient.get<WalletAccount>("/wallet");
      return data;
    },
  });
}

export function useWalletLedger() {
  return useQuery({
    queryKey: ["wallet", "ledger"],
    queryFn: async () => {
      const { data } = await apiClient.get<LedgerEntry[] | { results: LedgerEntry[] }>("/wallet/ledger");
      return Array.isArray(data) ? data : data.results ?? [];
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: string) => {
      const { data } = await apiClient.post("/wallet/withdraw", { amount });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { payout_mode: "MANUAL" | "AUTO" }) => {
      const { data } = await apiClient.patch<WalletAccount>("/wallet", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
