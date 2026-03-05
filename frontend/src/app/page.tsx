"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DM_Sans, Fraunces } from "next/font/google";

import { useAuth } from "@/features/auth/auth-context";
import { useEventFeed } from "@/features/events/api";
import { useLocationContext } from "@/lib/location-context";
import { formatCurrency } from "@/lib/utils";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "700", "900"],
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const trustItems = [
  { value: "2,400+", label: "Birthdays hosted" },
  { value: "100%", label: "Escrow-protected funds" },
  { value: "4.9★", label: "Average host rating" },
  { value: "12", label: "Cities and growing" },
  { value: "£0", label: "Risk if event doesn't lock" },
];

const heroCards = [
  { emoji: "🍽️", title: "Rooftop Dinner · Shoreditch", meta: "14 guests · £45/head", pill: "Live", pillClass: "from-[#FF5C47] to-[#FF3D6B]" },
  { emoji: "🎨", title: "Art Studio Evening · Brixton", meta: "8 guests · £35/head", pill: "Open", pillClass: "from-[#06D6A0] to-[#00A878]" },
  { emoji: "⛵", title: "Thames Cruise · Central", meta: "20 guests · £75/head", pill: "5 spots", pillClass: "from-[#FFB347] to-[#FF8C42]" },
];

const steps = [
  {
    step: "01",
    title: "Create your birthday page",
    description: "Set up your event in under 10 minutes. Add your venue idea, guest list, and wishlist. Share one link with everyone.",
    circleClass: "border-[rgba(255,92,71,0.2)] bg-[rgba(255,92,71,0.08)] text-[#FF5C47]",
  },
  {
    step: "02",
    title: "Guests commit and contribute",
    description: "Friends RSVP, leave warm messages, and make contributions, all held safely in escrow until your event is confirmed.",
    circleClass: "border-[rgba(255,179,71,0.25)] bg-[rgba(255,179,71,0.1)] text-[#D97706]",
  },
  {
    step: "03",
    title: "Lock and celebrate",
    description: "Once your venue and guest minimum are met, funds release. If not, everyone is automatically refunded. Zero risk.",
    circleClass: "border-[rgba(255,61,107,0.2)] bg-[rgba(255,61,107,0.08)] text-[#FF3D6B]",
  },
];

const hostPerks = [
  { emoji: "🔒", title: "Escrow-protected payments", description: "Guest contributions are held safely until your venue and minimum headcount are both confirmed. No lock means a full refund to everyone." },
  { emoji: "🎁", title: "Birthday wishlist built in", description: "Share exactly what you want. Guests can reserve gifts, leave warm messages, and contribute to group presents in one place." },
  { emoji: "⚡", title: "Under 10 min to set up", description: "Stripe Connect Express onboarding. Be ready to collect contributions before you've even decided on a venue." },
  { emoji: "📍", title: "Discoverable on the feed", description: "Public events appear on the map feed. Invite-only controls let you choose exactly who can request to join." },
];

const testimonials = [
  { before: "Finally, a birthday where I did not have to chase anyone for money or worry about ", emphasis: "who was actually coming.", after: "", name: "Sophia K.", role: "Hosted a rooftop dinner - London", avatar: "S", gradient: "from-[#FF6B9D] to-[#FF4D6A]" },
  { before: "The escrow system gave me total peace of mind. ", emphasis: "Everything just worked.", after: " My guests loved the wishlist feature too.", name: "Marcus T.", role: "Hosted a boat party - Manchester", avatar: "M", gradient: "from-[#A855F7] to-[#7C3AED]" },
  { before: "I was skeptical, but my 30th birthday was ", emphasis: "genuinely the best one I have had.", after: " I will never plan a birthday the old way again.", name: "Amara O.", role: "Attended a studio party - Birmingham", avatar: "A", gradient: "from-[#06D6A0] to-[#00A878]" },
];

