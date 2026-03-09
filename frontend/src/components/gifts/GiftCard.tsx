"use client";

import { Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { GiftProduct } from "@/features/gifts/types";

interface GiftCardProps {
  product: GiftProduct;
  onPreview: (product: GiftProduct) => void;
  onCustomize: (product: GiftProduct) => void;
}

export function GiftCard({ product, onPreview, onCustomize }: GiftCardProps) {
  const catalogPreviewUrl = product.catalog_preview_asset_url || product.preview_asset_url || product.template_asset_url;

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-background/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_12px_36px_rgba(244,63,94,0.12)] dark:hover:border-rose-800"
      onClick={() => onPreview(product)}
    >
      {/* Preview area */}
      <div className="relative h-36 w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(254,242,242,0.92)_42%,_rgba(254,226,226,0.75))] p-3 dark:bg-[radial-gradient(circle_at_top_left,_rgba(30,41,59,0.78),_rgba(76,5,25,0.36)_42%,_rgba(63,63,70,0.52))]">
        <div className="pointer-events-none relative h-full w-full overflow-hidden rounded-[24px] border border-white/80 bg-white/88 p-2 shadow-[0_10px_26px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.01]">
          <div className="absolute inset-2 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.58))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
          {catalogPreviewUrl ? (
            <img
              src={catalogPreviewUrl}
              alt={`${product.name} preview`}
              className="relative z-10 h-full w-full rounded-[18px] object-contain"
            />
          ) : (
            <div className="relative z-10 flex h-full w-full items-center justify-center rounded-[18px] bg-gradient-to-br from-rose-100 via-pink-50 to-white px-4 text-center text-xs font-medium text-slate-500 dark:from-rose-950/40 dark:via-pink-950/20 dark:to-slate-950 dark:text-slate-300">
              Preview coming soon
            </div>
          )}
        </div>
        {/* Instant delivery badge */}
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-rose-600 shadow-sm backdrop-blur dark:bg-black/50 dark:text-rose-400">
          <Zap className="h-3 w-3" aria-hidden />
          Instant
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="font-semibold leading-snug">{product.name}</p>
          <Badge variant="outline" className="shrink-0 text-[11px]">
            {product.category}
          </Badge>
        </div>
        {product.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-4">
          <p className="font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(product.price, product.currency.toUpperCase())}
          </p>
          <Button
            size="sm"
            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
            onClick={(event) => {
              event.stopPropagation();
              onCustomize(product);
            }}
          >
            Customize & Send
          </Button>
        </div>
      </div>
    </article>
  );
}
