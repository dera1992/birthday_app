"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getAccessToken, setTokens, clearTokens } from "@/lib/auth/tokens";
import { apiRequest } from "@/lib/api/client";
import { ApiError, type AuthTokens, type Me } from "@/lib/api/types";

type AuthContextValue = {
  token: string | null;
  user: Me | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isLoading: boolean;
  isReady: boolean;
  login: (tokens: AuthTokens, redirectTo?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setToken(getAccessToken());
    setIsReady(true);
  }, []);

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => apiRequest<Me>("/me"),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.error instanceof ApiError && meQuery.error.status === 401) {
      clearTokens();
      setToken(null);
    }
  }, [meQuery.error]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: meQuery.data ?? null,
      isAuthenticated: Boolean(token),
      isEmailVerified: Boolean(meQuery.data?.verification?.email_verified_at),
      isPhoneVerified: Boolean(meQuery.data?.verification?.phone_verified_at),
      isLoading: !isReady || (token !== null && meQuery.isLoading),
      isReady,
      login: (tokens, redirectTo) => {
        setTokens(tokens);
        setToken(tokens.access);
        router.push(redirectTo ?? "/verify");
        router.refresh();
      },
      logout: () => {
        clearTokens();
        setToken(null);
        router.push("/login");
        router.refresh();
      },
    }),
    [isReady, meQuery.data, meQuery.isLoading, router, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
