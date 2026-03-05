import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { VenueRecommendation } from "@/lib/api/types";

export function useVenueRecommendations(params: { city?: string; category?: string; q?: string }) {
  return useQuery({
    queryKey: ["venue-recommendations", params],
    queryFn: () =>
      apiRequest<VenueRecommendation[]>("/venues/recommendations", {
        auth: false,
        query: params,
      }),
  });
}

export function useVenueClick() {
  return useMutation({
    mutationFn: (venueId: number) =>
      apiRequest<{ redirect_url: string }>(`/venues/${venueId}/click`, {
        method: "POST",
        auth: false,
      }),
  });
}

export function useRateVenue(eventId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ venueId, score, review }: { venueId: number; score: number; review?: string }) =>
      apiRequest<{ avg_rating: number | null; rating_count: number; my_score: number }>(
        `/venues/${venueId}/rate`,
        { method: "POST", body: JSON.stringify({ score, review: review ?? "" }) },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-venue-recommendations", eventId] });
    },
  });
}
