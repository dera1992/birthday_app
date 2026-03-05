"use client";

import { createContext, useContext, useState } from "react";
import { CITY_PRESETS } from "@/lib/geo";

const DEFAULT = CITY_PRESETS[0];

type LocationCoords = { lat: number; lng: number; label: string };

type LocationCtx = {
  coords: LocationCoords;
  setCoords: (coords: LocationCoords) => void;
};

const LocationContext = createContext<LocationCtx>({
  coords: { lat: DEFAULT.lat, lng: DEFAULT.lng, label: DEFAULT.label },
  setCoords: () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<LocationCoords>({
    lat: DEFAULT.lat,
    lng: DEFAULT.lng,
    label: DEFAULT.label,
  });
  return (
    <LocationContext.Provider value={{ coords, setCoords }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
}
