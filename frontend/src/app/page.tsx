"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarRange,
  CheckCheck,
  ChevronRight,
  Clock3,
  CreditCard,
  Gift,
  Heart,
  Map,
  MapPinned,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/features/auth/auth-context";
import { useConnectStatus } from "@/features/connect/api";
import { useEventFeed } from "@/features/events/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingBlock } from "@/components/ui/state-block";
import { CITY_PRESETS } from "@/lib/geo";
import { getErrorMessage } from "@/lib/api/errors";
import { formatCurrency, formatDate } from "@/lib/utils";

const stats = [
  { label: "Protected escrow", value: "100%", note: "Funds release only after lock." },
  { label: "Guest support", value: "1 link", note: "Wishlist, messages, and contributions." },
  { label: "Host setup", value: "< 10 min", note: "Stripe Connect Express onboarding." },
];

const verificationCards = [
  {
    title: "Phone verification",
    description: "Verified and ready for event applications.",
  },
  {
    title: "Email verification",
    description: "Optional globally, required by some events.",
  },
];

const hostFeatures = [
  {
    icon: Clock3,
    title: "Curated discovery",
    description: "Map-led browsing with radius filters and premium event storytelling.",
  },
  {
    icon: Heart,
    title: "Support ecosystem",
    description: "Wishlist reservations, warm birthday notes, and contribution flows in one place.",
  },
  {
    icon: CreditCard,
    title: "Protected payouts",
    description: "Escrow-style release only after lock conditions are actually satisfied.",
  },
];

