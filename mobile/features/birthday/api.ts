import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface BirthdayProfile {
  id: number;
  slug: string;
  full_name: string;
  date_of_birth: string;
  bio: string;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  is_public: boolean;
  days_until_birthday: number;
  age_on_next_birthday: number;
  is_birthday_today: boolean;
}

export interface WishlistItem {
  id: number;
  title: string;
  description: string;
  price: string | null;
  currency: string;
  url: string;
  image_url: string | null;
  is_reserved: boolean;
}

export interface BirthdayMessage {
  id: number;
  author_name: string;
  content: string;
  reaction: string | null;
  created_at: string;
  is_approved: boolean;
  replies: { id: number; author_name: string; content: string; created_at: string }[];
}

export function useBirthdayProfile(slug: string) {
  return useQuery({
    queryKey: ["birthday", slug],
    queryFn: async () => {
      const { data } = await apiClient.get<BirthdayProfile>(`/birthday-profile/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}

export function usePublicWishlist(slug: string) {
  return useQuery({
    queryKey: ["birthday", slug, "wishlist"],
    queryFn: async () => {
      const { data } = await apiClient.get<WishlistItem[]>(`/birthday-profile/${slug}/public-wishlist`);
      return Array.isArray(data) ? data : (data as any).results ?? [];
    },
    enabled: !!slug,
  });
}

export function useBirthdayMessages(slug: string) {
  return useQuery({
    queryKey: ["birthday", slug, "messages"],
    queryFn: async () => {
      const { data } = await apiClient.get<BirthdayMessage[]>(`/birthday-profile/${slug}/messages`);
      return Array.isArray(data) ? data : (data as any).results ?? [];
    },
    enabled: !!slug,
  });
}

export function usePostMessage(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { author_name: string; content: string }) => {
      const { data } = await apiClient.post(`/birthday-profile/${slug}/messages`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday", slug, "messages"] });
    },
  });
}

export function useCreateBirthdayProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { date_of_birth: string; bio?: string; is_public?: boolean }) => {
      const { data } = await apiClient.post<BirthdayProfile>("/birthday-profile", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday"] });
    },
  });
}

export function useUpdateBirthdayProfile(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<{ bio: string; is_public: boolean; date_of_birth: string }>) => {
      const { data } = await apiClient.patch<BirthdayProfile>(`/birthday-profile/${slug}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday", slug] });
    },
  });
}
