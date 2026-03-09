export type GiftPreviewMode = "demo" | "live";

export function previewText(value: unknown, fallback: string, mode: GiftPreviewMode) {
  const normalized = typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  if (normalized) {
    return normalized;
  }
  return mode === "demo" ? fallback : "";
}
