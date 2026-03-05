export const CITY_PRESETS = [
  { label: "London", lat: 51.5072, lng: -0.1276 },
  { label: "Manchester", lat: 53.4808, lng: -2.2426 },
  { label: "Birmingham", lat: 52.4862, lng: -1.8904 },
];

export type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

const NOMINATIM_HEADERS = {
  "Accept-Language": "en",
  "User-Agent": "BirthdayExperiences/1.0 (contact@birthdayexperiences.co.uk)",
};

export async function searchPlaces(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return "Current location";
    const data = await res.json();
    const a = data.address ?? {};
    const parts = [
      a.suburb ?? a.neighbourhood,
      a.city ?? a.town ?? a.village,
      a.country,
    ].filter(Boolean);
    return parts.slice(0, 2).join(", ") || data.display_name?.split(",")[0] || "Current location";
  } catch {
    return "Current location";
  }
}

export async function getBrowserCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => reject(new Error("Location permission denied.")),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}
