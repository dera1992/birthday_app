"use client";

import { cn } from "@/lib/utils";
import type { GiftCategory } from "@/features/gifts/types";

type FilterOption = { id: GiftCategory | "ALL"; label: string; emoji: string };

const FILTERS: FilterOption[] = [
  { id: "ALL", label: "All", emoji: "🎁" },
  { id: "CARD", label: "Cards", emoji: "💌" },
  { id: "FLOWER", label: "Flowers", emoji: "🌸" },
  { id: "MESSAGE", label: "Messages", emoji: "✉️" },
  { id: "BADGE", label: "Badges", emoji: "🏅" },
  { id: "VIDEO", label: "Videos", emoji: "🎬" },
];

interface GiftCategoryPillsProps {
  active: GiftCategory | "ALL";
  onChange: (category: GiftCategory | "ALL") => void;
}

export function GiftCategoryPills({ active, onChange }: GiftCategoryPillsProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
            active === f.id
              ? "border-rose-400 bg-rose-50 text-rose-700 shadow-sm dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              : "border-border bg-background/80 text-muted-foreground hover:border-rose-200 hover:text-foreground"
          )}
        >
          <span className="text-base leading-none">{f.emoji}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}
