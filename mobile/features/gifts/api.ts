import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { CreateGiftIntentPayload, GiftIntentResponse, GiftProduct, GiftPurchase } from "./types";

export function useGiftCatalog(category?: string) {
  return useQuery({
    queryKey: ["gifts", "catalog", category],
    queryFn: async () => {
      const { data } = await apiClient.get<GiftProduct[]>("/gifts/catalog", {
        params: category ? { category } : undefined,
      });
      return data;
    },
  });
}

export function useBirthdayGifts(slug: string) {
  return useQuery({
    queryKey: ["gifts", "received", slug],
    queryFn: async () => {
      const { data } = await apiClient.get<GiftPurchase[]>(`/birthday-profile/${slug}/gifts`);
      return Array.isArray(data) ? data : (data as any).results ?? [];
    },
    enabled: !!slug,
  });
}

export function useCreateGiftIntent(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateGiftIntentPayload) => {
      const { data } = await apiClient.post<GiftIntentResponse>(
        `/birthday-profile/${slug}/gifts/create-intent`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts", "received", slug] });
    },
  });
}
