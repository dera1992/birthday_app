"use client";

import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import { useState } from "react";
import { MapPinned } from "lucide-react";

import type { EventRecord } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function EventFeedMap({
  events,
  center,
}: {
  events: EventRecord[];
  center: { lat: number; lng: number };
}) {
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <Card className="h-[420px]">
        <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <MapPinned className="h-10 w-10 text-primary" />
          <p className="text-lg font-semibold">Mapbox token missing</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to render the live event map. The list view and filtering still work.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-border shadow-panel">
      <Map
        initialViewState={{
          latitude: center.lat,
          longitude: center.lng,
          zoom: 10.5,
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={token}
        style={{ width: "100%", height: 420 }}
      >
        <NavigationControl position="top-right" />
        {events.map((event) => (
          <Marker key={event.id} latitude={event.location_point.lat} longitude={event.location_point.lng} anchor="bottom">
            <button
              type="button"
              onClick={() => setSelected(event)}
              className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
            >
              {event.distance_meters ? `${Math.round(event.distance_meters)}m` : "View"}
            </button>
          </Marker>
        ))}

        {selected ? (
          <Popup latitude={selected.location_point.lat} longitude={selected.location_point.lng} onClose={() => setSelected(null)} closeButton>
            <div className="space-y-2 p-1">
              <Badge>{selected.category}</Badge>
              <p className="font-semibold">{selected.title}</p>
              <p className="text-xs text-muted-foreground">{selected.approx_area_label}</p>
              <p className="text-xs">{formatDate(selected.start_at)}</p>
              <p className="text-xs">{formatCurrency(selected.amount, selected.currency)}</p>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
