import { OverlayText, RendererFrame, type OverlayConfig } from "@/components/gifts/renderers/RendererFrame";
import { previewText, type GiftPreviewMode } from "@/components/gifts/renderers/demoContent";
import { getPreviewDefaults, getRendererSurfaceClass } from "@/components/gifts/renderers/presentation";
import type { GiftProduct } from "@/features/gifts/types";

export function BadgeRenderer({
  product,
  customizationData = {},
  message = "",
  compact = false,
  previewMode = "live",
}: {
  product: GiftProduct;
  customizationData?: Record<string, unknown>;
  message?: string;
  compact?: boolean;
  previewMode?: GiftPreviewMode;
}) {
  const previewDefaults = getPreviewDefaults(product);
  const title = previewText(customizationData.recipient_name, previewDefaults.recipient_name ?? "Happy Birthday Emma", previewMode);
  const caption = previewText(customizationData.message ?? message, previewDefaults.message ?? "Wishing you joy and laughter", previewMode);
  const layout = product.layout_config ?? {};

  return (
      <RendererFrame
      assetUrl={product.template_asset_url || product.preview_asset_url}
      fallbackGradient="linear-gradient(135deg, #f59e0b, #fb7185)"
      className={getRendererSurfaceClass(product, compact, "aspect-square min-h-0")}
    >
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_35%)]" />
      <OverlayText config={layout.title as OverlayConfig | undefined} className="font-display font-bold uppercase tracking-[0.12em]">
        {title}
      </OverlayText>
      <OverlayText config={layout.message as OverlayConfig | undefined} className="font-semibold">
        {caption}
      </OverlayText>
    </RendererFrame>
  );
}
