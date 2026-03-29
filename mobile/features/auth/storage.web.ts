// Web implementation — uses localStorage instead of expo-secure-store
const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export async function saveTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  return localStorage.getItem(ACCESS_KEY);
}
