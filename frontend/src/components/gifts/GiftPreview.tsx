import type { GiftCategory } from "@/features/gifts/types";

const CATEGORY_EMOJI: Record<GiftCategory, string> = {
  CARD: "💌",
  FLOWER: "🌸",
  MESSAGE: "✉️",
  BADGE: "🏅",
  VIDEO: "🎬",
};

export function GiftPreview({
  previewAssetUrl,
  category,
  className = "",
}: {
  previewAssetUrl?: string;
  category: GiftCategory;
  className?: string;
}) {
  if (previewAssetUrl) {
    return (
      <img
        src={previewAssetUrl}
        alt=""
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex h-full w-full select-none items-center justify-center text-4xl ${className}`}
      aria-hidden
    >
      {CATEGORY_EMOJI[category] ?? "🎁"}
    </span>
  );
}

export { CATEGORY_EMOJI };
