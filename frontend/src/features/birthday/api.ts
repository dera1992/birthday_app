import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type {
  BirthdayMessage,
  BirthdayProfile,
  BirthdayWishlistItem,
  BirthdayWishlistReservation,
  SupportContribution,
  SupportContributionIntentResponse,
} from "@/lib/api/types";

export function useBirthdayProfile(slug: string) {
  return useQuery({
    queryKey: ["birthday-profile", slug],
    queryFn: () => apiRequest<BirthdayProfile>(`/birthday-profile/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useCreateBirthdayProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<BirthdayProfile>("/birthday-profile", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useUpdateBirthdayProfile(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<BirthdayProfile>(`/birthday-profile/${slug}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday-profile", slug] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useUploadProfileImage(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("profile_image", file);
      return apiRequest<BirthdayProfile>(`/birthday-profile/${slug}`, {
        method: "PATCH",
        body: form,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday-profile", slug] });
    },
  });
}

export function useWishlistCreate(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<BirthdayWishlistItem>(`/birthday-profile/${slug}/wishlist-items`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["birthday-profile", slug] }),
  });
}

export function useWishlistUpdate(itemId: number, slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<BirthdayWishlistItem>(`/wishlist-items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["birthday-profile", slug] }),
  });
}

export function useWishlistReserve(itemId: number, slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<BirthdayWishlistReservation | { detail: string }>(`/wishlist-items/${itemId}/reserve`, {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["birthday-profile", slug] }),
  });
}

export function useWishlistCancel(itemId: number, slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<{ detail: string }>(`/wishlist-items/${itemId}/reserve`, {
        method: "POST",
        body: JSON.stringify({ action: "cancel" }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["birthday-profile", slug] }),
  });
}

export function useBirthdayMessages(slug: string) {
  return useQuery({
    queryKey: ["birthday-messages", slug],
    queryFn: () => apiRequest<BirthdayMessage[]>(`/birthday-profile/${slug}/messages`),
    enabled: Boolean(slug),
  });
}

export function useSupportMessageCreate(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<BirthdayMessage>(`/birthday-profile/${slug}/messages`, {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["birthday-messages", slug] }),
  });
}

export function useSupportMessageApprove(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) =>
      apiRequest<BirthdayMessage>(`/support-messages/${messageId}/approve`, {
        method: "POST",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["birthday-messages", slug] }),
  });
}

export function useSupportMessageReject(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) =>
      apiRequest<BirthdayMessage>(`/support-messages/${messageId}/reject`, {
        method: "POST",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["birthday-messages", slug] }),
  });
}

export function useBirthdayContributions(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ["birthday-contributions", slug],
    queryFn: () => apiRequest<SupportContribution[]>(`/birthday-profile/${slug}/contributions`),
    enabled: Boolean(slug) && enabled,
  });
}

export function useSupportContributionIntent(slug: string) {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<SupportContributionIntentResponse>(`/birthday-profile/${slug}/contributions/create-intent`, {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
  });
}