const CATEGORY_GRADIENT: Record<string, string> = {
  DINING: "from-[#FF6B9D] via-[#FF4D6A] to-[#FF8C42]",
  NIGHTLIFE: "from-[#A855F7] via-[#7C3AED] to-[#4338CA]",
  WELLNESS: "from-[#06D6A0] via-[#00A878] to-[#0891B2]",
  OUTDOORS: "from-[#FFB347] via-[#FF8C42] to-[#FF5C47]",
  CULTURE: "from-[#3B82F6] via-[#1D4ED8] to-[#6366F1]",
};

function formatDateOnly(date?: string | null) {
  if (!date) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function SectionLabel({ children, centered = false, dark = false }: { children: React.ReactNode; centered?: boolean; dark?: boolean }) {
  return (
    <div className={["inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]", dark ? "text-[#FF7A68]" : "text-[#FF5C47]", centered ? "justify-center" : ""].join(" ")}>
      {centered ? null : <span className={`h-[2px] w-5 rounded-full ${dark ? "bg-[#FF7A68]" : "bg-[#FF5C47]"}`} />}
      <span>{children}</span>
    </div>
  );
}

function LandingFooter() {
  const columns = [
    { heading: "Product", links: [{ href: "/", label: "Overview" }, { href: "/events", label: "Events feed" }, { href: "/connect", label: "Host payouts" }, { href: "/register", label: "Get started" }] },
    { heading: "Account", links: [{ href: "/login", label: "Sign in" }, { href: "/register", label: "Create account" }, { href: "/birthday-profile/new", label: "Birthday profile" }, { href: "/events/new", label: "Create event" }] },
    { heading: "Company", links: [{ href: "/", label: "About" }, { href: "/", label: "Blog" }, { href: "/", label: "Careers" }, { href: "/", label: "Privacy policy" }] },
  ];

  return (
    <footer className="bg-[#150A06] px-6 py-12 text-white md:px-10 lg:px-12">
      <div className="mx-auto grid max-w-[1200px] gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#FF5C47] to-[#FF3D6B] text-[11px] font-semibold text-white shadow-[0_4px_14px_rgba(255,92,71,0.4)]">CE</span>
            <span className={`${display.className} text-[18px] font-bold`}>Birthday Experiences</span>
          </Link>
          <p className={`${bodyFont.className} mt-4 max-w-[240px] text-[13px] leading-6 text-white/40`}>
            Curated birthday experiences, protected payments, and warm guest support.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.heading}>
            <h3 className={`${bodyFont.className} text-[11px] font-bold uppercase tracking-[0.08em] text-white/35`}>{column.heading}</h3>
            <div className="mt-5 space-y-3">
              {column.links.map((link) => (
                <Link key={link.label} href={link.href} className={`${bodyFont.className} block text-[14px] text-white/55 transition hover:text-white`}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={`${bodyFont.className} mx-auto mt-8 flex max-w-[1200px] flex-col gap-2 text-[12px] text-white/25 md:flex-row md:items-center md:justify-between`}>
        <p>(c) 2026 Birthday Experiences. All rights reserved.</p>
        <p>Designed for warm celebrations with rigorous operations.</p>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const { isAuthenticated, isEmailVerified, isPhoneVerified, user } = useAuth();
  const router = useRouter();
  const { coords: feedCoords } = useLocationContext();

  const feedQuery = useEventFeed({ lat: feedCoords.lat, lng: feedCoords.lng, radius: 10000 });
  const liveEvents = (feedQuery.data ?? []).slice(0, 4);

  useEffect(() => {
    if (isAuthenticated && !isEmailVerified) {
      router.replace("/verify-email");
      return;
    }
    if (isAuthenticated && !isPhoneVerified) {
      router.replace("/verify");
      return;
    }
    if (isAuthenticated) {
      router.replace(user?.birthday_profile_slug ? `/birthday/${user.birthday_profile_slug}` : "/birthday-profile/new");
    }
  }, [isAuthenticated, isEmailVerified, isPhoneVerified, user, router]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".landing-reveal, .landing-stagger").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  if (isAuthenticated) {
    return <main className="min-h-[50vh] bg-[#FFF8F3]" />;
  }

  return (
    <>
      <main className={`${bodyFont.className} bg-[#FFF8F3] text-[#1A0F0A]`}>
        <section className="relative isolate flex min-h-screen items-center overflow-hidden bg-[#FFF8F3] px-6 pb-20 pt-[120px] text-center md:px-10 lg:px-12">
          <div className="hero-orb absolute left-[-150px] top-[-150px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,92,71,0.18)_0%,transparent_70%)] blur-[80px]" />
          <div className="hero-orb absolute right-[-100px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,179,71,0.14)_0%,transparent_70%)] blur-[80px]" />
          <div className="hero-orb-reverse absolute bottom-0 left-[40%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,61,107,0.1)_0%,transparent_70%)] blur-[80px]" />

          <div className="relative z-10 mx-auto flex w-full max-w-[820px] flex-col items-center">
            <div className="hero-badge inline-flex w-fit items-center gap-3 rounded-full border border-[rgba(255,92,71,0.12)] bg-white px-4 py-2 shadow-[0_2px_16px_rgba(255,92,71,0.12)]">
              <div className="flex">
                {[
                  { label: "S", className: "from-[#FF6B9D] to-[#FF4D6A]" },
                  { label: "M", className: "from-[#FFB347] to-[#FF8C42]" },
                  { label: "A", className: "from-[#A855F7] to-[#7C3AED]" },
                ].map((avatar, index) => (
                  <span key={avatar.label} className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${avatar.className} text-[11px] font-bold text-white ${index === 0 ? "" : "-ml-2"}`}>{avatar.label}</span>
                ))}
              </div>
              <p className="text-[13px] font-medium text-[#4A2E24]"><span className="font-bold text-[#FF5C47]">2,400+</span> birthdays celebrated this year</p>
            </div>

            <h1 className={`${display.className} mt-9 max-w-[820px] text-[clamp(52px,7vw,96px)] font-black leading-[0.96] tracking-[-0.04em] text-[#1A0F0A]`}>
              Your birthday,
              <br />
              <em className="bg-[linear-gradient(120deg,#FF5C47_0%,#FF3D6B_50%,#FFB347_100%)] bg-clip-text font-light italic text-transparent">done right.</em>
            </h1>

            <p className="mt-7 max-w-[520px] text-[18px] font-light leading-[1.7] text-[#9A7A70]">Curated experiences, protected payments, and warm guest support, all in one place built for the birthday you actually deserve.</p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF5C47,#FF3D6B)] px-9 py-4 text-[16px] font-semibold text-white shadow-[0_8px_32px_rgba(255,92,71,0.42)] transition hover:-translate-y-[3px] hover:shadow-[0_14px_44px_rgba(255,92,71,0.5)]">Plan my birthday</Link>
              <Link href="/events" className="inline-flex items-center justify-center rounded-full border-[1.5px] border-[rgba(26,15,10,0.12)] bg-white px-8 py-4 text-[16px] font-medium text-[#1A0F0A] shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:border-[#FF5C47] hover:text-[#FF5C47]">Browse events</Link>
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-4">
              {heroCards.map((card, index) => (
                <div key={card.title} className={`hero-card-${index + 1} flex items-center gap-4 rounded-[20px] border border-white/80 bg-white px-5 py-[18px] shadow-[0_8px_32px_rgba(26,15,10,0.1)]`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#FFF2EA] text-xl">{card.emoji}</span>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-[#1A0F0A]">{card.title}</p>
                    <p className="text-[11px] text-[#9A7A70]">{card.meta}</p>
                  </div>
                  <span className={`rounded-full bg-gradient-to-br ${card.pillClass} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-white`}>{card.pill}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#1A0F0A] px-6 py-7 text-white md:px-10 lg:px-12">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-6 lg:gap-10">
            {trustItems.map((item, index) => (
              <div key={item.label} className="flex items-center gap-6">
                <div>
                  <p className={`${display.className} text-[24px] font-bold text-white`}>{item.value}</p>
                  <p className="text-[13px] text-white/50">{item.label}</p>
                </div>
                {index < trustItems.length - 1 ? <span className="hidden h-9 w-px bg-white/10 lg:block" /> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-[120px] md:px-10 lg:px-12">
          <div className="landing-reveal">
            <SectionLabel>How it works</SectionLabel>
            <h2 className={`${display.className} mt-5 max-w-[760px] text-[clamp(34px,4vw,54px)] font-bold leading-[1.1] tracking-[-0.03em]`}>
              Three steps to an <em className="font-light italic text-[#FF5C47]">unforgettable</em> birthday
            </h2>
            <p className="mt-4 max-w-[480px] text-[16px] font-light leading-[1.7] text-[#9A7A70]">No awkward bank transfers, no chasing people for money, no stress. Just a beautiful birthday that comes together effortlessly.</p>
          </div>

          <div className="landing-stagger relative mt-[72px] grid gap-10 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] top-9 hidden border-t-2 border-dashed border-[rgba(255,92,71,0.25)] md:block" />
            {steps.map((step) => (
              <div key={step.title} className="px-2 text-center md:px-8">
                <div className={`relative z-10 mx-auto mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 text-[15px] font-bold tracking-tight ${step.circleClass}`}>{step.step}</div>
                <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#1A0F0A]">{step.title}</h3>
                <p className="mt-3 text-[14px] font-light leading-[1.65] text-[#9A7A70]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Events near you — live data */}
        <section className="mx-auto max-w-[1200px] px-6 pb-[120px] md:px-10 lg:px-12">
          <div className="landing-reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel>Happening now</SectionLabel>
              <h2 className={`${display.className} mt-5 text-[clamp(34px,4vw,54px)] font-bold leading-[1.1] tracking-[-0.03em]`}>
                Events <em className="font-light italic text-[#FF5C47]">near you</em>
              </h2>
            </div>
            <Link href="/events" className="inline-flex w-fit items-center rounded-full border-[1.5px] border-[rgba(255,92,71,0.12)] px-5 py-2.5 text-[14px] font-medium text-[#4A2E24] transition hover:border-[#FF5C47] hover:text-[#FF5C47]">See all events {"->"}</Link>
          </div>

          <div className="mt-12">
            {feedQuery.isLoading && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-[24px] bg-[#f0ebe5]">
                    <div className="h-[190px] bg-[#e0d9d2]" />
                    <div className="space-y-3 p-[22px]">
                      <div className="h-3 w-1/3 rounded-full bg-[#e0d9d2]" />
                      <div className="h-4 w-3/4 rounded-full bg-[#e0d9d2]" />
                      <div className="h-3 w-1/2 rounded-full bg-[#e0d9d2]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!feedQuery.isLoading && liveEvents.length === 0 && (
              <div className="rounded-[28px] border border-[rgba(26,15,10,0.06)] bg-white px-10 py-[72px] text-center shadow-[0_4px_20px_rgba(26,15,10,0.06)]">
                <p className="text-5xl opacity-30">🎂</p>
                <p className="mt-5 text-[18px] font-semibold text-[#1A0F0A]">No events near you yet</p>
                <p className="mx-auto mt-2 max-w-[360px] text-[14px] font-light leading-[1.7] text-[#9A7A70]">Be the first to host a birthday experience in your city.</p>
                <Link href="/register" className="mt-7 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF5C47,#FF3D6B)] px-8 py-3 text-[14px] font-semibold text-white shadow-[0_6px_20px_rgba(255,92,71,0.35)] transition hover:-translate-y-0.5">
                  Start hosting
                </Link>
              </div>
            )}

            {!feedQuery.isLoading && liveEvents.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {liveEvents.map((event) => {
                  const gradient = CATEGORY_GRADIENT[event.category] ?? "from-[#FF6B9D] via-[#FF4D6A] to-[#FF8C42]";
                  const spotsLeft = event.max_guests - event.approved_count;
                  const statusLabel = spotsLeft <= 3 ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : event.state === "OPEN" ? "Open" : event.state;

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="overflow-hidden rounded-[24px] border border-[rgba(26,15,10,0.06)] bg-white shadow-[0_4px_24px_rgba(26,15,10,0.07)] transition hover:-translate-y-[5px] hover:shadow-[0_16px_48px_rgba(26,15,10,0.13)]"
                    >
                      <div className={`flex h-[190px] items-center justify-center bg-gradient-to-br ${gradient}`}>
                        <span className="rounded-[18px] border border-white/15 bg-white/10 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                          {event.category.slice(0, 2)}
                        </span>
                      </div>
                      <div className="p-[30px]">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[rgba(255,92,71,0.1)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#FF5C47]">{event.category}</span>
                        </div>
                        <h3 className={`${display.className} mt-4 text-[16px] font-bold tracking-[-0.02em] text-[#1A0F0A] md:text-[18px]`}>{event.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#9A7A70]">
                          {[formatDateOnly(event.start_at), event.approx_area_label, event.amount ? `${formatCurrency(event.amount, event.currency)}/head` : "Free"].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              {i > 0 ? <span className="h-[3px] w-[3px] rounded-full bg-[#9A7A70]" /> : null}
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <span className="text-[12px] text-[#9A7A70]">{event.approved_count} attending</span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#FF5C47]">
                            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#FF5C47]" />
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#150A06] px-6 py-[120px] text-white md:px-10 lg:px-12">
          <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,92,71,0.14)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute bottom-[-80px] left-[10%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(255,179,71,0.08)_0%,transparent_70%)]" />

          <div className="landing-reveal relative z-10 mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <SectionLabel dark>For birthday hosts</SectionLabel>
              <h2 className={`${display.className} mt-5 max-w-[580px] text-[clamp(36px,4vw,56px)] font-bold leading-[1.1] tracking-[-0.03em] text-white`}>
                Host the birthday <em className="font-light italic text-[#FF7A68]">you've always wanted</em>
              </h2>
              <p className="mt-5 max-w-[520px] text-[16px] font-light leading-[1.7] text-white/45">No chasing bank transfers. No awkward group chats. Just a beautiful page, a trusted payment system, and people who actually show up.</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF5C47,#FF3D6B)] px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_24px_rgba(255,92,71,0.4)] transition hover:-translate-y-0.5">Start hosting free</Link>
                <Link href="/connect" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-[15px] font-medium text-white transition hover:bg-white/10">See how payouts work</Link>
              </div>
            </div>

            <div className="landing-stagger space-y-4">
              {hostPerks.map((perk) => (
                <div key={perk.title} className="flex gap-4 rounded-[18px] border border-white/10 bg-white/[0.04] px-6 py-6 transition hover:border-[rgba(255,92,71,0.2)] hover:bg-white/[0.07]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(255,92,71,0.2),rgba(255,61,107,0.1))] text-xl">{perk.emoji}</span>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-white">{perk.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-white/45">{perk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#FFF2EA] px-6 py-[120px] md:px-10 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            <div className="landing-reveal text-center">
              <SectionLabel centered>From the community</SectionLabel>
              <h2 className={`${display.className} mt-5 text-[clamp(34px,4vw,54px)] font-bold leading-[1.1] tracking-[-0.03em]`}>
                People who celebrated <em className="font-light italic text-[#FF5C47]">differently</em>
              </h2>
            </div>

            <div className="landing-stagger mt-16 grid gap-5 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <article key={testimonial.name} className="rounded-[24px] border border-[rgba(26,15,10,0.06)] bg-white p-8 shadow-[0_4px_20px_rgba(26,15,10,0.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,15,10,0.1)]">
                  <p className="text-[14px] tracking-[2px] text-[#FFB347]">5/5</p>
                  <p className={`${display.className} mt-5 text-[18px] font-bold leading-[1.4] tracking-[-0.02em] text-[#1A0F0A]`}>
                    &ldquo;{testimonial.before}<em className="font-light italic text-[#FF5C47]">{testimonial.emphasis}</em>{testimonial.after}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.gradient} text-[14px] font-bold text-white`}>{testimonial.avatar}</span>
                    <div>
                      <p className="text-[14px] font-semibold text-[#1A0F0A]">{testimonial.name}</p>
                      <p className="text-[12px] text-[#9A7A70]">{testimonial.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-reveal relative overflow-hidden bg-[#FFF8F3] px-6 py-[120px] text-center md:px-10 lg:px-12">
          <div className="pointer-events-none absolute left-[10%] top-[10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,179,71,0.1)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,92,71,0.1)_0%,transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[860px]">
            <span className="emoji-pop inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/70 text-[14px] font-bold uppercase tracking-[0.12em] text-[#FF5C47] shadow-[0_8px_24px_rgba(255,92,71,0.18)]">GO</span>
            <h2 className={`${display.className} mt-8 text-[clamp(40px,6vw,80px)] font-black leading-[1] tracking-[-0.04em]`}>
              Your next birthday
              <br />
              <em className="bg-[linear-gradient(120deg,#FF5C47_0%,#FF3D6B_50%,#FFB347_100%)] bg-clip-text font-light italic text-transparent">starts here.</em>
            </h2>
            <p className="mx-auto mt-6 max-w-[440px] text-[17px] font-light leading-[1.7] text-[#9A7A70]">Join thousands of people who stopped settling for average birthdays. It is free to start.</p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF5C47,#FF3D6B)] px-11 py-[17px] text-[17px] font-bold text-white shadow-[0_10px_40px_rgba(255,92,71,0.45)] transition hover:-translate-y-[3px] hover:shadow-[0_16px_52px_rgba(255,92,71,0.5)]">Plan my birthday - it&apos;s free</Link>
              <Link href="/events" className="inline-flex items-center justify-center rounded-full border-[1.5px] border-[rgba(26,15,10,0.12)] bg-white px-9 py-[17px] text-[17px] font-medium text-[#1A0F0A] transition hover:border-[#FF5C47] hover:text-[#FF5C47]">Browse events first</Link>
            </div>
            <p className="mt-8 text-[13px] text-[#9A7A70]">No credit card needed - <span className="font-bold text-[#FF5C47]">100% refund</span> if event doesn&apos;t lock</p>
          </div>
        </section>
      </main>

      <LandingFooter />

      <style jsx global>{`
        .landing-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
        .landing-reveal.in { opacity: 1; transform: none; }
        .landing-stagger > * { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .landing-stagger.in > *:nth-child(1) { opacity: 1; transform: none; transition-delay: 0s; }
        .landing-stagger.in > *:nth-child(2) { opacity: 1; transform: none; transition-delay: 0.1s; }
        .landing-stagger.in > *:nth-child(3) { opacity: 1; transform: none; transition-delay: 0.2s; }
        .landing-stagger.in > *:nth-child(4) { opacity: 1; transform: none; transition-delay: 0.3s; }
        .hero-orb { animation: orbDrift 12s ease-in-out infinite; }
        .hero-orb-reverse { animation: orbDrift 18s ease-in-out infinite reverse; }
        .hero-badge { animation: popIn 0.6s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .hero-card-1 { animation: cardFloat 5s ease-in-out infinite 0.5s; }
        .hero-card-2 { animation: cardFloatReverse 5s ease-in-out infinite 1s; }
        .hero-card-3 { animation: cardFloat 5s ease-in-out infinite 1.5s; }
        .pulse-dot { animation: pulseDot 2s infinite; }
        .emoji-pop { animation: emojiPop 2s ease-in-out infinite; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.6); } }
        @keyframes orbDrift { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, -30px) scale(1.05); } 66% { transform: translate(-20px, 40px) scale(0.95); } }
        @keyframes cardFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes cardFloatReverse { 0%, 100% { transform: translateY(-4px); } 50% { transform: translateY(4px); } }
        @keyframes emojiPop { 0%, 100% { transform: scale(1) rotate(-5deg); } 50% { transform: scale(1.1) rotate(5deg); } }
      `}</style>
    </>
  );
}
