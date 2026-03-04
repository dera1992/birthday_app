"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { VenuePartnerAdmin } from "@/lib/api/types";

type VenueFilters = {
  city?: string;
  category?: string;
  is_active?: string;
  is_sponsored?: string;
  search?: string;
};

export function useAdminVenues(filters: VenueFilters = {}) {
  return useQuery({
    queryKey: ["admin-venues", filters],
    queryFn: () =>
      apiRequest<VenuePartnerAdmin[]>("/venues/admin", {
        query: Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
      }),
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<VenuePartnerAdmin, "id">) =>
      apiRequest<VenuePartnerAdmin>("/venues/admin", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-venues"] }),
  });
}

export function useUpdateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<VenuePartnerAdmin> & { id: number }) =>
      apiRequest<VenuePartnerAdmin>(`/venues/admin/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-venues"] }),
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/venues/admin/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-venues"] }),
  });
}
