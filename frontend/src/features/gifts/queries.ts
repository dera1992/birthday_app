import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAIGenerationStatus, fetchBirthdayGifts, fetchGiftCatalog, fetchGiftPurchase, selectAIGiftOption } from "./api";
import type { GiftCategory } from "./types";

export function useGiftCatalog(category?: GiftCategory) {
  return useQuery({
    queryKey: ["gift-products", category ?? "ALL"],
    queryFn: () => fetchGiftCatalog(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBirthdayGifts(slug: string) {
  return useQuery({
    queryKey: ["birthday-gifts", slug],
    queryFn: () => fetchBirthdayGifts(slug),
    enabled: Boolean(slug),
  });
}

export function useGiftPurchase(purchaseId?: number, token?: string) {
  return useQuery({
    queryKey: ["gift-purchase", purchaseId ?? null, token ?? ""],
    queryFn: () => fetchGiftPurchase(purchaseId as number, token),
    enabled: Boolean(purchaseId),
  });
}

/** Poll AI generation status. Refetches every 3s while status is PENDING or PROCESSING. */
export function useAIGenerationStatus(purchaseId?: number, token?: string) {
  return useQuery({
    queryKey: ["ai-generation-status", purchaseId ?? null, token ?? ""],
    queryFn: () => fetchAIGenerationStatus(purchaseId as number, token),
    enabled: Boolean(purchaseId),
    refetchInterval: (query) => {
      const status = query.state.data?.generation_status;
      if (status === "PENDING" || status === "PROCESSING") return 3000;
      return false;
    },
  });
}

export function useSelectAIGiftOption(purchaseId: number, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (optionIndex: number) => selectAIGiftOption(purchaseId, optionIndex, token),
    onSuccess: (updatedPurchase) => {
      // Invalidate related queries so gift wall and status are refreshed
      queryClient.invalidateQueries({ queryKey: ["ai-generation-status", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["gift-purchase", purchaseId] });
      if (updatedPurchase.product) {
        queryClient.invalidateQueries({ queryKey: ["birthday-gifts"] });
      }
    },
  });
}
