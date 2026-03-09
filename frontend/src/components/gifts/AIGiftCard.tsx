"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { GiftProduct } from "@/features/gifts/types";

interface AIGiftCardProps {
  product: GiftProduct;
  onCustomize: (product: GiftProduct) => void;
}

export function AIGiftCard({ product, onCustomize }: AIGiftCardProps) {
  return (
    <article className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-dashed border-rose-200 bg-gradient-to-br from-rose-50/60 to-purple-50/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-[0_8px_28px_rgba(244,63,94,0.14)] dark:border-rose-800/60 dark:from-rose-950/30 dark:to-purple-950/30 dark:hover:border-rose-600">
      {/* AI indicator area */}
      <div className="relative flex h-36 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100/70 via-purple-100/50 to-pink-100/70 dark:from-rose-950/40 dark:via-purple-950/30 dark:to-pink-950/40">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
            <Sparkles className="h-7 w-7 text-white" aria-hidden />
          </div>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">AI-Generated</span>
        </div>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-4 -top-4 h-16 w-16 rounded-full bg-rose-300/30 blur-xl" />
        <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-purple-300/30 blur-xl" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="font-semibold leading-snug text-foreground">{product.name}</p>
          <span className="shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            AI
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {product.description || "Can't find what you like? Let AI create a unique design just for them."}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4">
          <p className="font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(product.price, product.currency.toUpperCase())}
          </p>
          <Button
            size="sm"
            className="rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 text-white hover:from-rose-700 hover:to-purple-700"
            onClick={(e) => {
              e.stopPropagation();
              onCustomize(product);
            }}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Generate with AI
          </Button>
        </div>
      </div>
    </article>
  );
}
