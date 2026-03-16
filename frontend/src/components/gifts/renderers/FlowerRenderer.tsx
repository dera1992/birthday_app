import type { Ref } from "react";
import { OverlayText, RendererFrame, type OverlayConfig } from "@/components/gifts/renderers/RendererFrame";
import { previewText, type GiftPreviewMode } from "@/components/gifts/renderers/demoContent";
import { getPreviewDefaults, getRendererSurfaceClass } from "@/components/gifts/renderers/presentation";
import type { GiftProduct } from "@/features/gifts/types";

const FONT_STYLE_CLASS: Record<string, string> = {
  bold:    "font-black tracking-tight",
  elegant: "font-light tracking-widest",
  playful: "font-bold tracking-wide",
  modern:  "font-semibold tracking-normal",
};

export function FlowerRenderer({
  product,
  customizationData = {},
  message = "",
  fromName = "",
  compact = false,
  previewMode = "live",
  frameRef,
}: {
  product: GiftProduct;
  customizationData?: Record<string, unknown>;
  message?: string;
  fromName?: string;
  compact?: boolean;
  previewMode?: GiftPreviewMode;
  frameRef?: Ref<HTMLDivElement>;
}) {
  const previewDefaults = getPreviewDefaults(product);
  const note = previewText(customizationData.message ?? message, previewDefaults.message ?? "Wishing you joy and laughter", previewMode);
  const sender = previewText(customizationData.sender_name ?? customizationData.from_name ?? fromName, previewDefaults.sender_name ?? "From Alex", previewMode);
  const layout = product.layout_config ?? {};
  const fontClass = FONT_STYLE_CLASS[String(customizationData.font_style ?? "bold")] ?? FONT_STYLE_CLASS.bold;

  return (
      <RendererFrame
      ref={frameRef}
      assetUrl={product.template_asset_url || product.preview_asset_url}
      fallbackGradient="linear-gradient(135deg, #fb7185, #f59e0b)"
      className={getRendererSurfaceClass(product, compact, "aspect-square min-h-0")}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <OverlayText config={layout.message as OverlayConfig | undefined} className={`${fontClass} font-medium`}>
        {note}
      </OverlayText>
      <OverlayText config={layout.sender as OverlayConfig | undefined} className={`${fontClass} font-semibold`}>
        {sender}
      </OverlayText>
    </RendererFrame>
  );
}
