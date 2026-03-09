import type { GiftProduct } from "@/features/gifts/types";

type PresentationDefaults = {
  preview_shell?: string;
  aspect_ratio?: string;
};

type PreviewDefaults = {
  recipient_name?: string;
  message?: string;
  sender_name?: string;
};

function getPresentation(product: GiftProduct): PresentationDefaults {
  const presentation = product.default_config?.presentation;
  return presentation && typeof presentation === "object" ? (presentation as PresentationDefaults) : {};
}

export function getPreviewDefaults(product: GiftProduct): PreviewDefaults {
  const previewDefaults = product.default_config?.preview_defaults;
  return previewDefaults && typeof previewDefaults === "object" ? (previewDefaults as PreviewDefaults) : {};
}

export function getPreviewShell(product: GiftProduct) {
  const presentation = getPresentation(product);
  if (presentation.preview_shell) {
    return presentation.preview_shell;
  }
  return product.renderer_type === "CARD_TEMPLATE" ? "studio_card" : "studio_panel";
}

export function getRendererSurfaceClass(product: GiftProduct, compact: boolean, fallback: string) {
  if (compact) {
    return "min-h-[180px]";
  }

  const aspectRatio = getPresentation(product).aspect_ratio;
  if (aspectRatio === "portrait") {
    return "aspect-[4/5] min-h-0";
  }
  if (aspectRatio === "landscape") {
    return "aspect-[16/10] min-h-0";
  }
  if (aspectRatio === "square") {
    return "aspect-square min-h-0";
  }
  return fallback;
}
