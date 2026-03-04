"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, LocateFixed } from "lucide-react";
import { toast } from "sonner";

import { EventFeedMap } from "@/features/events/components/event-feed-map";
import { useEventFeed } from "@/features/events/api";
import { ErrorState, EmptyState, LoadingBlock } from "@/components/ui/state-block";
import { CITY_PRESETS, getBrowserCoordinates } from "@/lib/geo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/errors";
import { formatCurrency, formatDate } from "@/lib/utils";

const categories = ["DINING", "NIGHTLIFE", "WELLNESS", "OUTDOORS", "CULTURE"];

export default function EventsFeedPage() {
  const searchParams = useSearchParams();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5000);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") ?? CITY_PRESETS[0].label);

  useEffect(() => {
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setCoords({ lat, lng });
      return;
    }

    const cityParam = searchParams.get("city");
    const nextCity = cityParam && CITY_PRESETS.some((city) => city.label === cityParam) ? cityParam : selectedCity;
    const preset = CITY_PRESETS.find((city) => city.label === nextCity) ?? CITY_PRESETS[0];
    setCoords({ lat: preset.lat, lng: preset.lng });
  }, [searchParams, selectedCity]);

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
    const city = searchParams.get("city");
    setSelectedCity(city && CITY_PRESETS.some((option) => option.label === city) ? city : CITY_PRESETS[0].label);
  }, [searchParams]);

  const feedQuery = useEventFeed({
    lat: coords?.lat,
    lng: coords?.lng,
    radius,
    category,
    q: search,
  });

  async function detectLocation() {
    try {
      const nextCoords = await getBrowserCoordinates();
      setCoords(nextCoords);
      toast.success("Using your current location.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fetch your location.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Discover</Badge>
            <CardTitle className="pt-3 font-display text-4xl">Find birthday experiences nearby</CardTitle>
            <CardDescription>Map-led discovery for curated events that are public or open to stranger expansion.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={detectLocation}>
              <LocateFixed className="h-4 w-4" />
              Use my location
            </Button>
            <Button asChild>
              <Link href="/events/new">Host a new event</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Search</span>
            <Input
              placeholder="Search by title, area, description, or host"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">City fallback</span>
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
            >
              {CITY_PRESETS.map((city) => (
                <option key={city.label} value={city.label}>
                  {city.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Radius (m)</span>
            <Input type="number" value={radius} onChange={(event) => setRadius(Number(event.target.value))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end md:col-span-4">
            <div className="rounded-3xl bg-secondary/70 px-4 py-3 text-sm text-muted-foreground">
              <Filter className="mb-2 h-4 w-4 text-primary" />
              Search narrows the same nearby feed. Results still stay ordered by distance first, then event time.
            </div>
          </div>
        </CardContent>
      </Card>

      {coords ? <EventFeedMap events={feedQuery.data ?? []} center={coords} /> : null}

      {feedQuery.isLoading ? <LoadingBlock message="Loading events near you..." /> : null}
      {feedQuery.error ? <ErrorState description={getErrorMessage(feedQuery.error, "Unable to load events right now.")} /> : null}
      {!feedQuery.isLoading && !feedQuery.error && !(feedQuery.data ?? []).length ? (
        <EmptyState
          title="No events match these filters"
          description="Try a larger radius, switch city fallback, or publish one of your own drafts from My Events."
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
                  <span>
                    {event.approved_count}/{event.max_guests} approved
                  </span>
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
