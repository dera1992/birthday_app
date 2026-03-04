"use client";

import { GiftCard } from "./GiftCard";
import type { GiftProduct } from "@/features/gifts/types";

function GiftCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-background/80">
      <div className="h-32 w-full bg-muted/60" />
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
  onSelect: (product: GiftProduct) => void;
}

export function GiftGrid({ products, isLoading, onSelect }: GiftGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GiftCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No gifts available in this category yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <GiftCard key={product.id} product={product} onSelect={onSelect} />
      ))}
    </div>
  );
}
