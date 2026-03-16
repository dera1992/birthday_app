import type { Ref } from "react";
import { OverlayText, RendererFrame, type OverlayConfig } from "@/components/gifts/renderers/RendererFrame";
import { previewText, type GiftPreviewMode } from "@/components/gifts/renderers/demoContent";
import { getPreviewDefaults, getRendererSurfaceClass } from "@/components/gifts/renderers/presentation";
import type { GiftProduct } from "@/features/gifts/types";

// ── Theme colour map ──────────────────────────────────────────────────────────
const THEME_COLOR_MAP: Record<string, [string, string]> = {
  pink:   ["#ec4899", "#fb7185"],
  gold:   ["#d4af37", "#f59e0b"],
  blue:   ["#3b82f6", "#60a5fa"],
  purple: ["#8b5cf6", "#a78bfa"],
  mint:   ["#10b981", "#34d399"],
  coral:  ["#f97316", "#fb923c"],
};

// ── Card style → overlay pattern ─────────────────────────────────────────────
const CARD_STYLE_OVERLAY: Record<string, string> = {
  confetti:  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle fill='%23fff' fill-opacity='.18' cx='10' cy='10' r='4'/%3E%3Crect fill='%23fff' fill-opacity='.12' x='35' y='8' width='6' height='6' rx='1'/%3E%3Ccircle fill='%23fff' fill-opacity='.14' cx='50' cy='30' r='3'/%3E%3Crect fill='%23fff' fill-opacity='.10' x='5' y='38' width='5' height='5' rx='1'/%3E%3Ccircle fill='%23fff' fill-opacity='.16' cx='28' cy='50' r='4'/%3E%3C/g%3E%3C/svg%3E\")",
  balloons:  "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse fill='%23fff' fill-opacity='.12' cx='20' cy='20' rx='10' ry='13'/%3E%3Cellipse fill='%23fff' fill-opacity='.09' cx='60' cy='55' rx='9' ry='12'/%3E%3Cellipse fill='%23fff' fill-opacity='.11' cx='70' cy='15' rx='8' ry='11'/%3E%3C/svg%3E\")",
  stars:     "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon fill='%23fff' fill-opacity='.18' points='30,4 34,18 48,18 37,27 41,41 30,32 19,41 23,27 12,18 26,18'/%3E%3Cpolygon fill='%23fff' fill-opacity='.10' points='10,42 12,48 18,48 13,52 15,58 10,54 5,58 7,52 2,48 8,48' /%3E%3C/svg%3E\")",
  bokeh:     "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle fill='%23fff' fill-opacity='.07' cx='20' cy='20' r='20'/%3E%3Ccircle fill='%23fff' fill-opacity='.06' cx='75' cy='60' r='28'/%3E%3Ccircle fill='%23fff' fill-opacity='.05' cx='50' cy='90' r='18'/%3E%3C/svg%3E\")",
  geometric: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon fill='none' stroke='%23fff' stroke-opacity='.15' stroke-width='1.5' points='30,5 55,20 55,50 30,55 5,50 5,20'/%3E%3Cpolygon fill='none' stroke='%23fff' stroke-opacity='.10' stroke-width='1' points='30,15 47,25 47,45 30,50 13,45 13,25'/%3E%3C/svg%3E\")",
};

// ── Font style → Tailwind classes for text ────────────────────────────────────
const FONT_STYLE_CLASS: Record<string, string> = {
  bold:    "font-black tracking-tight",
  elegant: "font-light tracking-widest",
  playful: "font-bold tracking-wide",
  modern:  "font-semibold tracking-normal",
};

function resolveThemeColor(raw: unknown, fallback: string): [string, string] {
  const key = String(raw ?? "").toLowerCase();
  return THEME_COLOR_MAP[key] ?? [fallback, "#fb7185"];
}

