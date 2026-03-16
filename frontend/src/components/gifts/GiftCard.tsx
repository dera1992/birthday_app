"use client";

import { Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GiftRenderer } from "@/components/gifts/GiftRenderer";
import { formatCurrency } from "@/lib/utils";
import type { GiftProduct } from "@/features/gifts/types";

interface GiftCardProps {
  product: GiftProduct;
  onPreview: (product: GiftProduct) => void;
  onCustomize: (product: GiftProduct) => void;
}

export function GiftCard({ product, onPreview, onCustomize }: GiftCardProps) {
  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-background/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_12px_36px_rgba(244,63,94,0.12)] dark:hover:border-rose-800"
      onClick={() => onPreview(product)}
    >
      {/* Preview area */}
      <div className="relative w-full overflow-hidden p-3">
        <div className="pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]">
          <GiftRenderer
            product={product}
            catalogCompact
            previewMode="demo"
          />
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
