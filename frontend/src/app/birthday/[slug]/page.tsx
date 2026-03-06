"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Elements } from "@stripe/react-stripe-js";
import { ArrowRight, Check, CheckCheck, Copy, Gift, Mail, Pencil, Phone, Share2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useBirthdayContributions,
  useBirthdayMessages,
  useBirthdayProfile,
  useSupportContributionIntent,
  useSupportMessageApprove,
  useSupportMessageCreate,
  useSupportMessageReject,
  useUpdateBirthdayProfile,
  useWishlistCancel,
  useWishlistReserve,
} from "@/features/birthday/api";
import { useGiftCatalog, useBirthdayGifts } from "@/features/gifts/queries";
import { useAuth } from "@/features/auth/auth-context";
import { useCreateBlock, useCreateReport } from "@/features/safety/api";
import { StripePaymentForm } from "@/features/payments/components/stripe-payment-form";
import { GiftCategoryPills } from "@/components/gifts/GiftCategoryPills";
import { GiftGrid } from "@/components/gifts/GiftGrid";
import { GiftCustomizeModal } from "@/components/gifts/GiftCustomizeModal";
import { GiftsReceivedWall } from "@/components/gifts/GiftsReceivedWall";
import { SocialLinks } from "@/components/social-links";
import { getErrorMessage } from "@/lib/api/errors";
import { stripePromise } from "@/lib/stripe";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { GiftCategory } from "@/features/gifts/types";
import type { GiftProduct } from "@/features/gifts/types";
import {
  supportContributionSchema,
  supportMessageSchema,
  wishlistReserveSchema,
} from "@/lib/validators/birthday";

// ── Tab definition ────────────────────────────────────────────────────────────

