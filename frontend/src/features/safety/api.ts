import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";

export function useCreateBlock() {
  return useMutation({
    mutationFn: (payload: { blocked: number }) =>
      apiRequest<Record<string, unknown>>("/blocks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (payload: { reported_user?: number; event?: number; reason: string; details?: string }) =>
      apiRequest<Record<string, unknown>>("/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useCreateEventRating() {
  return useMutation({
    mutationFn: ({ eventId, ...payload }: { eventId: number; rating: number; review?: string }) =>
      apiRequest<Record<string, unknown>>(`/events/${eventId}/ratings`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
