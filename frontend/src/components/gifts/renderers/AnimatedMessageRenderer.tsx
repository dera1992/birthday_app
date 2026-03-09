import { OverlayText, RendererFrame, type OverlayConfig } from "@/components/gifts/renderers/RendererFrame";
import { previewText, type GiftPreviewMode } from "@/components/gifts/renderers/demoContent";
import { getPreviewDefaults, getRendererSurfaceClass } from "@/components/gifts/renderers/presentation";
import type { GiftProduct } from "@/features/gifts/types";

export function AnimatedMessageRenderer({
  product,
  customizationData = {},
  message = "",
  fromName = "",
  compact = false,
  previewMode = "live",
}: {
  product: GiftProduct;
  customizationData?: Record<string, unknown>;
  message?: string;
  fromName?: string;
  compact?: boolean;
  previewMode?: GiftPreviewMode;
}) {
  const previewDefaults = getPreviewDefaults(product);
  const note = previewText(customizationData.message ?? message, previewDefaults.message ?? "Wishing you joy and laughter", previewMode);
  const sender = previewText(customizationData.sender_name ?? customizationData.from_name ?? fromName, previewDefaults.sender_name ?? "From Alex", previewMode);
  const layout = product.layout_config ?? {};
  const glowColor = String(customizationData.theme_color ?? "#ffffff");

  return (
      <RendererFrame
      assetUrl={product.template_asset_url || product.preview_asset_url}
      fallbackGradient="linear-gradient(135deg, #7c3aed, #ec4899)"
      className={getRendererSurfaceClass(product, compact, "aspect-square min-h-0")}
    >
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_40%)]" />
      <OverlayText config={layout.message as OverlayConfig | undefined} className="font-display font-semibold">
        <span style={{ textShadow: `0 0 22px ${glowColor}` }}>{note}</span>
      </OverlayText>
      <OverlayText config={layout.sender as OverlayConfig | undefined}>
        {sender}
      </OverlayText>
    </RendererFrame>
  );
}
