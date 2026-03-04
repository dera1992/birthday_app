import { useQuery } from "@tanstack/react-query";
import { fetchBirthdayGifts, fetchGiftCatalog } from "./api";
import type { GiftCategory } from "./types";

export function useGiftCatalog(category?: GiftCategory) {
  return useQuery({
    queryKey: ["gift-products", category ?? "ALL"],
    queryFn: async () => {
      const products = await fetchGiftCatalog();
      return category ? products.filter((p) => p.category === category) : products;
    },
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
