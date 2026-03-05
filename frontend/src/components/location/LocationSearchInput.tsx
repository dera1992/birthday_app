"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITY_PRESETS, getBrowserCoordinates, reverseGeocode, searchPlaces } from "@/lib/geo";

export type LocationResult = { label: string; lat: number; lng: number };

export function LocationSearchInput({
  value,
  onPick,
  placeholder = "Search city, area…",
  inputClassName,
}: {
  value: string;
  onPick: (loc: LocationResult) => void;
  placeholder?: string;
  inputClassName?: string;
}) {
  const [inputVal, setInputVal] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setInputVal(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleChange(val: string) {
    setInputVal(val);
    const presets = CITY_PRESETS
      .filter((p) => p.label.toLowerCase().includes(val.toLowerCase()))
      .map((p) => ({ label: p.label, lat: p.lat, lng: p.lng }));
    setSuggestions(presets);
    setOpen(presets.length > 0);
    clearTimeout(timerRef.current);
    if (val.trim().length >= 2) {
      timerRef.current = setTimeout(async () => {
        const results = await searchPlaces(val);
        const extra = results
          .map((r) => {
            const city = r.address?.city ?? r.address?.town ?? r.address?.village ?? "";
            if (!city) return null;
            const label = [r.address?.suburb ?? r.address?.neighbourhood, city].filter(Boolean).join(", ");
            return { label, lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
          })
          .filter(Boolean) as LocationResult[];
        const seen = new Set(presets.map((p) => p.label.toLowerCase()));
        const merged = [...presets, ...extra.filter((s) => !seen.has(s.label.toLowerCase())).slice(0, 4)];
        setSuggestions(merged);
        setOpen(merged.length > 0);
      }, 400);
    }
  }

  function pick(loc: LocationResult) {
    setInputVal(loc.label);
    onPick(loc);
    setSuggestions([]);
    setOpen(false);
  }

  async function detectLocation() {
    setLocating(true);
    try {
      const coords = await getBrowserCoordinates();
      const label = await reverseGeocode(coords.lat, coords.lng);
      pick({ ...coords, label });
    } catch { /* permission denied */ }
    finally { setLocating(false); }
  }

  return (
    <div className="relative flex-1" ref={ref}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={inputVal}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            className={inputClassName ?? "pl-9"}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={detectLocation}
          disabled={locating}
          title="Use my location"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
        </Button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pick(s); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
