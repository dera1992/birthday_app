"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, CalendarDays, CalendarHeart, ChevronDown, LayoutDashboard, LogOut, MapPin, Moon, PartyPopper, Search, Settings, Wallet } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/features/auth/auth-context";
import { CITY_PRESETS, getBrowserCoordinates, searchPlaces } from "@/lib/geo";
import { useLocationContext } from "@/lib/location-context";

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "Account";
  const initials = (user?.first_name?.[0] ?? user?.email?.[0] ?? "A").toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[34px] items-center gap-2 rounded-full border border-black/10 bg-white pl-1 pr-3 text-[13px] font-medium text-[#3D3D4E] shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition hover:bg-[#f9f7f5] dark:border-white/10 dark:bg-[#17171f] dark:text-slate-200 dark:hover:bg-white/5"
      >
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
          {initials}
        </span>
        <span className="max-w-[90px] truncate">{user?.first_name || "Account"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-[#7A7A8C]" />
      </button>

      {open && (
        <div className="absolute right-0 top-[42px] z-50 w-56 overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#17171f]">
          <div className="border-b border-black/6 px-4 py-3 dark:border-white/8">
            <p className="text-[13px] font-semibold text-[#111118] dark:text-white">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-[#7A7A8C]">{user?.email}</p>
          </div>

          <div className="p-1.5">
            {[
              { href: "/", label: "Dashboard", icon: LayoutDashboard },
              { href: "/events", label: "Events feed", icon: CalendarDays },
              { href: "/events/mine", label: "My events", icon: CalendarCheck },
              { href: "/wallet", label: "Wallet", icon: Wallet },
              { href: "/settings", label: "Settings", icon: Settings },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-[#3D3D4E] transition hover:bg-[#f9f7f5] dark:text-slate-300 dark:hover:bg-white/6"
              >
                <Icon className="h-4 w-4 text-[#7A7A8C]" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-black/6 p-1.5 dark:border-white/8">
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState(CITY_PRESETS[0].label);
  const [locationInput, setLocationInput] = useState(CITY_PRESETS[0].label);
  const { setCoords } = useLocationContext();
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ label: string; city: string; lat?: number; lng?: number }>>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const locationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname === "/events") {
      setSearch(searchParams.get("q") ?? "");
      const city = searchParams.get("city");
      const cityLabel = city && CITY_PRESETS.some((option) => option.label === city) ? city : CITY_PRESETS[0].label;
      setSelectedCity(cityLabel);
      setLocationInput(cityLabel);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!showLocationSuggestions) return;
    function handleClickOutside(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLocationSuggestions]);

  useEffect(() => {
    getBrowserCoordinates()
      .then(({ lat, lng }) => {
        // Find nearest city preset label for the dropdown
        let nearest = CITY_PRESETS[0];
        let minDist = Infinity;
        for (const preset of CITY_PRESETS) {
          const dist = Math.hypot(lat - preset.lat, lng - preset.lng);
          if (dist < minDist) { minDist = dist; nearest = preset; }
        }
        setSelectedCity(nearest.label);
        setLocationInput(nearest.label);
        setCoords({ lat, lng, label: nearest.label });
      })
      .catch(() => {/* permission denied — keep default */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLocationInputChange(value: string) {
    setLocationInput(value);
    setShowLocationSuggestions(true);
    const presetSuggestions = CITY_PRESETS
      .filter((p) => p.label.toLowerCase().includes(value.toLowerCase()))
      .map((p) => ({ label: p.label, city: p.label, lat: p.lat, lng: p.lng }));
    setLocationSuggestions(presetSuggestions);
    if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    if (value.trim().length >= 2) {
      locationTimerRef.current = setTimeout(async () => {
        const results = await searchPlaces(value);
        const extra = results
          .map((r) => {
            const city = r.address?.city ?? r.address?.town ?? r.address?.village ?? "";
            if (!city) return null;
            const label = [r.address?.suburb ?? r.address?.neighbourhood, city].filter(Boolean).join(", ");
            return { label, city, lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
          })
          .filter(Boolean) as Array<{ label: string; city: string; lat: number; lng: number }>;
        const seen = new Set(presetSuggestions.map((p) => p.city.toLowerCase()));
        const deduped = extra.filter((s) => !seen.has(s.city.toLowerCase()));
        setLocationSuggestions([...presetSuggestions, ...deduped.slice(0, 4)]);
      }, 400);
    }
  }

  function handlePickLocation(suggestion: { label: string; city: string; lat?: number; lng?: number }) {
    setLocationInput(suggestion.label);
    setSelectedCity(suggestion.city);
    setShowLocationSuggestions(false);
    if (suggestion.lat != null && suggestion.lng != null) {
      setCoords({ lat: suggestion.lat, lng: suggestion.lng, label: suggestion.label });
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = search.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    params.set("city", selectedCity);
    router.push(params.toString() ? `/events?${params.toString()}` : "/events");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[rgba(249,247,245,0.88)] backdrop-blur-[20px] dark:border-white/10 dark:bg-[rgba(17,17,24,0.88)]">
      <div className="container flex h-[60px] items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-[9px] text-[14px] font-bold tracking-[-0.02em]">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary text-white shadow-[0_2px_8px_rgba(232,41,74,0.35)]">
            <PartyPopper className="h-4 w-4" />
          </span>
          <span>Birthday Experiences</span>
        </Link>

        <form onSubmit={handleSearchSubmit} className="hidden flex-1 justify-center md:flex">
          <label className="sr-only" htmlFor="site-search">
            Search events
          </label>
          <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[#17171f]">
            <div className="relative flex items-center rounded-full px-[14px] py-[6px]">
              <Search className="pointer-events-none absolute left-[14px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#7A7A8C]" />
              <Input
                id="site-search"
                type="search"
                placeholder="Search events..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-auto w-[160px] rounded-none border-0 bg-transparent px-0 py-0 pl-[22px] pr-0 text-[13px] text-[#111118] shadow-none placeholder:text-[#7A7A8C] focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white"
              />
            </div>
            <div className="h-5 w-px bg-black/10 dark:bg-white/10" />
            <div className="relative flex items-center gap-[6px] rounded-full px-3 py-[6px]" ref={locationRef}>
              <MapPin className="h-[14px] w-[14px] shrink-0 text-[#7A7A8C]" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onFocus={() => setShowLocationSuggestions(true)}
                placeholder="Location"
                className="w-[110px] border-0 bg-transparent text-[13px] text-[#3D3D4E] outline-none placeholder:text-[#7A7A8C] dark:text-slate-200"
              />
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute left-0 top-full mt-2 z-50 min-w-[180px] overflow-hidden rounded-[14px] border border-black/8 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#17171f]">
                  {locationSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handlePickLocation(s as { label: string; city: string; lat?: number; lng?: number }); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-[#3D3D4E] hover:bg-[#f9f7f5] dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#7A7A8C]" />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" size="icon" className="h-8 w-8 rounded-full bg-primary text-white shadow-none hover:bg-[#FF4D6A]">
              <Search className="h-[14px] w-[14px]" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <ThemeToggle
            className="h-[34px] w-[34px] rounded-full border-black/10 bg-white text-[#7A7A8C] hover:bg-[#f9f7f5] dark:border-white/10 dark:bg-[#17171f] dark:text-slate-300 dark:hover:bg-white/10"
            iconClassName="h-[15px] w-[15px]"
            LightIcon={Moon}
          />
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Button
                variant="outline"
                asChild
                className="h-[34px] rounded-full border-black/10 bg-transparent px-4 text-[13px] font-medium text-[#3D3D4E] hover:bg-white dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="h-[34px] rounded-full px-4 text-[13px] font-medium">
                <Link href="/register">
                  <CalendarHeart className="h-4 w-4" />
                  Join free
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="container pb-3 md:hidden">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[#17171f]">
            <div className="relative min-w-0 flex-1 px-[14px] py-[6px]">
              <Search className="pointer-events-none absolute left-[14px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#7A7A8C]" />
              <Input
                type="search"
                placeholder="Search events..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-auto rounded-none border-0 bg-transparent px-0 py-0 pl-[22px] text-[13px] text-[#111118] shadow-none placeholder:text-[#7A7A8C] focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white"
              />
            </div>
            <Button type="submit" size="icon" className="h-8 w-8 rounded-full bg-primary text-white shadow-none hover:bg-[#FF4D6A]">
              <Search className="h-[14px] w-[14px]" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </form>
      </div>
    </header>
  );
}
