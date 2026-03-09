import { Download, Sparkles } from "lucide-react";
import { GiftAccessActions } from "@/components/gifts/GiftAccessActions";
import { GiftRenderer } from "@/components/gifts/GiftRenderer";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { GiftPurchase } from "@/features/gifts/types";

interface GiftReceivedItemProps {
  gift: GiftPurchase;
}

export function GiftReceivedItem({ gift }: GiftReceivedItemProps) {
  const fromLabel = gift.is_anonymous || !gift.from_name ? "Anonymous" : `From ${gift.from_name}`;
  const isAI = gift.product.is_ai_generated_product;
  const aiAssetUrl = gift.effective_asset_url || gift.selected_asset_url;

  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm">{gift.product.name}</p>
            {isAI && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-rose-100 to-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:from-rose-950/40 dark:to-purple-950/40 dark:text-purple-300">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {fromLabel} · {formatDate(gift.created_at)}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-rose-600 dark:text-rose-400">
          {formatCurrency(gift.gross_amount, gift.product.currency.toUpperCase())}
        </p>
      </div>

      {/* Render: show AI selected asset if available, otherwise fall back to normal renderer */}
      {isAI && aiAssetUrl ? (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <img
            src={aiAssetUrl}
            alt={`AI-generated ${gift.product.category.toLowerCase()} for ${gift.from_name || "celebrant"}`}
            className="w-full object-cover"
          />
        </div>
      ) : (
        <GiftRenderer
          product={gift.product}
          rendererType={gift.renderer_type}
          customizationData={gift.customization_data}
          message={gift.custom_message}
          fromName={gift.from_name}
          compact
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <GiftAccessActions gift={gift} compact />
        {isAI && gift.is_downloadable && gift.ai_download_url ? (
          <a
            href={gift.ai_download_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        ) : null}
      </div>
    </div>
  );
}
