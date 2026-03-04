"use client";

import { GiftReceivedItem } from "./GiftReceivedItem";
import type { GiftPurchase } from "@/features/gifts/types";

interface GiftsReceivedWallProps {
  gifts: GiftPurchase[];
  isLoading: boolean;
  isOwner: boolean;
}

export function GiftsReceivedWall({ gifts, isLoading, isOwner }: GiftsReceivedWallProps) {
  // Client-side defensive filter — API should already do this, but safety-first.
  const visible = isOwner ? gifts : gifts.filter((g) => g.visibility === "PUBLIC");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Gifts received
        </p>
        {visible.length > 0 ? (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
            {visible.length}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))}
        </div>
      ) : !visible.length ? (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No gifts yet — be the first to send one! 🎁
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((gift) => (
            <GiftReceivedItem key={gift.id} gift={gift} />
          ))}
        </div>
      )}
    </div>
  );
}
