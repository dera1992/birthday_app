"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CreditCard, Gift, LayoutDashboard, MapPinned, Settings, Sparkles, Store, Wallet } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useConnectStatus } from "@/features/connect/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const connectStatus = useConnectStatus(Boolean(user?.id));
  const payoutsEnabled = connectStatus.data?.connect_account?.payouts_enabled;
  const isOverview = pathname === "/";
  const nav = [
    { href: "/events", label: "Feed", icon: MapPinned },
    { href: "/events/mine", label: "My Events", icon: LayoutDashboard },
    {
      href: user?.birthday_profile_slug ? `/birthday-profile/${user.birthday_profile_slug}/edit` : "/birthday-profile/new",
      label: "Birthday Profile",
      icon: Gift,
    },
    { href: "/events/new", label: "Create Event", icon: Sparkles },
    { href: "/wishlist", label: "Wishlist", icon: ClipboardList },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/connect", label: "Payouts", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(user?.is_staff ? [{ href: "/venues", label: "Venues", icon: Store }] : []),
  ];
  const activeHref =
    nav
      .filter((item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)))
      .sort((left, right) => right.href.length - left.href.length)[0]?.href ?? null;

  return (
    <div className="container py-8">
      {!isOverview && !payoutsEnabled && (
        <div className="mb-6 flex items-center justify-between rounded-[28px] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-800 dark:text-amber-200">
          <div>
            <p className="font-semibold">Payout setup required</p>
            <p className="text-amber-700/90 dark:text-amber-100/80">Paid events cannot be locked until Stripe Connect payouts are enabled.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/connect">Finish setup</Link>
          </Button>
        </div>
      )}

      {isOverview ? <main>{children}</main> : null}

      {!isOverview ? (
        <>
      <div className="mb-5 flex gap-3 overflow-x-auto pb-2 lg:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-primary/25 bg-primary text-primary-foreground shadow-glow"
                  : "border-border/70 bg-background/80 text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="glass-panel panel-tint sticky top-24 hidden h-fit p-4 lg:block">
          <div className="mb-6 flex items-center gap-3 rounded-[22px] bg-secondary/70 p-4">
            <Avatar name={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`} />
            <div>
              <p className="font-semibold">{user?.first_name || "Host"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-6 rounded-3xl bg-gradient-to-br from-rose-500 to-red-500 p-5 text-white">
            <Badge variant="outline" className="border-white/20 text-white">
              Refund guarantee
            </Badge>
            <p className="mt-3 text-lg font-semibold">Held funds stay protected until your venue and guest threshold are confirmed.</p>
          </div>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
        </>
      ) : null}
    </div>
  );
}
