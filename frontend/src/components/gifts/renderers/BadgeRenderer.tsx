import type { Ref } from "react";
import { OverlayText, RendererFrame, type OverlayConfig } from "@/components/gifts/renderers/RendererFrame";
import { previewText, type GiftPreviewMode } from "@/components/gifts/renderers/demoContent";
import { getPreviewDefaults, getRendererSurfaceClass } from "@/components/gifts/renderers/presentation";
import type { GiftProduct } from "@/features/gifts/types";

// ── Badge colour → gradient [primary, secondary] ─────────────────────────────
const BADGE_COLOR_MAP: Record<string, [string, string]> = {
  "rose-gold":     ["#c9748a", "#e8b4b8"],
  "hot-pink":      ["#ec4899", "#f472b6"],
  "champagne":     ["#d4af37", "#f0d080"],
  "royal-purple":  ["#7c3aed", "#a78bfa"],
  "pearl-white":   ["#9ca3af", "#e5e7eb"],
  "midnight-glam": ["#1e1b4b", "#6d28d9"],
  // king colours
  "black-gold":    ["#1c1917", "#d4af37"],
  "navy-gold":     ["#1e3a5f", "#d4af37"],
  "emerald-gold":  ["#065f46", "#d4af37"],
  "burgundy-gold": ["#7f1d1d", "#d4af37"],
  "slate-silver":  ["#334155", "#94a3b8"],
  "obsidian":      ["#0c0a09", "#44403c"],
  // generic color_theme fallback (Legend of the Day badge)
  "gold":          ["#d4af37", "#f59e0b"],
  "silver":        ["#6b7280", "#d1d5db"],
  "bronze":        ["#92400e", "#d97706"],
  "platinum":      ["#94a3b8", "#e2e8f0"],
};

// ── Crown/badge style → crown emoji ──────────────────────────────────────────
const CROWN_STYLE_EMOJI: Record<string, string> = {
  "diamond-tiara":  "💎",
  "imperial-crown": "👑",
  "floral-wreath":  "🌸",
  "minimalist-arc": "✨",
  "vintage-deco":   "🌟",
  "medieval-crown": "👑",
  "crown-jewels":   "💍",
  "bold-spikes":    "⚡",
  "viking-horns":   "🔱",
  // badge_style values (Legend of the Day)
  "gold-shield":    "🏅",
  "diamond-crest":  "💠",
  "royal-seal":     "🎖️",
  "star-burst":     "⭐",
  "laurel-wreath":  "🏆",
};

function resolveBadgeColor(raw: unknown, fallback: [string, string]): [string, string] {
  const key = String(raw ?? "").toLowerCase();
  return BADGE_COLOR_MAP[key] ?? fallback;
}

export function BadgeRenderer({
  product,
  customizationData = {},
  message = "",
  compact = false,
  previewMode = "live",
  frameRef,
}: {
  product: GiftProduct;
  customizationData?: Record<string, unknown>;
  message?: string;
  compact?: boolean;
  previewMode?: GiftPreviewMode;
  frameRef?: Ref<HTMLDivElement>;
}) {
  const previewDefaults = getPreviewDefaults(product);
  const title = previewText(customizationData.recipient_name, previewDefaults.recipient_name ?? "Happy Birthday Emma", previewMode);
  const caption = previewText(customizationData.message ?? message, previewDefaults.message ?? "Wishing you joy and laughter", previewMode);
  const layout = product.layout_config ?? {};

  // Resolve badge colour from either field name used across badge products
  const [primaryColor, secondaryColor] = resolveBadgeColor(
    customizationData.badge_color ?? customizationData.color_theme,
    ["#f59e0b", "#fb7185"]
  );
  const fallbackGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  // Resolve crown/badge style emoji
  const styleKey = String(customizationData.crown_style ?? customizationData.badge_style ?? "").toLowerCase();
  const crownEmoji = CROWN_STYLE_EMOJI[styleKey] ?? null;

  const hasTemplateAsset = Boolean(product.template_asset_url || product.preview_asset_url);
  const colorTint = hasTemplateAsset ? primaryColor : undefined;

  return (
    <RendererFrame
      ref={frameRef}
      assetUrl={product.template_asset_url || product.preview_asset_url}
      fallbackGradient={fallbackGradient}
      colorTint={colorTint}
      className={getRendererSurfaceClass(product, compact, "aspect-square min-h-0")}
    >
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_35%)]" />
      {/* Crown/badge style indicator */}
      {crownEmoji ? (
        <div className="absolute right-3 top-3 z-20 text-2xl drop-shadow-lg" aria-hidden>
          {crownEmoji}
        </div>
      ) : null}
      <OverlayText config={layout.title as OverlayConfig | undefined} className="font-display font-bold uppercase tracking-[0.12em]">
        {title}
      </OverlayText>
      <OverlayText config={layout.message as OverlayConfig | undefined} className="font-semibold">
        {caption}
      </OverlayText>
    </RendererFrame>
  );
}
