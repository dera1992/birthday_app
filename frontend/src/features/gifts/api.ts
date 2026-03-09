/**
 * Gift feature — API integration layer.
 *
 * Endpoint assumptions (adjust paths here if backend differs):
 *   GET  /gifts/products                                      — gift catalog
 *   GET  /birthday-profile/{slug}/gifts                       — received gifts for a profile
 *   POST /birthday-profile/{slug}/gifts/create-intent         — create PaymentIntent
 *   GET  /gifts/purchases/{id}/generation-status              — AI generation status
 *   POST /gifts/purchases/{id}/select-option                  — select AI design option
 *
 * Response shapes are defined in ./types.ts.
 */

import { apiRequest } from "@/lib/api/client";
import type {
  AIGenerationStatusResponse,
  CreateGiftIntentPayload,
  GiftIntentResponse,
  GiftProduct,
  GiftPurchase,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const API_ORIGIN = new URL(API_URL).origin;

function normalizeMediaUrl(value?: string | null): string {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return new URL(value, API_ORIGIN).toString();
}

function normalizeGiftProduct(product: GiftProduct): GiftProduct {
  return {
    ...product,
    catalog_preview_asset_url: normalizeMediaUrl(product.catalog_preview_asset_url),
    preview_asset_url: normalizeMediaUrl(product.preview_asset_url),
    template_asset_url: normalizeMediaUrl(product.template_asset_url),
    template: product.template
      ? {
          ...product.template,
          catalog_preview_asset_url: normalizeMediaUrl(product.template.catalog_preview_asset_url),
          preview_asset_url: normalizeMediaUrl(product.template.preview_asset_url),
          template_asset_url: normalizeMediaUrl(product.template.template_asset_url),
        }
      : null,
  };
}

function normalizeGiftPurchase(purchase: GiftPurchase): GiftPurchase {
  return {
    ...purchase,
    share_url: purchase.share_url,
    download_url: normalizeMediaUrl(purchase.download_url),
    selected_asset_url: normalizeMediaUrl(purchase.selected_asset_url),
    ai_download_url: normalizeMediaUrl(purchase.ai_download_url),
    effective_asset_url: normalizeMediaUrl(purchase.effective_asset_url),
    product: normalizeGiftProduct(purchase.product),
  };
}

// ── Catalog ──────────────────────────────────────────────────────────────────

export async function fetchGiftCatalog(category?: string): Promise<GiftProduct[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const products = await apiRequest<GiftProduct[]>(`/gifts/catalog${query}`, { auth: false });
  return products.map(normalizeGiftProduct);
}

// ── Profile gifts ─────────────────────────────────────────────────────────────

export async function fetchBirthdayGifts(slug: string): Promise<GiftPurchase[]> {
  const purchases = await apiRequest<GiftPurchase[]>(`/birthday-profile/${slug}/gifts`, { auth: false });
  return purchases.map(normalizeGiftPurchase);
}

export async function fetchGiftPurchase(purchaseId: number, token?: string): Promise<GiftPurchase> {
  const purchase = await apiRequest<GiftPurchase>(`/gifts/purchases/${purchaseId}`, {
    auth: !token,
    query: token ? { token } : undefined,
  });
  return normalizeGiftPurchase(purchase);
}

// ── Create intent ─────────────────────────────────────────────────────────────

export async function createGiftIntent(slug: string, payload: CreateGiftIntentPayload): Promise<GiftIntentResponse> {
  const response = await apiRequest<GiftIntentResponse>(`/birthday-profile/${slug}/gifts/create-intent`, {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
  return {
    ...response,
    purchase: normalizeGiftPurchase(response.purchase),
  };
}

// ── AI generation ─────────────────────────────────────────────────────────────

export async function fetchAIGenerationStatus(
  purchaseId: number,
  token?: string
): Promise<AIGenerationStatusResponse> {
  return apiRequest<AIGenerationStatusResponse>(`/gifts/purchases/${purchaseId}/generation-status`, {
    auth: !token,
    query: token ? { token } : undefined,
  });
}

export async function selectAIGiftOption(
  purchaseId: number,
  optionIndex: number,
  token?: string
): Promise<GiftPurchase> {
  const purchase = await apiRequest<GiftPurchase>(`/gifts/purchases/${purchaseId}/select-option`, {
    method: "POST",
    auth: !token,
    query: token ? { token } : undefined,
    body: JSON.stringify({ option_index: optionIndex }),
  });
  return normalizeGiftPurchase(purchase);
}
