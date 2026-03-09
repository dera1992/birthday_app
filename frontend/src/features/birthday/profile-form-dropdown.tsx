"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { SelectOption } from "@/features/birthday/profile-form-options";

type MultiSelectDropdownProps = {
  options: SelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((entry) => entry !== value));
      return;
    }

    onChange([...selected, value]);
  }

  const filteredOptions = search
    ? options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-background/80 px-4 text-left text-sm"
      >
        <span className={cn(selected.length === 0 && "text-muted-foreground")}>{triggerLabel}</span>
        <div className="flex shrink-0 items-center gap-2">
          {selected.length > 0 ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange([]);
                }
              }}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          ) : null}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-border bg-background shadow-lg">
          <div className="border-b border-border p-2">
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No options found</p>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  {option.label}
                </label>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
