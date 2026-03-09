import { OverlayText, RendererFrame, type OverlayConfig } from "@/components/gifts/renderers/RendererFrame";
import { previewText, type GiftPreviewMode } from "@/components/gifts/renderers/demoContent";
import { getPreviewDefaults, getRendererSurfaceClass } from "@/components/gifts/renderers/presentation";
import type { GiftProduct } from "@/features/gifts/types";

export function FlowerRenderer({
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

  return (
      <RendererFrame
      assetUrl={product.template_asset_url || product.preview_asset_url}
      fallbackGradient="linear-gradient(135deg, #fb7185, #f59e0b)"
      className={getRendererSurfaceClass(product, compact, "aspect-square min-h-0")}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <OverlayText config={layout.message as OverlayConfig | undefined} className="font-medium">
        {note}
      </OverlayText>
      <OverlayText config={layout.sender as OverlayConfig | undefined} className="font-semibold">
        {sender}
      </OverlayText>
    </RendererFrame>
  );
}
