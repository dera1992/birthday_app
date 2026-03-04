export const CITY_PRESETS = [
  { label: "London", lat: 51.5072, lng: -0.1276 },
  { label: "Manchester", lat: 53.4808, lng: -2.2426 },
  { label: "Birmingham", lat: 52.4862, lng: -1.8904 },
];

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
