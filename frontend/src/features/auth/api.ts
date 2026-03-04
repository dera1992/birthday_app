import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { AuthTokens, Me } from "@/lib/api/types";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiRequest<AuthTokens>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: { first_name: string; last_name: string; email: string; password: string }) =>
      apiRequest<Me>("/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiRequest<Me>("/me"),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { first_name?: string; last_name?: string; phone_number?: string }) =>
      apiRequest<Me>("/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useForgotPasswordRequest() {
  return useMutation({
    mutationFn: (payload: { email: string }) =>
      apiRequest<{ detail: string; uid?: string; token?: string }>("/auth/forgot-password/request", {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
  });
}

export function useForgotPasswordConfirm() {
  return useMutation({
    mutationFn: (payload: { uid: string; token: string; new_password: string }) =>
      apiRequest<{ detail: string }>("/auth/forgot-password/confirm", {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      apiRequest<{ detail: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: () =>
      apiRequest<{ detail: string; verification_url?: string }>("/auth/verify-email", { method: "POST" }),
  });
}

export function useConfirmEmailVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { uid: string; token: string }) =>
      apiRequest<{ detail: string; email: string }>("/auth/verify-email/confirm", {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (payload: { phone_number: string }) =>
      apiRequest<{ detail: string; dev_code?: string | null }>("/auth/request-otp", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
      }),
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { phone_number?: string; code: string }) =>
      apiRequest<{ detail: string }>("/auth/verify-otp", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
