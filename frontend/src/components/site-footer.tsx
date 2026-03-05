"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="border-t border-[#e8e8ec] bg-white px-6 py-6 text-xs text-slate-500 dark:border-white/10 dark:bg-[#0f0f15] dark:text-slate-400 md:px-10 lg:px-16">
      <div className="container flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p>(c) 2026 Birthday Experiences - Curated events, birthday support, and protected payouts.</p>
        <p>Designed for warm celebrations with rigorous operations.</p>
      </div>
    </footer>
  );
}
