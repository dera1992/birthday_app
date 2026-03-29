import { apiClient } from "@/lib/api/client";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  birthday_profile_slug: string | null;
  birthday_profile_completed: boolean;
  verification: {
    email_verified_at: string | null;
    phone_verified_at: string | null;
    phone_number: string;
    risk_flags: string[];
  } | null;
}

export async function register(payload: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/login", { email, password });
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/me");
  return data;
}