export default function HomePage() {
  const { isAuthenticated, isEmailVerified, isPhoneVerified, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectStatus = useConnectStatus(Boolean(isAuthenticated && user?.id));
  const [landingCoords, setLandingCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setLandingCoords({ lat, lng });
      return;
    }

    const cityParam = searchParams.get("city");
    const preset = CITY_PRESETS.find((city) => city.label === cityParam) ?? CITY_PRESETS[0];
    setLandingCoords({ lat: preset.lat, lng: preset.lng });
  }, [searchParams]);

  const landingFeedQuery = useEventFeed({
    lat: landingCoords?.lat,
    lng: landingCoords?.lng,
    radius: 8000,
  });
  const nearbyLandingEvents = (landingFeedQuery.data ?? []).slice(0, 4);

  useEffect(() => {
    if (isAuthenticated && !isEmailVerified) {
      router.replace("/verify-email");
      return;
    }
    if (isAuthenticated && !isPhoneVerified) {
      router.replace("/verify");
    }
  }, [isAuthenticated, isEmailVerified, isPhoneVerified, router]);

  if (isAuthenticated) {
    const birthdayProfileReady = Boolean(user?.birthday_profile_completed);
    const primaryHref = birthdayProfileReady ? "/events/new" : user?.birthday_profile_slug ? `/birthday-profile/${user.birthday_profile_slug}/edit` : "/birthday-profile/new";
    const primaryLabel = birthdayProfileReady ? "Create event" : "Complete birthday profile";
    const payoutsReady = Boolean(connectStatus.data?.connect_account?.payouts_enabled);
    const firstName = user?.first_name || "Host";
    return (
      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-[#f9f7f5] text-slate-950 shadow-[0_18px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f0f15] dark:text-white">
        <section className="relative grid min-h-[calc(100vh-9rem)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,41,74,0.12),transparent_38%),radial-gradient(circle_at_top_right,rgba(255,135,155,0.14),transparent_32%),radial-gradient(circle_at_bottom_center,rgba(232,41,74,0.06),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(232,41,74,0.18),transparent_36%),radial-gradient(circle_at_top_right,rgba(255,135,155,0.12),transparent_30%),radial-gradient(circle_at_bottom_center,rgba(232,41,74,0.12),transparent_28%)]" />
          <div className="relative z-10 flex items-center px-6 py-16 md:px-10 lg:px-16 lg:py-[72px]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(232,41,74,0.12)] animate-pulse" />
                Dashboard
              </div>
              <h1 className="mt-8 max-w-[6.8ch] font-display text-[52px] font-extrabold leading-[0.92] tracking-[-0.05em] md:text-[68px]">
                Keep your
                <br />
                birthday plans
                <br />
                <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">ready.</span>
              </h1>
              <p className="mt-6 max-w-[420px] text-base leading-7 text-slate-600 dark:text-slate-300">
                Welcome back, <span className="font-semibold text-slate-900 dark:text-white">{firstName}</span>. Manage event approvals, lock criteria,
                and birthday support from one place.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-6 shadow-[0_10px_30px_rgba(232,41,74,0.35)]">
                  <Link href={primaryHref}>
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-border/70 bg-white px-6 shadow-sm dark:bg-white/5">
                  <Link href="/events">Open feed</Link>
                </Button>
              </div>
              <Link
                href="/connect"
                className="mt-12 inline-flex w-fit items-center gap-4 rounded-full border border-border/70 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </span>
                <span className="text-left">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">Payout readiness</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Connect required before first paid event</span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </div>

          <div className="relative z-10 flex flex-col justify-center gap-4 bg-[#111118] px-6 py-12 text-white md:px-10 lg:px-10 lg:py-16">
            <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.25 }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Account status</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.32 }}
              className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/5 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{firstName}</p>
                  <p className="text-xs text-white/45">{birthdayProfileReady ? "Profile ready" : "Profile incomplete"}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${birthdayProfileReady ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border border-amber-400/30 bg-amber-400/10 text-amber-300"}`}>
                {birthdayProfileReady ? "Ready" : "Action needed"}
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.39 }}
              className="overflow-hidden rounded-[24px] bg-primary p-7"
            >
              <h2 className="text-lg font-bold tracking-tight">Refund guarantee</h2>
              <p className="mt-3 text-sm leading-6 text-white/80">
                If venue confirmation or minimum guests are not met before lock, the backend auto-cancels and refunds all held escrow to guests.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.46 }}
              className="grid grid-cols-3 gap-3"
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-5 text-center">
                  <p className={`font-display text-[30px] font-extrabold tracking-[-0.05em] ${index === 0 ? "text-rose-300" : "text-white"}`}>{stat.value}</p>
                  <p className="mt-2 text-[11px] leading-4 text-white/40">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <div className="bg-white px-6 py-16 dark:bg-[#0f0f15] md:px-10 lg:px-16 lg:py-20">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="mb-16"
          >
            <div>
              <div className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                <span className="h-0.5 w-4 rounded-full bg-primary" />
                Ready to apply
              </div>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em] md:text-4xl">Account verification</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Verify your details so you can apply instantly when you find the right celebration.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {verificationCards.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="rounded-[22px] border border-border/70 bg-[#fcfbfa] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                      <CheckCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-[-0.02em]">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.45 }}>
              <div className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                <span className="h-0.5 w-4 rounded-full bg-primary" />
                Built for birthday hosts
              </div>
              <h2 className="mt-4 max-w-xl font-display text-3xl font-extrabold tracking-[-0.04em] md:text-4xl">
                Beautiful planning deserves payment safety and guest warmth.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Launch your birthday page, curate experience-led events, and keep every guest payment protected until your venue and threshold are truly ready.
              </p>
              <div className="mt-8">
                {hostFeatures.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.38, delay: index * 0.07 }}
                      className="flex gap-4 border-b border-border/70 py-6 last:border-b-0 dark:border-white/10"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold tracking-[-0.02em]">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="space-y-4 lg:sticky lg:top-24"
            >
              <div className="overflow-hidden rounded-[28px] bg-[#111118] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">
                  <Shield className="h-4 w-4" />
                  Refund Guarantee
                </div>
                <h3 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em]">
                  If the celebration does not lock, <span className="text-rose-300">held payments do not drift.</span>
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/55">
                  Pre-lock funds stay protected until venue confirmation and guest minimums are met. This is enforced backend flow, not a promise.
                </p>
              </div>

              <div className="rounded-[24px] border border-border/70 bg-[#fcfbfa] p-7 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h3 className="text-xl font-bold tracking-[-0.03em]">Start hosting your birthday</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  Stripe Connect Express onboarding takes under 10 minutes. Be ready to collect before the cake is ordered.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild className="rounded-full px-5">
                    <Link href={primaryHref}>
                      {primaryLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/pricing">See plans</Link>
                  </Button>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {payoutsReady ? "Connect payouts are already enabled." : "Connect payouts still need to be enabled before your first paid lock."}
                </div>
              </div>
            </motion.div>
          </section>
        </div>

      </div>
    );
  }

  return (
    <main>
      <section className="relative grid min-h-screen overflow-hidden bg-[#F9F7F5] lg:grid-cols-[minmax(0,1fr)_440px] dark:bg-[#0f0f15]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_650px_550px_at_-8%_55%,rgba(232,41,74,0.07)_0%,transparent_65%),radial-gradient(ellipse_450px_450px_at_108%_5%,rgba(255,160,170,0.11)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_650px_550px_at_-8%_55%,rgba(232,41,74,0.14)_0%,transparent_65%),radial-gradient(ellipse_450px_450px_at_108%_5%,rgba(255,160,170,0.1)_0%,transparent_60%)]" />

        <div className="relative z-10 flex flex-col justify-center px-6 pb-16 pt-[92px] md:px-10 lg:px-16 lg:pb-20 lg:pt-[80px] xl:pl-[72px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#7A7A8C] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/5 dark:text-white/55">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Birthday Experiences · Support
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mt-7 max-w-[540px] font-display text-[42px] font-extrabold leading-[1.06] tracking-[-0.04em] text-[#111118] md:text-[58px] dark:text-white"
          >
            A premium birthday platform for curated events, protected payments, and guest support.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mt-5 max-w-[420px] text-base leading-7 text-[#7A7A8C] dark:text-white/45"
          >
            Launch invite-led birthday experiences, collect support beautifully, and keep every payment protected until the plan is truly locked.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.24 }} className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-7 text-[15px] font-bold shadow-[0_6px_24px_rgba(232,41,74,0.38)] hover:-translate-y-0.5 hover:bg-[#FF3D5A]">
              <Link href="/register">
                Start hosting
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-black/10 bg-white px-6 text-[15px] font-medium text-[#3D3D4E] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] hover:border-primary/20 hover:text-primary dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white">
              <Link href="/events">Open feed</Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32 }}
            className="mt-12 flex flex-col gap-8 md:flex-row md:items-stretch md:gap-0"
          >
            {stats.map((stat, index) => (
              <div key={stat.label} className="flex items-stretch">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A7A8C] dark:text-white/35">{stat.label}</p>
                  <p className="mt-2 font-display text-[30px] font-extrabold leading-none tracking-[-0.04em] text-[#111118] dark:text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-[#7A7A8C] dark:text-white/38">{stat.note}</p>
                </div>
                {index < stats.length - 1 ? <div className="ml-8 hidden h-full min-h-[48px] w-px bg-black/10 md:block dark:bg-white/10" /> : null}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-col gap-4 overflow-hidden bg-[#111118] px-6 pb-16 pt-[92px] md:px-10 lg:px-11 lg:pb-[72px] lg:pt-[72px]">
          <div className="pointer-events-none absolute -right-[60px] -top-[60px] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,rgba(232,41,74,0.2)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute -bottom-[50px] -left-[40px] h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.3 }} className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">Live operations</span>
            <span className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Refund-safe
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.38 }} className="relative overflow-hidden rounded-[24px] bg-primary p-7">
            <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-white/10" />
            <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.1em] text-white/65">Host board</p>
            <h2 className="relative z-10 mt-3 text-[22px] font-bold tracking-[-0.02em] text-white">{`Rooftop Dinner · 6 approved`}</h2>
            <p className="relative z-10 mt-2 text-[13px] leading-6 text-white/70">Venue pending, escrow held, strangers expansion off.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.46 }} className="flex flex-col gap-3">
            {[
              {
                icon: Heart,
                title: "Protected payouts",
                body: "Venue confirmation and guest thresholds enforced before release.",
              },
              {
                icon: Gift,
                title: "Guest birthday page",
                body: "Collect gifts, notes, and contributions on a public birthday page.",
              },
              {
                icon: ShieldCheck,
                title: "Host trust suite",
                body: "Verification, blocking, reporting, and post-event ratings built in.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:bg-white/10">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-rose-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/45">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.55 }}
        className="bg-[#F9F7F5] px-6 py-20 md:px-10 dark:bg-[#0f0f15]"
      >
        <div className="mx-auto grid max-w-[1160px] gap-5 lg:grid-cols-3">
          {[
            { icon: Users, title: "Guest support", body: "Moderated birthday messages, contribution flows, and reservation-safe wishlists." },
            { icon: Map, title: "Curated feed", body: "Map-led discovery, invite-only expansion controls, and premium event storytelling." },
            { icon: ShieldCheck, title: "Operational trust", body: "Stripe Connect, escrow release on lock, and auto-cancel deadline enforcement." },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                className="rounded-[24px] border border-black/10 bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_4px_8px_rgba(0,0,0,0.04),0_16px_48px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-[#111118] dark:text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#7A7A8C] dark:text-slate-300">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.55 }}
        className="bg-[#F9F7F5] px-6 pb-20 md:px-10 dark:bg-[#0f0f15]"
      >
        <div className="mx-auto max-w-[1160px]">
          <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-primary">Nearby events</div>
          <h2 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#111118] md:text-[44px] dark:text-white">
            See what is happening around you
          </h2>
          <p className="mt-3 max-w-[520px] text-[15px] leading-7 text-[#7A7A8C] dark:text-white/45">
            Public birthday events in your area appear here first. Open one to review the host, the plan, and contribution expectations before you show interest.
          </p>

          {landingFeedQuery.isLoading ? <LoadingBlock message="Loading nearby birthday events..." className="mt-10 min-h-[240px]" /> : null}
          {landingFeedQuery.error ? (
            <ErrorState
              description={getErrorMessage(landingFeedQuery.error, "Unable to load nearby events right now.")}
              className="mt-10 min-h-[240px]"
            />
          ) : null}
          {!landingFeedQuery.isLoading && !landingFeedQuery.error && nearbyLandingEvents.length > 0 ? (
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {nearbyLandingEvents.map((event) => (
                <Card key={event.id} className="rounded-[24px] border border-black/10 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/5">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{event.category}</Badge>
                      <Badge variant="outline">{event.distance_meters ? `${Math.round(event.distance_meters)}m away` : event.approx_area_label}</Badge>
                    </div>
                    <CardTitle className="pt-3 text-2xl">{event.title}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{formatDate(event.start_at)}</p>
                      <p>{event.approx_area_label}</p>
                      <p>
                        {event.approved_count}/{event.max_guests} approved
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Per guest</p>
                      <p className="mt-2 font-display text-3xl">{formatCurrency(event.amount, event.currency)}</p>
                    </div>
                    <Button asChild className="w-full rounded-full">
                      <Link href={`/events/${event.id}`}>View event</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
          {!landingFeedQuery.isLoading && !landingFeedQuery.error && nearbyLandingEvents.length === 0 ? (
            <div className="mt-10 rounded-[32px] border border-black/10 bg-white px-10 py-[72px] text-center shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/5">
              <div className="text-5xl opacity-30">🎂</div>
              <p className="mt-5 text-lg font-semibold text-[#111118] dark:text-white">No nearby events yet</p>
              <p className="mx-auto mt-2 max-w-[360px] text-sm leading-7 text-[#7A7A8C] dark:text-white/45">
                Switch city fallback or explore the full event feed once hosts in your area start publishing.
              </p>
              <Button asChild variant="outline" className="mt-7 rounded-full border-black/10 bg-white px-6 text-[#3D3D4E] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] hover:border-primary/20 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/25 dark:hover:bg-white/10 dark:hover:text-white">
                <Link href="/events">Open full feed</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.55 }}
        className="relative overflow-hidden bg-[#111118] py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_700px_500px_at_80%_50%,rgba(232,41,74,0.1)_0%,transparent_70%),radial-gradient(ellipse_400px_400px_at_10%_80%,rgba(255,107,107,0.07)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto grid max-w-[1160px] gap-16 px-6 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <div className="mb-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-white/50">
                Built for modern birthday hosts
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-white/50">
                Celebration-first
              </span>
            </div>
            <h2 className="max-w-[480px] font-display text-[32px] font-extrabold leading-[1.15] tracking-[-0.03em] text-white md:text-[42px]">
              Beautiful birthday planning deserves payment safety, guest warmth, and operational clarity.
            </h2>
            <p className="mt-5 max-w-[440px] text-[15px] leading-8 text-white/50">
              Launch a premium birthday page, curate experience-led events, and keep every guest payment protected until your venue and guest threshold are truly ready.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-white px-7 text-[15px] font-bold text-[#111118] shadow-[0_6px_24px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:bg-white">
                <Link href="/register">Start hosting</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-transparent px-6 text-[15px] font-medium text-white hover:border-white/50 hover:bg-transparent">
                <Link href="/pricing">See plans</Link>
              </Button>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: MapPinned,
                  title: "Curated discovery",
                  body: "Map-led browsing with radius filters and premium event storytelling.",
                },
                {
                  icon: Heart,
                  title: "Support ecosystem",
                  body: "Wishlist reservations, warm birthday notes, and contribution flows.",
                },
                {
                  icon: CreditCard,
                  title: "Protected payouts",
                  body: "Escrow-style release only after lock conditions are satisfied.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/5 text-white/50">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-xs leading-6 text-white/40">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-9">
              <div className="absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(232,41,74,0.2)_0%,transparent_70%)]" />
              <div className="relative z-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">
                <CalendarRange className="h-3.5 w-3.5" />
                Refund Guarantee
              </div>
              <h3 className="relative z-10 mt-4 font-display text-3xl font-extrabold leading-[1.25] tracking-[-0.03em] text-white">
                If the celebration does not lock properly, held payments <span className="text-rose-400">do not drift.</span>
              </h3>
              <p className="relative z-10 mt-4 text-sm leading-7 text-white/40">
                Pre-lock funds remain protected until venue confirmation and guest minimums are met. That is not marketing copy; it is an enforced backend flow.
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