type TabId = "wishlist" | "messages" | "gifts" | "contribute";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "wishlist", label: "Wishlist", emoji: "🎀" },
  { id: "messages", label: "Messages", emoji: "💬" },
  { id: "gifts", label: "Digital Gifts", emoji: "🎁" },
  { id: "contribute", label: "Contribute", emoji: "💸" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type MessageValues = z.infer<typeof supportMessageSchema>;
type ContributionValues = z.infer<typeof supportContributionSchema>;
type ReserveValues = z.infer<typeof wishlistReserveSchema>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BirthdayProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { user, isEmailVerified, isPhoneVerified } = useAuth();

  // ── Profile & core queries ─────────────────────────────────────────────────
  const profileQuery = useBirthdayProfile(slug);
  const messagesQuery = useBirthdayMessages(slug);
  const profile = profileQuery.data;
  const isOwner = Boolean(user?.id && profile?.user === user.id);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const reportMutation = useCreateReport();
  const blockMutation = useCreateBlock();
  const messageCreate = useSupportMessageCreate(slug);
  const messageApprove = useSupportMessageApprove(slug);
  const messageReject = useSupportMessageReject(slug);
  const contributionIntent = useSupportContributionIntent(slug);
  const contributionsQuery = useBirthdayContributions(slug, isOwner);

  // ── Gift state ────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<GiftCategory | "ALL">("ALL");
  const giftCatalogQuery = useGiftCatalog(activeCategory === "ALL" ? undefined : activeCategory);
  const birthdayGiftsQuery = useBirthdayGifts(slug);
  const [selectedProduct, setSelectedProduct] = useState<GiftProduct | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>("wishlist");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [contributionError, setContributionError] = useState<string | null>(null);
  const [birthdayLinkCopied, setBirthdayLinkCopied] = useState(false);
  const [showProfileReportForm, setShowProfileReportForm] = useState(false);
  const [profileReportReason, setProfileReportReason] = useState("");
  const [profileReportDetails, setProfileReportDetails] = useState("");

  // ── Forms ─────────────────────────────────────────────────────────────────
  const messageForm = useForm<MessageValues>({
    resolver: zodResolver(supportMessageSchema),
    defaultValues: { sender_name: "", body: "" },
  });
  const contributionForm = useForm<ContributionValues>({
    resolver: zodResolver(supportContributionSchema),
    defaultValues: { amount: "25.00", currency: "GBP", supporter_name: "", supporter_email: "" },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function onMessageSubmit(values: MessageValues) {
    setMessageError(null);
    try {
      await messageCreate.mutateAsync(values);
      toast.success("Support message sent.");
      messageForm.reset();
    } catch (error) {
      setMessageError(getErrorMessage(error, "Unable to send support message."));
    }
  }

  async function onContributionSubmit(values: ContributionValues) {
    setContributionError(null);
    try {
      await contributionIntent.mutateAsync(values);
      toast.success("Contribution payment intent created.");
    } catch (error) {
      setContributionError(getErrorMessage(error, "Unable to create the contribution payment."));
    }
  }

  async function handleMessageModeration(messageId: number, action: "approve" | "reject") {
    try {
      if (action === "approve") {
        await messageApprove.mutateAsync(messageId);
        toast.success("Message approved.");
        return;
      }
      await messageReject.mutateAsync(messageId);
      toast.success("Message rejected.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update message moderation."));
    }
  }

  const elementsOptions = useMemo(
    () => ({
      clientSecret: contributionIntent.data?.client_secret ?? "",
      appearance: { theme: "stripe" } as const,
    }),
    [contributionIntent.data?.client_secret]
  );

  const birthdayShareUrl =
    typeof window === "undefined"
      ? `/birthday/${slug}`
      : `${window.location.origin}/birthday/${slug}`;
  const canShareBirthdayPage = isOwner && profile?.visibility !== "PRIVATE";

  async function handleCopyBirthdayLink() {
    try {
      await navigator.clipboard.writeText(birthdayShareUrl);
      setBirthdayLinkCopied(true);
      toast.success("Birthday page link copied.");
      window.setTimeout(() => setBirthdayLinkCopied(false), 1800);
    } catch {
      toast.error("Unable to copy the birthday page link.");
    }
  }

  async function handleProfileReport() {
    if (!profileReportReason.trim() || !profile?.user) return;
    try {
      await reportMutation.mutateAsync({ reported_user: profile.user, reason: profileReportReason, details: profileReportDetails });
      toast.success("Report submitted. Our team will review it shortly.");
      setShowProfileReportForm(false);
      setProfileReportReason("");
      setProfileReportDetails("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to submit report."));
    }
  }

  async function handleProfileBlock() {
    if (!profile?.user) return;
    try {
      await blockMutation.mutateAsync({ blocked: profile.user });
      toast.success("User blocked. You will no longer see their content.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to block this user."));
    }
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const fullName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "";
  const initials = fullName
    ? fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "🎂";
  const birthdayDisplay = profile
    ? `${String(profile.day).padStart(2, "0")}/${String(profile.month).padStart(2, "0")}`
    : null;

  const metaPills = [
    profile?.occupation,
    profile?.gender ? profile.gender.replaceAll("_", " ") : null,
    profile?.marital_status ? profile.marital_status.replaceAll("_", " ") : null,
  ].filter(Boolean) as string[];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Gift customize modal — rendered in portal */}
      {selectedProduct && (
        <GiftCustomizeModal
          product={selectedProduct}
          slug={slug}
          isOpen={Boolean(selectedProduct)}
          isLoggedIn={Boolean(user)}
          defaultBuyerName={user ? `${user.first_name} ${user.last_name}`.trim() : ""}
          defaultBuyerEmail={user?.email ?? ""}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <main className="container max-w-5xl py-8 md:py-12">
        <div className={isOwner ? "grid grid-cols-1 gap-6 lg:grid-cols-12" : "space-y-6"}>

          {/* ── Main content (9 cols) ──────────────────────────────────────── */}
          <div className={isOwner ? "space-y-6 lg:col-span-9" : "space-y-6"}>

          {/* ── Profile card ───────────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)]">

            {/* Cover band */}
            <div className="relative h-36 sm:h-48 bg-gradient-to-br from-rose-500 via-rose-400 to-orange-400">
              {/* Decorative orbs */}
              <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-6 bottom-0 h-36 w-36 rounded-full bg-orange-300/20 blur-2xl" />
              <div className="absolute right-1/3 top-1/4 h-20 w-20 rounded-full bg-white/8" />

              {/* Visibility pill */}
              <div className="absolute left-4 top-4">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {profile?.visibility ?? "Birthday page"}
                </span>
              </div>

              {/* Owner actions */}
              {isOwner ? (
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  {canShareBirthdayPage ? (
                    <button
                      type="button"
                      title={birthdayLinkCopied ? "Copied!" : "Copy birthday link"}
                      onClick={handleCopyBirthdayLink}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
                    >
                      {birthdayLinkCopied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : null}
                  <Link
                    href={`/birthday-profile/${slug}/edit`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
                    title="Edit profile"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Identity — avatar overlaps the cover */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                {/* Avatar */}
                <div className="-mt-14 shrink-0 relative z-10">
                  {profile?.profile_image ? (
                    <img
                      src={profile.profile_image}
                      alt={fullName || "Profile photo"}
                      className="h-28 w-28 rounded-full border-4 border-card object-cover shadow-[0_8px_32px_rgba(244,63,94,0.25)]"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-rose-400 to-orange-400 shadow-[0_8px_32px_rgba(244,63,94,0.25)]">
                      <span className="font-display text-3xl text-white">{initials}</span>
                    </div>
                  )}
                </div>

                {/* Quick stats chips */}
                {profile ? (
                  <div className="flex flex-wrap gap-2 sm:pb-1">
                    {birthdayDisplay ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-300">
                        🎂 {birthdayDisplay}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                      🎀 {profile.wishlist_items?.length ?? 0} wishlist {profile.wishlist_items?.length === 1 ? "item" : "items"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                      💬 {messagesQuery.data?.length ?? 0} {messagesQuery.data?.length === 1 ? "message" : "messages"}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Name & meta */}
              <div className="mt-4">
                {fullName ? (
                  <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                    {fullName}
                  </h1>
                ) : (
                  <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-muted-foreground">
                    Birthday Profile
                  </h1>
                )}

                {metaPills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    {metaPills.map((pill, i) => (
                      <span key={pill} className="flex items-center gap-2">
                        {i > 0 && <span className="h-1 w-1 rounded-full bg-border" />}
                        {pill}
                      </span>
                    ))}
                  </div>
                ) : null}

                {profile?.bio ? (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {profile.bio}
                  </p>
                ) : null}
              </div>

              {/* Social links */}
              <SocialLinks
                links={profile?.social_links}
                className="mt-4"
              />

              {/* Shareable URL — owner only */}
              {canShareBirthdayPage ? (
                <button
                  type="button"
                  onClick={handleCopyBirthdayLink}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 px-4 py-2.5 text-left text-xs text-rose-600 transition hover:bg-rose-50 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-400"
                >
                  <span className="truncate">{birthdayShareUrl}</span>
                  <span className="shrink-0 font-medium">
                    {birthdayLinkCopied ? "Copied ✓" : "Copy link"}
                  </span>
                </button>
              ) : null}
            </div>
          </div>

          {/* ── Countdown ─────────────────────────────────────────────────── */}
          {profile?.day && profile?.month ? (
            <BirthdayCountdownSection
              day={profile.day}
              month={profile.month}
              name={profile.first_name || fullName || "them"}
              isOwner={isOwner}
              countdownPublic={Boolean((profile.preferences as Record<string, unknown>)?.countdown_public)}
              slug={slug}
            />
          ) : null}

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 rounded-2xl border border-border bg-muted/40 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-base leading-none">{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Wishlist tab */}
            {activeTab === "wishlist" && (
              <Card className="panel-tint">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>Wishlist</CardTitle>
                      <CardDescription className="mt-1.5">
                        No account needed. Friends can reserve an item once from the shared link, and
                        the backend prevents double reservation.
                      </CardDescription>
                    </div>
                    {isOwner && (
                      <Link
                        href="/wishlist"
                        className="shrink-0 text-xs text-rose-600 underline underline-offset-2 hover:text-rose-700"
                      >
                        Edit wishlist →
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(profile?.wishlist_items ?? []).length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                      No wishlist items yet.
                    </p>
                  ) : (
                    (profile?.wishlist_items ?? []).map((item) => (
                      <WishlistReserveCard key={item.id} item={item} slug={slug} isOwner={isOwner} userEmail={user?.email ?? null} />
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Messages tab */}
            {activeTab === "messages" && (
              <Card className="panel-tint">
                <CardHeader>
                  <CardTitle>Birthday messages</CardTitle>
                  <CardDescription>
                    Leave a note for the birthday person. No account needed — the owner approves what
                    shows publicly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-[20px] border border-border bg-background/60 p-4">
                    <ErrorNotice message={messageError} />
                    <form className="space-y-3" onSubmit={messageForm.handleSubmit(onMessageSubmit)}>
                      <Input placeholder="Your name (optional)" {...messageForm.register("sender_name")} />
                      <Textarea
                        placeholder="Write a birthday note…"
                        className="min-h-[80px] resize-none"
                        {...messageForm.register("body")}
                      />
                      <Button type="submit" className="w-full">
                        Send message
                      </Button>
                    </form>
                  </div>

                  {(messagesQuery.data ?? []).length > 0 ? (
                    <div className="space-y-3">
                      {(messagesQuery.data ?? []).map((message) => (
                        <div
                          key={message.id}
                          className="rounded-[20px] border border-border bg-background/70 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                                {(message.sender_name || "A")[0].toUpperCase()}
                              </div>
                              <p className="font-medium text-sm">{message.sender_name || "Anonymous"}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">{message.moderation_status}</Badge>
                          </div>
                          <p className="mt-2 pl-9 text-sm text-muted-foreground">{message.body}</p>
                          {isOwner && message.moderation_status === "PENDING" ? (
                            <div className="mt-3 flex gap-2 pl-9">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleMessageModeration(message.id, "approve")}
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMessageModeration(message.id, "reject")}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Gifts tab */}
            {activeTab === "gifts" && (
              <Card className="panel-tint">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-rose-500" />
                      Send a Digital Gift
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="ml-auto border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    >
                      Instant delivery
                    </Badge>
                  </div>
                  <CardDescription>
                    Pick a gift, personalise your message, and pay securely with Stripe.{" "}
                    <strong>Public or private — your choice.</strong>
                  </CardDescription>
                  {isOwner && (
                    <Link
                      href={`/birthday/${slug}/gifts`}
                      className="mt-1 text-xs text-rose-600 underline underline-offset-2 hover:text-rose-700"
                    >
                      View full storefront →
                    </Link>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <GiftCategoryPills active={activeCategory} onChange={setActiveCategory} />
                  <GiftGrid
                    products={giftCatalogQuery.data ?? []}
                    isLoading={giftCatalogQuery.isLoading}
                    onSelect={setSelectedProduct}
                  />
                  <GiftsReceivedWall
                    gifts={birthdayGiftsQuery.data ?? []}
                    isLoading={birthdayGiftsQuery.isLoading}
                    isOwner={isOwner}
                  />
                </CardContent>
              </Card>
            )}

            {/* Contribute tab */}
            {activeTab === "contribute" && (
              <div className="space-y-6">
                <Card className="panel-tint">
                  <CardHeader>
                    <CardTitle>Contribute securely</CardTitle>
                    <CardDescription>
                      No birthday profile is required to support someone from a shared link. This uses a
                      secure Stripe PaymentIntent flow on the platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ErrorNotice message={contributionError} />
                    <form
                      className="space-y-4"
                      onSubmit={contributionForm.handleSubmit(onContributionSubmit)}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          placeholder="Supporter name"
                          {...contributionForm.register("supporter_name")}
                        />
                        <Input
                          placeholder="Supporter email"
                          {...contributionForm.register("supporter_email")}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input placeholder="Amount" {...contributionForm.register("amount")} />
                        <Input placeholder="Currency" {...contributionForm.register("currency")} />
                      </div>
                      <Button className="w-full" type="submit">
                        Create contribution intent
                      </Button>
                    </form>
                    {contributionIntent.data?.client_secret ? (
                      <Elements stripe={stripePromise} options={elementsOptions}>
                        <StripePaymentForm returnPath={`/birthday/${slug}`} />
                      </Elements>
                    ) : null}
                  </CardContent>
                </Card>

                {isOwner ? (
                  <Card className="panel-tint">
                    <CardHeader>
                      <CardTitle>Owner support dashboard</CardTitle>
                      <CardDescription>
                        Review private support activity here. Public guests only see approved messages
                        and reservation status.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {contributionsQuery.error ? (
                        <div className="rounded-[20px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                          {getErrorMessage(contributionsQuery.error, "Unable to load contributions.")}
                        </div>
                      ) : null}
                      {contributionsQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading contributions...</p>
                      ) : null}
                      {!contributionsQuery.isLoading &&
                      !contributionsQuery.error &&
                      !(contributionsQuery.data ?? []).length ? (
                        <p className="text-sm text-muted-foreground">
                          No contribution payments have been recorded yet.
                        </p>
                      ) : null}
                      {(contributionsQuery.data ?? []).map((contribution) => (
                        <div
                          key={contribution.id}
                          className="rounded-[20px] border border-border bg-background/70 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">
                                {contribution.supporter_name || "Anonymous supporter"}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {contribution.supporter_email || "No email provided"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatCurrency(contribution.amount, contribution.currency)}
                              </p>
                              <Badge
                                variant={
                                  contribution.status === "SUCCEEDED"
                                    ? "success"
                                    : contribution.status === "PENDING"
                                    ? "warning"
                                    : "outline"
                                }
                              >
                                {contribution.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDate(contribution.created_at)}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}
          </div>
          {/* end tabs */}
          </div>
          {/* end 9-col main content */}

        {/* ── Owner sidebar: account status + verification ────────────────── */}
        {isOwner && (
          <aside className="space-y-4 self-start lg:col-span-3 lg:sticky lg:top-24">

            {/* Account status */}
            <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Account status
              </p>
              <div className="flex items-center gap-3 rounded-[18px] border border-border/60 bg-background/70 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{fullName || user?.email || "You"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.birthday_profile_completed ? "Profile ready" : "Profile incomplete"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    user?.birthday_profile_completed
                      ? "border border-emerald-400/30 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "border border-amber-400/30 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  }`}
                >
                  {user?.birthday_profile_completed ? "Ready" : "Needed"}
                </span>
              </div>
            </div>

            {/* Account verification */}
            <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Account verification
              </p>
              <div className="space-y-2">
                {/* Phone */}
                <div className="flex items-center gap-3 rounded-[16px] border border-border/60 bg-background/70 px-4 py-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isPhoneVerified
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-xs text-muted-foreground">
                      {isPhoneVerified ? "Verified" : "Not verified"}
                    </p>
                  </div>
                  {isPhoneVerified ? (
                    <CheckCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 rounded-[16px] border border-border/60 bg-background/70 px-4 py-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isEmailVerified
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">
                      {isEmailVerified ? "Verified" : "Not verified"}
                    </p>
                  </div>
                  {isEmailVerified ? (
                    <CheckCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Quick actions
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full justify-between" size="sm">
                  <Link href="/events/new">
                    Create event
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between" size="sm">
                  <Link href="/events">
                    Open feed
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

          </aside>
        )}

        </div>
        {/* end grid */}

        {/* Safety actions — non-owner signed-in users only */}
        {user && !isOwner && profile ? (
          <div className="mt-8 border-t border-border/40 pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Safety</p>
            {!showProfileReportForm ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfileReportForm(true)}
                >
                  Report profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/20"
                  onClick={handleProfileBlock}
                  disabled={blockMutation.isPending || blockMutation.isSuccess}
                >
                  {blockMutation.isSuccess ? "User blocked" : blockMutation.isPending ? "Blocking…" : "Block user"}
                </Button>
              </div>
            ) : (
              <div className="max-w-sm space-y-3">
                <select
                  className="flex h-10 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
                  value={profileReportReason}
                  onChange={(e) => setProfileReportReason(e.target.value)}
                >
                  <option value="">Select a reason…</option>
                  <option value="spam">Spam or misleading</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="fake_profile">Fake profile</option>
                  <option value="harassment">Harassment</option>
                  <option value="other">Other</option>
                </select>
                <Textarea
                  placeholder="Optional: add more details"
                  value={profileReportDetails}
                  onChange={(e) => setProfileReportDetails(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleProfileReport} disabled={!profileReportReason || reportMutation.isPending}>
                    {reportMutation.isPending ? "Submitting…" : "Submit report"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowProfileReportForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

      </main>
    </>
  );
}

// ── BirthdayCountdown ─────────────────────────────────────────────────────────

function getNextBirthday(day: number, month: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const next = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (next <= now) next.setFullYear(year + 1);
  return next;
}

function useCountdown(day: number, month: number) {
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, getNextBirthday(day, month).getTime() - Date.now())
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(Math.max(0, getNextBirthday(day, month).getTime() - Date.now()));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [day, month]);

  const totalSeconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isBirthday: totalSeconds === 0 };
}

function BirthdayCountdownSection({
  day, month, name, isOwner, countdownPublic, slug,
}: {
  day: number; month: number; name: string;
  isOwner: boolean; countdownPublic: boolean; slug: string;
}) {
  const { days, hours, minutes, seconds, isBirthday } = useCountdown(day, month);
  const updateProfile = useUpdateBirthdayProfile(slug);
  const [saving, setSaving] = useState(false);

  // Only show within 7 days (or on the day itself)
  const withinWindow = isBirthday || days < 7 || (days === 7 && hours === 0 && minutes === 0 && seconds === 0);

  // Non-owners only see it if public AND within window
  if (!isOwner && (!countdownPublic || !withinWindow)) return null;
  // Owner sees it only within window (but always sees the toggle)
  if (isOwner && !withinWindow) {
    return (
      <div className="mx-6 mb-4 flex items-center justify-between rounded-[16px] border border-dashed border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">Countdown visible within 7 days of your birthday</p>
        <VisibilityToggle isPublic={countdownPublic} saving={saving} onToggle={handleToggle} />
      </div>
    );
  }

  async function handleToggle() {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        preferences: { countdown_public: !countdownPublic },
      });
    } finally {
      setSaving(false);
    }
  }

  if (isBirthday) {
    return (
      <div className="mx-6 mb-4 rounded-[20px] border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 px-5 py-4 text-center dark:border-rose-800/30 dark:from-rose-950/30 dark:to-orange-950/20">
        <p className="text-2xl">🎉🎂🎉</p>
        <p className="mt-1 font-display text-lg font-semibold text-rose-700 dark:text-rose-300">
          Today is {name}&apos;s birthday!
        </p>
        <p className="text-sm text-muted-foreground">Wish them a happy birthday!</p>
        {isOwner && <VisibilityToggle isPublic={countdownPublic} saving={saving} onToggle={handleToggle} className="mt-3 justify-center" />}
      </div>
    );
  }

  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Mins", value: minutes },
    { label: "Secs", value: seconds },
  ];

  return (
    <div className="mx-6 mb-4 rounded-[20px] border border-rose-100 bg-gradient-to-r from-rose-50/80 to-orange-50/60 px-5 py-4 dark:border-rose-900/30 dark:from-rose-950/20 dark:to-orange-950/10">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose-500 dark:text-rose-400">
          🎂 Birthday countdown
        </p>
        {isOwner && <VisibilityToggle isPublic={countdownPublic} saving={saving} onToggle={handleToggle} />}
      </div>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="font-display text-3xl font-bold tabular-nums text-rose-700 dark:text-rose-300 sm:text-4xl">
              {String(value).padStart(2, "0")}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {days === 0
          ? `It's almost ${name}'s birthday — just ${hours}h ${minutes}m to go!`
          : `${days} day${days === 1 ? "" : "s"} until ${name}'s birthday`}
      </p>
    </div>
  );
}

function VisibilityToggle({ isPublic, saving, onToggle, className }: {
  isPublic: boolean; saving: boolean; onToggle: () => void; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={saving}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
        isPublic
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-border bg-background/60 text-muted-foreground hover:bg-muted"
      } ${className ?? ""}`}
    >
      {saving ? "Saving…" : isPublic ? "Public" : "Only me"}
    </button>
  );
}

// ── WishlistReserveCard (local subcomponent) ──────────────────────────────────

function WishlistReserveCard({
  item,
  slug,
  isOwner,
  userEmail,
}: {
  item: {
    id: number;
    title: string;
    description: string;
    price: string | null;
    currency: string;
    is_reserved: boolean;
    reservation?: { reserver_name: string; reserver_email?: string } | null;
  };
  slug: string;
  isOwner: boolean;
  userEmail: string | null;
}) {
  const reserveMutation = useWishlistReserve(item.id, slug);
  const cancelMutation = useWishlistCancel(item.id, slug);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const form = useForm<ReserveValues>({
    resolver: zodResolver(wishlistReserveSchema),
    defaultValues: { reserver_name: "", reserver_email: "" },
  });

  const isReserver = Boolean(
    item.is_reserved &&
    !isOwner &&
    userEmail &&
    item.reservation?.reserver_email?.toLowerCase() === userEmail.toLowerCase()
  );

  async function onReserve(values: ReserveValues) {
    await reserveMutation.mutateAsync(values);
    toast.success("Item reserved.");
  }

  async function onOwnerClear() {
    try {
      await cancelMutation.mutateAsync();
      toast.success("Reservation cleared.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to clear reservation."));
    }
  }

  async function onReserverCancel() {
    try {
      await cancelMutation.mutateAsync({ message: cancelMessage });
      toast.success("Reservation cancelled. The owner has been notified.");
      setShowCancelForm(false);
      setCancelMessage("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to cancel reservation."));
    }
  }

  return (
    <div className={cn(
      "rounded-[24px] border bg-background/75 p-5 transition",
      item.is_reserved
        ? "border-amber-200/60 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10"
        : "border-border/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
    )}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{item.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {item.price ? (
            <p className="font-semibold tabular-nums">{formatCurrency(item.price, item.currency)}</p>
          ) : null}
          <Badge variant={item.is_reserved ? "warning" : "success"} className="text-xs">
            {item.is_reserved
              ? `Reserved by ${item.reservation?.reserver_name ?? "someone"}`
              : "Available"}
          </Badge>
        </div>
      </div>

      {/* Owner: clear reservation */}
      {item.is_reserved && isOwner ? (
        <Button type="button" variant="ghost" size="sm" className="mt-3 text-xs" onClick={onOwnerClear} disabled={cancelMutation.isPending}>
          {cancelMutation.isPending ? "Clearing…" : "Clear reservation"}
        </Button>
      ) : null}

      {/* Reserver: cancel with message */}
      {isReserver ? (
        <div className="mt-3">
          {!showCancelForm ? (
            <Button type="button" variant="ghost" size="sm" className="text-xs text-rose-600 hover:text-rose-700" onClick={() => setShowCancelForm(true)}>
              Cancel my reservation
            </Button>
          ) : (
            <div className="space-y-2 rounded-[16px] border border-border bg-background/60 p-3">
              <p className="text-xs font-medium text-muted-foreground">Leave a message for the owner (optional)</p>
              <Textarea
                placeholder="Let them know why you're cancelling…"
                value={cancelMessage}
                onChange={(e) => setCancelMessage(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={onReserverCancel} disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? "Cancelling…" : "Confirm cancel"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowCancelForm(false); setCancelMessage(""); }}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Reserve form */}
      {!item.is_reserved ? (
        <form
          className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={form.handleSubmit(onReserve)}
        >
          <Input placeholder="Your name" {...form.register("reserver_name")} />
          <Input placeholder="Your email" {...form.register("reserver_email")} />
          <Button type="submit" disabled={reserveMutation.isPending}>Reserve</Button>
        </form>
      ) : null}
    </div>
  );
}
