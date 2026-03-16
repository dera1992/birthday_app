"use client";

import { AIGiftCard } from "./AIGiftCard";
import { GiftCard } from "./GiftCard";
import type { GiftProduct } from "@/features/gifts/types";

function GiftCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-background/80">
      <div className="h-[220px] w-full bg-muted/60" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 rounded-lg bg-muted/60" />
        <div className="h-3 w-full rounded-lg bg-muted/40" />
        <div className="h-3 w-4/5 rounded-lg bg-muted/40" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-5 w-16 rounded-lg bg-muted/60" />
          <div className="h-8 w-28 rounded-xl bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

interface GiftGridProps {
  products: GiftProduct[];
  isLoading: boolean;
  onPreview: (product: GiftProduct) => void;
  onCustomize: (product: GiftProduct) => void;
  /** If provided, an AI gift card for this AI product will be appended to the grid. */
  aiProduct?: GiftProduct | null;
  onAICustomize?: (product: GiftProduct) => void;
}

export function GiftGrid({ products, isLoading, onPreview, onCustomize, aiProduct, onAICustomize }: GiftGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GiftCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const regularProducts = products.filter((p) => !p.is_ai_generated_product);

  if (!regularProducts.length && !aiProduct) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No gifts available in this category yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {regularProducts.map((product) => (
        <GiftCard key={product.id} product={product} onPreview={onPreview} onCustomize={onCustomize} />
      ))}
      {aiProduct && onAICustomize ? (
        <AIGiftCard product={aiProduct} onCustomize={onAICustomize} />
      ) : null}
    </div>
  );
}
