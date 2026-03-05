import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { CuratedPack, GroupedVenueRecommendation } from "@/lib/api/types";

export function usePacks() {
  return useQuery({
    queryKey: ["packs"],
    queryFn: () => apiRequest<CuratedPack[]>("/packs", { auth: false }),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePack(slug: string) {
  return useQuery({
    queryKey: ["pack", slug],
    queryFn: () => apiRequest<CuratedPack>(`/packs/${slug}`, { auth: false }),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 10,
  });
}

export function useEventVenueRecommendations(
  eventId: number | undefined,
  userCoords?: { lat: number; lng: number } | null,
) {
  return useQuery({
    queryKey: ["event-venue-recommendations", eventId, userCoords],
    queryFn: () =>
      apiRequest<GroupedVenueRecommendation[]>(`/events/${eventId}/venue-recommendations`, {
        auth: false,
        query: userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : undefined,
      }),
    enabled: Boolean(eventId),
  });
}
