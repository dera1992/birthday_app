import { CATEGORY_EMOJI } from "./GiftPreview";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { GiftPurchase } from "@/features/gifts/types";

interface GiftReceivedItemProps {
  gift: GiftPurchase;
}

export function GiftReceivedItem({ gift }: GiftReceivedItemProps) {
  const emoji = CATEGORY_EMOJI[gift.product.category] ?? "🎁";
  const fromLabel = gift.from_name ? `From ${gift.from_name}` : "Anonymous";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      {/* Icon / preview */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-2xl dark:bg-rose-950/30">
        {gift.product.preview_asset_url ? (
          <img
            src={gift.product.preview_asset_url}
            alt={gift.product.name}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <span aria-hidden>{emoji}</span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-sm">{gift.product.name}</p>
        {gift.custom_message ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground italic">
            &ldquo;{gift.custom_message}&rdquo;
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {fromLabel} &middot; {formatDate(gift.created_at)}
        </p>
      </div>

      {/* Amount */}
      <p className="shrink-0 text-sm font-bold text-rose-600 dark:text-rose-400">
        {formatCurrency(gift.gross_amount, "GBP")}
      </p>
    </div>
  );
}
