/**
 * Gift feature — API integration layer.
 *
 * Endpoint assumptions (adjust paths here if backend differs):
 *   GET  /gifts/products                                — gift catalog
 *   GET  /birthday-profile/{slug}/gifts                 — received gifts for a profile
 *   POST /birthday-profile/{slug}/gifts/create-intent   — create PaymentIntent
 *
 * Response shapes are defined in ./types.ts.
 */

import { apiRequest } from "@/lib/api/client";
import type { CreateGiftIntentPayload, GiftIntentResponse, GiftProduct, GiftPurchase } from "./types";

// ── Catalog ──────────────────────────────────────────────────────────────────

export async function fetchGiftCatalog(): Promise<GiftProduct[]> {
  return apiRequest<GiftProduct[]>("/gifts/products", { auth: false });
}

// ── Profile gifts ─────────────────────────────────────────────────────────────

export async function fetchBirthdayGifts(slug: string): Promise<GiftPurchase[]> {
  return apiRequest<GiftPurchase[]>(`/birthday-profile/${slug}/gifts`, { auth: false });
}

// ── Create intent ─────────────────────────────────────────────────────────────

export async function createGiftIntent(slug: string, payload: CreateGiftIntentPayload): Promise<GiftIntentResponse> {
  return apiRequest<GiftIntentResponse>(`/birthday-profile/${slug}/gifts/create-intent`, {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}
