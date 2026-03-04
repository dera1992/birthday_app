import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGiftIntent } from "./api";
import type { CreateGiftIntentPayload } from "./types";

export function useCreateGiftIntent(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGiftIntentPayload) => createGiftIntent(slug, payload),
    onSuccess: () => {
      // Refresh the received gifts wall after a successful purchase
      queryClient.invalidateQueries({ queryKey: ["birthday-gifts", slug] });
    },
  });
}
