"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="border-t border-[#e8e8ec] bg-white px-6 py-5 text-xs text-slate-500 dark:border-white/10 dark:bg-[#0f0f15] dark:text-slate-400 md:px-10 lg:px-16">
      <div className="container flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>(c) 2026 Birthday Experiences. All rights reserved.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="transition hover:text-slate-800 dark:hover:text-slate-200">About</Link>
          <Link href="/privacy" className="transition hover:text-slate-800 dark:hover:text-slate-200">Privacy policy</Link>
          <Link href="/terms" className="transition hover:text-slate-800 dark:hover:text-slate-200">Terms &amp; conditions</Link>
        </div>
      </div>
    </footer>
  );
}