export function CardRenderer({
  product,
  customizationData = {},
  message = "",
  fromName = "",
  compact = false,
  catalogCompact = false,
  previewMode = "live",
  frameRef,
}: {
  product: GiftProduct;
  customizationData?: Record<string, unknown>;
  message?: string;
  fromName?: string;
  compact?: boolean;
  catalogCompact?: boolean;
  previewMode?: GiftPreviewMode;
  frameRef?: Ref<HTMLDivElement>;
}) {
  const previewDefaults = getPreviewDefaults(product);
  const title = previewText(customizationData.recipient_name, previewDefaults.recipient_name ?? "Happy Birthday Emma", previewMode);
  const note = previewText(customizationData.message ?? message, previewDefaults.message ?? "Wishing you joy and laughter", previewMode);
  const sender = previewText(customizationData.sender_name ?? customizationData.from_name ?? fromName, previewDefaults.sender_name ?? "From Alex", previewMode);

  const [primaryColor, secondaryColor] = resolveThemeColor(
    customizationData.theme_color ?? customizationData.color_theme,
    product.default_config?.theme_color ?? "#ec4899"
  );
  const cardStyle = String(customizationData.card_style ?? "confetti");
  const fontStyle = String(customizationData.font_style ?? "bold");
  const fontClass = FONT_STYLE_CLASS[fontStyle] ?? FONT_STYLE_CLASS.bold;
  const patternOverlay = CARD_STYLE_OVERLAY[cardStyle] ?? CARD_STYLE_OVERLAY.confetti;
  const fallbackGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  const layout = product.layout_config ?? {};
  const hasTemplateAsset = Boolean(product.template_asset_url || product.preview_asset_url);
  const hasLayout = Boolean(layout.title || layout.message || layout.sender);
  // When a template image exists, apply colour as a tint overlay; otherwise bake it into the gradient
  const colorTint = hasTemplateAsset ? primaryColor : undefined;

  return (
    <RendererFrame
      ref={frameRef}
      assetUrl={product.template_asset_url || product.preview_asset_url}
      fallbackGradient={fallbackGradient}
      patternOverlay={patternOverlay}
      colorTint={colorTint}
      className={catalogCompact ? "min-h-[220px]" : getRendererSurfaceClass(product, compact, "aspect-square min-h-0")}
    >
      <div className="absolute inset-0 bg-black/10" />

      {hasTemplateAsset && hasLayout ? (
        // Use admin-defined layout_config positions when template asset exists
        <>
          <OverlayText config={layout.title as OverlayConfig | undefined} className={`font-display ${fontClass} w-[60%] text-center line-clamp-2`}>
            {title}
          </OverlayText>
          <OverlayText config={layout.message as OverlayConfig | undefined} className={`w-[68%] text-center leading-snug ${catalogCompact ? "line-clamp-2" : "line-clamp-4"}`}>
            {note}
          </OverlayText>
          <OverlayText config={layout.sender as OverlayConfig | undefined} className={`${fontClass} w-[60%] text-center line-clamp-1`}>
            {sender}
          </OverlayText>
        </>
      ) : catalogCompact ? (
        // Compact fallback — gradient card, centred layout with frosted bottom strip
        <>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 py-4 text-center">
            <p className={`w-full text-sm leading-snug text-white drop-shadow-md font-display ${fontClass} line-clamp-2`}>
              {title}
            </p>
            <p className="w-full text-[11px] leading-snug text-white/90 drop-shadow line-clamp-3 px-1">
              {note}
            </p>
          </div>
          {sender ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-4 py-2.5">
              <p className={`w-full text-center text-[10px] text-white/90 drop-shadow ${fontClass}`}>
                {sender}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        // Full fallback flex layout for gradient-only cards (no template asset)
        <div className="absolute inset-0 flex flex-col items-center justify-between px-5 py-6 text-center">
          <p className={`w-full text-xl leading-tight text-white drop-shadow-md font-display ${fontClass}`}>
            {title}
          </p>
          <p className="w-full flex-1 flex items-center justify-center text-sm leading-snug text-white/95 drop-shadow px-2 py-3 line-clamp-6">
            {note}
          </p>
          <p className={`w-full text-xs text-white/90 drop-shadow ${fontClass}`}>
            {sender}
          </p>
        </div>
      )}
    </RendererFrame>
  );
}
