import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { ConnectStatusResponse } from "@/lib/api/types";

export function useConnectStatus(enabled = true) {
  return useQuery({
    queryKey: ["connect-status"],
    queryFn: () => apiRequest<ConnectStatusResponse>("/connect/status"),
    enabled,
  });
}

export function useConnectOnboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<{ onboarding_url: string; connect_account: ConnectStatusResponse["connect_account"] }>("/connect/onboard", {
        method: "POST",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connect-status"] }),
  });
}

export function useConnectDashboard() {
  return useMutation({
    mutationFn: () => apiRequest<{ url: string }>("/connect/dashboard", { method: "POST" }),
  });
}
