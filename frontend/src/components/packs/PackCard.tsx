"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CuratedPack } from "@/lib/api/types";

interface PackCardProps {
  pack: CuratedPack;
  isSelected: boolean;
  onSelect: (pack: CuratedPack) => void;
  onPreview: (pack: CuratedPack) => void;
}

export function PackCard({ pack, isSelected, onSelect, onPreview }: PackCardProps) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-background/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 ${
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
      }`}
    >
      {/* Emoji header */}
      <div className="flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 py-8 text-5xl">
        {pack.icon_emoji}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold leading-snug">{pack.name}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{pack.description}</p>

        {pack.defaults.budget_range_label ? (
          <Badge variant="outline" className="mt-3 w-fit text-[11px]">
            {pack.defaults.budget_range_label}
          </Badge>
        ) : null}

        <div className="mt-auto flex gap-2 pt-4">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onPreview(pack)}>
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1"
            variant={isSelected ? "default" : "outline"}
            onClick={() => onSelect(pack)}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        </div>
      </div>
    </article>
  );
}
