import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { EventApplication, EventInvite, EventRecord, PaymentIntentResponse } from "@/lib/api/types";

export function publishEventRequest(eventId: number) {
  return apiRequest<EventRecord>(`/events/${eventId}/publish`, { method: "POST" });
}

export function useMyEvents() {
  return useQuery({
    queryKey: ["my-events"],
    queryFn: () => apiRequest<EventRecord[]>("/events"),
  });
}

export function useMyAppliedEvents() {
  return useQuery({
    queryKey: ["my-applied-events"],
    queryFn: () => apiRequest<EventRecord[]>("/events/applied"),
  });
}

export function useEventFeed(filters: { lat?: number; lng?: number; radius?: number; category?: string; q?: string }) {
  return useQuery({
    queryKey: ["event-feed", filters],
    queryFn: () =>
      apiRequest<EventRecord[]>("/events/feed", {
        auth: false,
        query: {
          lat: filters.lat,
          lng: filters.lng,
          radius: filters.radius ?? 5000,
          category: filters.category,
          q: filters.q,
        },
      }),
    enabled: filters.lat !== undefined && filters.lng !== undefined,
  });
}

export function useEvent(eventId: number) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiRequest<EventRecord>(`/events/${eventId}`),
    enabled: Boolean(eventId),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<EventRecord>("/events", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
  });
}

export function useUpdateEvent(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<EventRecord>(`/events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
  });
}

export function useApplyToEvent(eventId: number) {
  return useMutation({
    mutationFn: (payload: { intro_message: string; invite_code?: string }) =>
      apiRequest<EventApplication>(`/events/${eventId}/apply`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useApplications(eventId: number) {
  return useQuery({
    queryKey: ["event-applications", eventId],
    queryFn: () => apiRequest<EventApplication[]>(`/events/${eventId}/applications`),
    enabled: Boolean(eventId),
  });
}

export function useEventInvites(eventId: number, enabled = true) {
  return useQuery({
    queryKey: ["event-invites", eventId],
    queryFn: () => apiRequest<EventInvite[]>(`/events/${eventId}/invites`),
    enabled: Boolean(eventId) && enabled,
  });
}

export function useCreateEventInvite(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { max_uses?: number; expires_at?: string | null }) =>
      apiRequest<EventInvite>(`/events/${eventId}/invites`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-invites", eventId] });
    },
  });
}

export function useApprove(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appId: number) => apiRequest<EventApplication>(`/events/${eventId}/applications/${appId}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-applications", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useDecline(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appId: number) => apiRequest<EventApplication>(`/events/${eventId}/applications/${appId}/decline`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-applications", eventId] });
    },
  });
}

export function usePublishEvent(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishEventRequest(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    },
  });
}

export function useToggleExpand(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<EventRecord>(`/events/${eventId}/toggle-expand`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });
}

export function useConfirmVenue(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { venue_name: string }) =>
      apiRequest<EventRecord>(`/events/${eventId}/venue/confirm`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });
}

export function useLock(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<EventRecord>(`/events/${eventId}/lock`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });
}

export function useCancelEvent(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<EventRecord>(`/events/${eventId}/cancel`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });
}

export function useCompleteEvent(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<EventRecord>(`/events/${eventId}/complete`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });
}

export function useCreateEventPaymentIntent(eventId: number) {
  return useMutation({
    mutationFn: () =>
      apiRequest<PaymentIntentResponse>(`/events/${eventId}/payment/create-intent`, {
        method: "POST",
      }),
  });
}

export function useRequestRefund(eventId: number) {
  return useMutation({
    mutationFn: () =>
      apiRequest<{ detail: string; status: string }>(`/events/${eventId}/payment/request-refund`, {
        method: "POST",
      }),
  });
}
