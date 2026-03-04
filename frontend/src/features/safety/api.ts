import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";

export function useCreateBlock() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/blocks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
