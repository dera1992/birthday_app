import { useMutation, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { VenueRecommendation } from "@/lib/api/types";

export function useVenueRecommendations(params: { city?: string; category?: string }) {
  return useQuery({
    queryKey: ["venue-recommendations", params],
    queryFn: () =>
      apiRequest<VenueRecommendation[]>("/venues/recommendations", {
        auth: false,
        query: params,
      }),
    enabled: Boolean(params.city || params.category),
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
