"use client";

import { PackCard } from "./PackCard";
import type { CuratedPack } from "@/lib/api/types";

interface PackGridProps {
  packs: CuratedPack[];
  isLoading: boolean;
  selectedSlug: string | null;
  onSelect: (pack: CuratedPack) => void;
  onPreview: (pack: CuratedPack) => void;
}

function PackSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-background/80">
      <div className="h-28 bg-muted/40" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted/60" />
        <div className="h-3 w-full rounded bg-muted/40" />
        <div className="h-3 w-5/6 rounded bg-muted/40" />
        <div className="mt-4 flex gap-2">
          <div className="h-8 flex-1 rounded-lg bg-muted/40" />
          <div className="h-8 flex-1 rounded-lg bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

export function PackGrid({ packs, isLoading, selectedSlug, onSelect, onPreview }: PackGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PackSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!packs.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No packs available right now.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {packs.map((pack) => (
        <PackCard
          key={pack.slug}
          pack={pack}
          isSelected={selectedSlug === pack.slug}
          onSelect={onSelect}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}
