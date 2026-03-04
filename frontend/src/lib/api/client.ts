import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/tokens";
import { ApiError } from "@/lib/api/types";

type RequestOptions = RequestInit & {
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
let refreshPromise: Promise<string | null> | null = null;

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback;

  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    const first = payload.find((item) => typeof item === "string");
    return typeof first === "string" ? first : fallback;
  }

  if (typeof payload === "object") {
    if ("detail" in payload && typeof payload.detail === "string") {
      return payload.detail;
    }

    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === "string") {
          return key === "non_field_errors" ? first : `${key}: ${first}`;
        }
      }
      if (typeof value === "string") {
        return key === "non_field_errors" ? value : `${key}: ${value}`;
      }
    }
  }

  return fallback;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  refreshPromise = (async () => {
    const response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const payload = (await response.json().catch(() => null)) as { access?: string } | null;
    if (!payload?.access) {
      clearTokens();
      return null;
    }

    setTokens({ access: payload.access });
    return payload.access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function sendRequest(url: string, options: RequestOptions = {}, tokenOverride?: string | null) {
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = tokenOverride ?? getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  try {
    return await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? `Unable to reach the API at ${url}. Check that the backend is running, CORS is enabled, and NEXT_PUBLIC_API_URL is correct.`
        : "Unable to reach the API.";
    throw new ApiError(message, 0);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);
  let response = await sendRequest(url, options);

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text();

  const isAuthRequest = options.auth !== false;
  const canRefresh = isAuthRequest && !url.endsWith("/auth/refresh");
  const tokenExpired =
    response.status === 401 &&
    payload &&
    typeof payload === "object" &&
    "code" in payload &&
    payload.code === "token_not_valid";

  if (canRefresh && tokenExpired) {
    const refreshedAccessToken = await refreshAccessToken();
    if (refreshedAccessToken) {
      response = await sendRequest(url, options, refreshedAccessToken);
      const retryContentType = response.headers.get("content-type") ?? "";
      const retryPayload = retryContentType.includes("application/json") ? await response.json().catch(() => null) : await response.text();

      if (!response.ok) {
        const detail = extractErrorMessage(retryPayload, `Request failed with status ${response.status}`);
        throw new ApiError(detail, response.status, retryPayload as string | Record<string, unknown>);
      }

      return retryPayload as T;
    }
  }

  if (!response.ok) {
    const detail = extractErrorMessage(payload, `Request failed with status ${response.status}`);
    throw new ApiError(detail, response.status, payload as string | Record<string, unknown>);
  }

  return payload as T;
}
