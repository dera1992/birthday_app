"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingBlock } from "@/components/ui/state-block";
import { useAuth } from "@/features/auth/auth-context";
import { useConfirmVenue } from "@/features/events/api";
import { useVenueClick, useVenueRecommendations } from "@/features/venues/api";
import { getErrorMessage } from "@/lib/api/errors";
import { getBrowserCoordinates } from "@/lib/geo";

const CITIES = ["London", "Manchester"];
const CATEGORIES = [
  { value: "ACTIVITY", label: "Activity" },
  { value: "BAR", label: "Bar" },
  { value: "BRUNCH", label: "Brunch" },
  { value: "CLUB", label: "Club" },
  { value: "DINING", label: "Dining" },
  { value: "DINNER", label: "Dinner" },
  { value: "KARAOKE", label: "Karaoke" },
  { value: "LOUNGE", label: "Lounge" },
  { value: "NIGHTLIFE", label: "Nightlife" },
  { value: "OUTDOOR", label: "Outdoor" },
  { value: "PARK", label: "Park" },
  { value: "PRIVATE", label: "Private hire" },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function StarDisplay({ avg, count }: { avg: number | null; count: number }) {
  if (avg === null || count === 0) return null;
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  return (
    <span className="flex items-center gap-1">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`h-3.5 w-3.5 ${i <= full ? "text-amber-400" : i === full + 1 && half ? "text-amber-300" : "text-muted-foreground/30"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.951 2.878c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
          </svg>
        ))}
      </span>
      <span className="text-xs font-medium">{avg.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </span>
  );
}

export default function VenueBrowsePage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id") ? Number(searchParams.get("event_id")) : undefined;
  const hostId = searchParams.get("host_id") ? Number(searchParams.get("host_id")) : undefined;

  const { user } = useAuth();
  const isHost = Boolean(eventId && user?.id === hostId);

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const confirmVenue = useConfirmVenue(eventId ?? 0);
  const venueClick = useVenueClick();

  // Debounce search query
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(value: string) {
    setQ(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQ(value), 400);
  }

  useEffect(() => {
    getBrowserCoordinates().then(setUserCoords).catch(() => {});
  }, []);

  const venuesQuery = useVenueRecommendations({ city: city || undefined, category: category || undefined, q: debouncedQ || undefined });
  const venues = venuesQuery.data ?? [];

  async function handleVenueRedirect(venueId: number) {
    const response = await venueClick.mutateAsync(venueId);
    window.open(response.redirect_url, "_blank", "noopener,noreferrer");
  }

  async function handlePickVenue(venueName: string) {
    try {
      await confirmVenue.mutateAsync({ venue_name: venueName });
      toast.success(`"${venueName}" set as your event venue.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to confirm venue."));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-4xl">Browse venues</CardTitle>
          <CardDescription>
            Search our partner venue directory by name, city, or type. Can&apos;t find what you&apos;re looking for? Use any venue name when confirming from your event management page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name…"
                value={q}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <select
              className="flex h-11 rounded-2xl border border-input bg-background/80 px-4 text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">All cities</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="flex h-11 rounded-2xl border border-input bg-background/80 px-4 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All types</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Count */}
          {!venuesQuery.isLoading && (
            <p className="text-sm text-muted-foreground">
              {venues.length} venue{venues.length !== 1 ? "s" : ""}
              {city ? ` in ${city}` : ""}
              {category ? ` · ${category}` : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {venuesQuery.isLoading ? (
        <LoadingBlock message="Loading venues…" />
      ) : venues.length === 0 ? (
        <EmptyState
          title="No venues found"
          description="Try adjusting your search or filters. You can also confirm any venue by name from your event management page."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => {
            const distanceKm =
              userCoords && (venue as { latitude?: number }).latitude != null
                ? haversineKm(
                    userCoords.lat,
                    userCoords.lng,
                    (venue as { latitude?: number; longitude?: number }).latitude!,
                    (venue as { latitude?: number; longitude?: number }).longitude!,
                  )
                : null;

            return (
              <div key={venue.id} className="rounded-[24px] border border-border bg-background/70 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug">{venue.name}</p>
                  {venue.is_sponsored && (
                    <Badge variant="warning" className="shrink-0 text-xs">Sponsored</Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{venue.city} · {venue.approx_area_label}</span>
                    {distanceKm !== null && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                        {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">{venue.category}</Badge>
                </div>

                <StarDisplay avg={venue.avg_rating} count={venue.rating_count} />

                <div className="mt-auto flex flex-col gap-2">
                  {isHost && (
                    <Button
                      className="w-full"
                      onClick={() => handlePickVenue(venue.name)}
                      disabled={confirmVenue.isPending}
                    >
                      Use as venue
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => handleVenueRedirect(venue.id)}>
                    View partner
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
