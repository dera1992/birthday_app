import { type ComponentType, type Ref } from "react";

import { AnimatedMessageRenderer } from "@/components/gifts/renderers/AnimatedMessageRenderer";
import { BadgeRenderer } from "@/components/gifts/renderers/BadgeRenderer";
import { CardRenderer } from "@/components/gifts/renderers/CardRenderer";
import { FlowerRenderer } from "@/components/gifts/renderers/FlowerRenderer";
import { VideoRenderer } from "@/components/gifts/renderers/VideoRenderer";
import type { GiftPreviewMode } from "@/components/gifts/renderers/demoContent";

import type { GiftProduct, GiftRendererType } from "@/features/gifts/types";

type GiftRendererProps = {
  product: GiftProduct;
  rendererType?: GiftRendererType;
  customizationData?: Record<string, unknown>;
  message?: string;
  fromName?: string;
  compact?: boolean;
  catalogCompact?: boolean;
  previewMode?: GiftPreviewMode;
  frameRef?: Ref<HTMLDivElement>;
};

const giftRenderers = {
  CARD_TEMPLATE: CardRenderer,
  FLOWER_GIFT: FlowerRenderer,
  ANIMATED_MESSAGE: AnimatedMessageRenderer,
  BADGE_GIFT: BadgeRenderer,
  VIDEO_TEMPLATE: VideoRenderer,
} satisfies Record<GiftRendererType, ComponentType<GiftRendererProps>>;

export function GiftRenderer({
  product,
  rendererType,
  customizationData = {},
  message = "",
  fromName = "",
  compact = false,
  catalogCompact = false,
  previewMode = "live",
  frameRef,
}: GiftRendererProps) {
  const Renderer = giftRenderers[rendererType ?? product.renderer_type];
  return (
    <Renderer
      product={product}
      rendererType={rendererType}
      customizationData={customizationData}
      message={message}
      fromName={fromName}
      compact={compact}
      catalogCompact={catalogCompact}
      previewMode={previewMode}
      frameRef={frameRef}
    />
  );
}
