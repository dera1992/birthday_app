import { OverlayText, RendererFrame, type OverlayConfig } from "@/components/gifts/renderers/RendererFrame";
import { previewText, type GiftPreviewMode } from "@/components/gifts/renderers/demoContent";
import { getPreviewDefaults, getRendererSurfaceClass } from "@/components/gifts/renderers/presentation";
import type { GiftProduct } from "@/features/gifts/types";

export function CardRenderer({
  product,
  customizationData = {},
  message = "",
  fromName = "",
  compact = false,
  catalogCompact = false,
  previewMode = "live",
}: {
  product: GiftProduct;
  customizationData?: Record<string, unknown>;
  message?: string;
  fromName?: string;
  compact?: boolean;
  catalogCompact?: boolean;
  previewMode?: GiftPreviewMode;
}) {
  const previewDefaults = getPreviewDefaults(product);
  const title = previewText(customizationData.recipient_name, previewDefaults.recipient_name ?? "Happy Birthday Emma", previewMode);
  const note = previewText(customizationData.message ?? message, previewDefaults.message ?? "Wishing you joy and laughter", previewMode);
  const sender = previewText(customizationData.sender_name ?? customizationData.from_name ?? fromName, previewDefaults.sender_name ?? "From Alex", previewMode);
  const themeColor = String(customizationData.theme_color ?? product.default_config?.theme_color ?? "#ec4899");
  const layout = product.layout_config ?? {};

  if (catalogCompact) {
    return (
      <RendererFrame
        assetUrl={product.template_asset_url || product.preview_asset_url}
        fallbackGradient={`linear-gradient(135deg, ${themeColor}, #fb7185)`}
        className="min-h-[180px]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.16))]" />
        <div className="absolute inset-x-5 bottom-4 top-6 rounded-[20px] border border-white/70 bg-white/84 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.10)] backdrop-blur-sm">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="max-w-[88%] line-clamp-2 text-[12px] font-extrabold uppercase tracking-[0.03em] text-violet-600 [text-wrap:balance]">
              {title}
            </div>
            <div className="mt-2 max-w-[84%] line-clamp-2 text-[11px] font-medium leading-4 text-slate-700 [text-wrap:balance]">
              {note}
            </div>
            <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-800">
              {sender}
            </div>
          </div>
        </div>
      </RendererFrame>
    );
  }

  return (
    <RendererFrame
      assetUrl={product.template_asset_url || product.preview_asset_url}
      fallbackGradient={`linear-gradient(135deg, ${themeColor}, #fb7185)`}
      className={getRendererSurfaceClass(product, compact, "aspect-square min-h-0")}
    >
      <div className="absolute inset-0 bg-black/10" />
      <OverlayText config={layout.title as OverlayConfig | undefined} className="font-display font-bold">
        {title}
      </OverlayText>
      <OverlayText config={layout.message as OverlayConfig | undefined}>
        {note}
      </OverlayText>
      <OverlayText config={layout.sender as OverlayConfig | undefined} className="font-semibold">
        {sender}
      </OverlayText>
    </RendererFrame>
  );
}
