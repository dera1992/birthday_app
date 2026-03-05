"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { EventFeedMap } from "@/features/events/components/event-feed-map";
import { useEventFeed } from "@/features/events/api";
import { ErrorState, EmptyState, LoadingBlock } from "@/components/ui/state-block";
import { CITY_PRESETS } from "@/lib/geo";
import { LocationSearchInput } from "@/components/location/LocationSearchInput";
import type { LocationResult } from "@/components/location/LocationSearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/errors";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocationContext } from "@/lib/location-context";

const categories = ["DINING", "NIGHTLIFE", "WELLNESS", "OUTDOORS", "CULTURE"];

export default function EventsFeedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { coords: ctxCoords, setCoords: setCtxCoords } = useLocationContext();

  const [location, setLocation] = useState<LocationResult>({
    lat: ctxCoords.lat,
    lng: ctxCoords.lng,
    label: ctxCoords.label,
  });
  const [radius, setRadius] = useState(5000);
  const [category, setCategory] = useState("");
  const [inputSearch, setInputSearch] = useState(searchParams.get("q") ?? "");
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get("q") ?? "");

  // Keep in sync with navbar location context
  useEffect(() => {
    setLocation({ lat: ctxCoords.lat, lng: ctxCoords.lng, label: ctxCoords.label });
  }, [ctxCoords]);

  // Override from URL params on first load
  useEffect(() => {
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    if (Number.isFinite(lat) && lat !== 0 && Number.isFinite(lng) && lng !== 0) {
      setLocation((prev) => ({ ...prev, lat, lng }));
      return;
    }
    const cityParam = searchParams.get("city");
    const preset = CITY_PRESETS.find((c) => c.label === cityParam);
    if (preset) setLocation({ lat: preset.lat, lng: preset.lng, label: preset.label });
  }, [searchParams]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setInputSearch(q);
    setAppliedSearch(q);
  }, [searchParams]);

  function handlePickLocation(loc: LocationResult) {
    setLocation(loc);
    setCtxCoords(loc);
  }

  const feedQuery = useEventFeed({
    lat: location.lat,
    lng: location.lng,
    radius,
    category,
    q: appliedSearch,
  });

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = inputSearch.trim();
    setAppliedSearch(trimmed);
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    router.replace(`/events?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Discover</Badge>
            <CardTitle className="pt-3 font-display text-4xl">Find birthday experiences nearby</CardTitle>
            <CardDescription>Public events near your location, ordered by distance.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/events/new">Host a new event</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Combined search bar */}
          <form onSubmit={handleSearchSubmit}>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-input bg-background/80 p-2 shadow-sm">
              {/* Text search */}
              <div className="relative min-w-[180px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search events, title, area, host…"
                  value={inputSearch}
                  onChange={(e) => setInputSearch(e.target.value)}
                  className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="hidden h-6 w-px bg-border sm:block" />

              {/* Location search */}
              <div className="min-w-[200px] flex-1">
                <LocationSearchInput
                  value={location.label}
                  onPick={handlePickLocation}
                  placeholder="City or neighbourhood…"
                />
              </div>

              <Button type="submit" className="rounded-xl">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </form>

          {/* Secondary filters */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Radius (m)</span>
              <Input
                type="number"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-28 h-9"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Category</span>
              <select
                className="flex h-9 rounded-xl border border-input bg-background/80 px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <EventFeedMap events={feedQuery.data ?? []} center={location} />

      {feedQuery.isLoading ? <LoadingBlock message="Loading events near you..." /> : null}
      {feedQuery.error ? <ErrorState description={getErrorMessage(feedQuery.error, "Unable to load events right now.")} /> : null}
      {!feedQuery.isLoading && !feedQuery.error && !(feedQuery.data ?? []).length ? (
        <EmptyState
          title="No events match these filters"
          description="Try a larger radius, different location, or publish one of your own drafts from My Events."
          actionHref="/events/new"
          actionLabel="Create an event"
        />
      ) : null}

      <div className="grid gap-4">
        {(feedQuery.data ?? []).map((event) => (
          <Card key={event.id}>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{event.category}</Badge>
                  <Badge variant="outline">{event.state}</Badge>
                  <span className="text-sm text-muted-foreground">{event.distance_meters ? `${Math.round(event.distance_meters)}m away` : event.approx_area_label}</span>
                </div>
                <h3 className="mt-3 font-display text-2xl">{event.title}</h3>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{event.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>{formatDate(event.start_at)}</span>
                  <span>{event.approx_area_label}</span>
                  <span>{event.approved_count}/{event.max_guests} approved</span>
                </div>
              </div>
              <div className="space-y-3 text-right">
                <p className="font-display text-3xl">{formatCurrency(event.amount, event.currency)}</p>
                <p className="text-sm text-muted-foreground">Refunds available until lock is confirmed.</p>
                <Button asChild>
                  <Link href={`/events/${event.id}`}>View event</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
