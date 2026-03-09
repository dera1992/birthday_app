import { OverlayText, RendererFrame, type OverlayConfig } from "@/components/gifts/renderers/RendererFrame";
import { previewText, type GiftPreviewMode } from "@/components/gifts/renderers/demoContent";
import { getPreviewDefaults, getRendererSurfaceClass } from "@/components/gifts/renderers/presentation";
import type { GiftProduct } from "@/features/gifts/types";

export function VideoRenderer({
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
  const title = previewText(customizationData.recipient_name, previewDefaults.recipient_name ?? "Happy Birthday Emma", previewMode);
  const note = previewText(customizationData.message ?? message, previewDefaults.message ?? "Wishing you joy and laughter", previewMode);
  const sender = previewText(customizationData.sender_name ?? customizationData.from_name ?? fromName, previewDefaults.sender_name ?? "Alex", previewMode);
  const layout = product.layout_config ?? {};

  return (
      <RendererFrame
      assetUrl={product.template_asset_url || product.preview_asset_url}
      fallbackGradient="linear-gradient(135deg, #0f172a, #334155)"
      className={getRendererSurfaceClass(product, compact, "aspect-square min-h-0")}
    >
      <div className="absolute left-4 top-4 z-10 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
        Preview
      </div>
      <OverlayText config={layout.title as OverlayConfig | undefined} className="font-display font-bold">
        {title}
      </OverlayText>
      <OverlayText config={layout.message as OverlayConfig | undefined}>
        {note}
      </OverlayText>
      <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/35 px-3 py-1 text-xs text-white">
        From {sender}
      </div>
    </RendererFrame>
  );
}
