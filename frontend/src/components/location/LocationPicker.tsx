"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBrowserCoordinates, reverseGeocode, searchPlaces } from "@/lib/geo";
import type { NominatimResult } from "@/lib/geo";

export type LocationValue = { lat: number; lng: number; label: string };

export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationValue | null;
  onChange: (v: LocationValue) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const data = await searchPlaces(query);
      setResults(data);
      setOpen(data.length > 0);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function pick(result: NominatimResult) {
    const label = result.display_name.split(",").slice(0, 3).join(",").trim();
    onChange({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), label });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  async function useMyLocation() {
    setLocating(true);
    try {
      const coords = await getBrowserCoordinates();
      const label = await reverseGeocode(coords.lat, coords.lng);
      onChange({ ...coords, label });
      toast.success("Location detected.");
    } catch {
      toast.error("Could not detect your location. Check browser permissions.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-2">
      <div ref={ref} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search city, neighbourhood, or area…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={useMyLocation}
            disabled={locating}
            title="Use my current location"
          >
            <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
          </Button>
        </div>

        {open && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(r)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-1">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {value ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="flex-1 truncate">{value.label}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Search for a location or use the GPS button to detect your current position.
        </p>
      )}
    </div>
  );
}
