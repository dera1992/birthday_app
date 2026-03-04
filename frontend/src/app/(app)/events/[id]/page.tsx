"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/state-block";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { EventShareCard } from "@/features/events/components/event-share-card";
import { useApplyToEvent, useEvent } from "@/features/events/api";
import { useVenueClick, useVenueRecommendations } from "@/features/venues/api";
import { getErrorMessage } from "@/lib/api/errors";
import { applySchema } from "@/lib/validators/events";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SocialLinks } from "@/components/social-links";

type ApplyValues = z.infer<typeof applySchema>;

function CheckIcon({ met, neutral }: { met?: boolean; neutral?: boolean }) {
  if (neutral) return <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />;
  if (met) return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />;
  return <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />;
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const { user } = useAuth();
  const eventQuery = useEvent(eventId);
  const applyMutation = useApplyToEvent(eventId);
  const venueClick = useVenueClick();
  const event = eventQuery.data;
  const venuesQuery = useVenueRecommendations({
    city: event?.approx_area_label,
    category: event?.category,
  });
  const form = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { intro_message: "", invite_code: "" },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: ApplyValues) {
    setSubmitError(null);
    try {
      await applyMutation.mutateAsync(values);
      toast.success("Application submitted. The host will review it shortly.");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to submit application."));
    }
  }

  const myApplication = applyMutation.data ?? (event?.my_application ? { id: event.my_application.id, status: event.my_application.status } : null);
  const hasApplied = Boolean(myApplication) || applyMutation.isSuccess;

  async function handleVenueRedirect(venueId: number) {
    const response = await venueClick.mutateAsync(venueId);
    window.open(response.redirect_url, "_blank", "noopener,noreferrer");
  }

  if (eventQuery.isLoading) return <LoadingBlock message="Loading event details..." />;
  if (eventQuery.error) return <ErrorState description={getErrorMessage(eventQuery.error, "Unable to load this event.")} />;
  if (!event) return <div className="glass-panel p-8 text-sm text-muted-foreground">Loading event details...</div>;

  const isHost = event.host === user?.id;
  const requiresInvite = event.visibility === "INVITE_ONLY" && !event.expand_to_strangers;
  const criteria = (event.criteria as {
    verified_only?: boolean;
    allowed_genders?: string[];
    min_age?: number;
    max_age?: number;
    allowed_marital_statuses?: string[];
    allowed_occupations?: string[];
    interests?: string[];
    tags?: string[];
  } | null) ?? {};
  const requiredInterests: string[] = criteria.interests?.length ? criteria.interests : (criteria.tags ?? []);
  const requiresEmail = Boolean(criteria.verified_only);
  const phoneVerified = Boolean(user?.verification?.phone_verified_at);
  const emailVerified = Boolean(user?.verification?.email_verified_at);
  const birthdayProfileReady = Boolean(user?.birthday_profile_completed);
  const hostProfile = event.host_profile;
  const isEventOpen = event.state === "OPEN" || event.state === "MIN_MET";

  // Ordered list of blockers the user must resolve before applying
  const blockers: { label: string; action?: { href: string; text: string } }[] = [];
  if (user) {
    if (!birthdayProfileReady) {
      blockers.push({
        label: "Complete your birthday profile",
        action: {
          href: user.birthday_profile_slug ? `/birthday-profile/${user.birthday_profile_slug}/edit` : "/birthday-profile/new",
          text: user.birthday_profile_slug ? "Finish profile" : "Create profile",
        },
      });
    }
    if (!phoneVerified) {
      blockers.push({ label: "Verify your phone number", action: { href: "/settings", text: "Go to settings" } });
    }
    if (requiresEmail && !emailVerified) {
      blockers.push({ label: "Verify your email address", action: { href: "/settings", text: "Go to settings" } });
    }
  }
  const canApply = user !== null && blockers.length === 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      {/* ── Left column ──────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{event.category}</Badge>
              <Badge variant="outline">{event.state}</Badge>
              <Badge variant="warning">Refund guarantee</Badge>
            </div>
            <CardTitle className="pt-3 font-display text-4xl">{event.title}</CardTitle>
            <CardDescription>{event.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">When</p>
                <p className="font-medium">{formatDate(event.start_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approx area</p>
                <p className="font-medium">{event.approx_area_label}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-medium">
                  {event.approved_count}/{event.max_guests} approved · min {event.min_guests}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Contribution per guest</p>
                <p className="font-display text-3xl">{formatCurrency(event.amount, event.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total amount required</p>
                <p className="font-medium">
                  {event.target_amount ? formatCurrency(event.target_amount, event.currency) : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Venue status</p>
                <p className="font-medium">{event.venue_status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lock deadline</p>
                <p className="font-medium">{formatDate(event.lock_deadline_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Who can join — personalised ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Who can join</CardTitle>
            <CardDescription>
              {user
                ? "Green means you already meet this requirement. Fix any red items before applying."
                : "Sign in to see your eligibility against these requirements."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <CheckIcon met={birthdayProfileReady} neutral={!user} />
                <span>
                  <span className="font-medium">Completed birthday profile</span> — required for all events
                  {user && !birthdayProfileReady ? (
                    <Link
                      href={user.birthday_profile_slug ? `/birthday-profile/${user.birthday_profile_slug}/edit` : "/birthday-profile/new"}
                      className="ml-2 text-primary underline-offset-2 hover:underline"
                    >
                      {user.birthday_profile_slug ? "Finish now →" : "Create now →"}
                    </Link>
                  ) : null}
                </span>
              </li>

              <li className="flex items-start gap-3">
                <CheckIcon met={phoneVerified} neutral={!user} />
                <span>
                  <span className="font-medium">Phone verified</span> — required for all events
                  {user && !phoneVerified ? (
                    <Link href="/settings" className="ml-2 text-primary underline-offset-2 hover:underline">
                      Verify now →
                    </Link>
                  ) : null}
                </span>
              </li>

              {requiresEmail ? (
                <li className="flex items-start gap-3">
                  <CheckIcon met={emailVerified} neutral={!user} />
                  <span>
                    <span className="font-medium">Email verified</span> — required by this host
                    {user && !emailVerified ? (
                      <Link href="/settings" className="ml-2 text-primary underline-offset-2 hover:underline">
                        Verify now →
                      </Link>
                    ) : null}
                  </span>
                </li>
              ) : null}

              {requiresInvite ? (
                <li className="flex items-start gap-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span><span className="font-medium">Invite code required</span> — ask the host for a code</span>
                </li>
              ) : null}

              {criteria.allowed_genders?.length ? (
                <li className="flex items-start gap-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span><span className="font-medium">Gender:</span> {criteria.allowed_genders.map((g) => g.replaceAll("_", " ")).join(", ")}</span>
                </li>
              ) : null}

              {(criteria.min_age || criteria.max_age) ? (
                <li className="flex items-start gap-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-medium">Age:</span>{" "}
                    {criteria.min_age && criteria.max_age
                      ? `${criteria.min_age}–${criteria.max_age} years`
                      : criteria.min_age
                      ? `${criteria.min_age}+ years`
                      : `up to ${criteria.max_age} years`}
                  </span>
                </li>
              ) : null}

              {criteria.allowed_marital_statuses?.length ? (
                <li className="flex items-start gap-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span><span className="font-medium">Marital status:</span> {criteria.allowed_marital_statuses.map((s) => s.replaceAll("_", " ")).join(", ")}</span>
                </li>
              ) : null}

              {criteria.allowed_occupations?.length ? (
                <li className="flex items-start gap-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span><span className="font-medium">Occupation:</span> {criteria.allowed_occupations.join(", ")}</span>
                </li>
              ) : null}

              {requiredInterests.length ? (
                <li className="flex items-start gap-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span><span className="font-medium">Interests:</span> at least one of: {requiredInterests.join(", ")}</span>
                </li>
              ) : null}

              {!requiresInvite && !criteria.verified_only && !criteria.allowed_genders?.length && !criteria.min_age && !criteria.max_age && !criteria.allowed_marital_statuses?.length && !criteria.allowed_occupations?.length && !requiredInterests.length ? (
                <li className="text-muted-foreground">No additional criteria — open to all who meet the base requirements above.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
            <CardDescription>Exact venue stays hidden until the host confirms it after lock.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{event.agenda}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense breakdown</CardTitle>
            <CardDescription>How the total budget is expected to be used.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {event.expense_breakdown || "The host has not added a detailed expense plan yet."}
            </p>
          </CardContent>
        </Card>

        {hostProfile ? (
          <Card>
            <CardHeader>
              <CardTitle>Host details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {[hostProfile.first_name, hostProfile.last_name].filter(Boolean).join(" ") || "Birthday host"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{hostProfile.bio || "No host intro added yet."}</p>
                </div>
                {hostProfile.slug ? (
                  <Button variant="outline" asChild>
                    <Link href={`/birthday/${hostProfile.slug}`}>Open birthday page</Link>
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={hostProfile.phone_verified ? "success" : "warning"}>
                  Phone {hostProfile.phone_verified ? "verified" : "unverified"}
                </Badge>
                <Badge variant={hostProfile.email_verified ? "success" : "outline"}>
                  Email {hostProfile.email_verified ? "verified" : "unverified"}
                </Badge>
                {hostProfile.gender ? <Badge variant="outline">{hostProfile.gender.replaceAll("_", " ")}</Badge> : null}
                {hostProfile.marital_status ? <Badge variant="outline">{hostProfile.marital_status.replaceAll("_", " ")}</Badge> : null}
                {hostProfile.occupation ? <Badge variant="outline">{hostProfile.occupation}</Badge> : null}
              </div>
              {Array.isArray(hostProfile.preferences?.interests) && hostProfile.preferences.interests.length ? (
                <div className="flex flex-wrap gap-2">
                  {(hostProfile.preferences.interests as string[]).map((interest) => (
                    <Badge key={interest} variant="outline">{interest}</Badge>
                  ))}
                </div>
              ) : null}
              <SocialLinks links={hostProfile.social_links} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Venue recommendations</CardTitle>
            <CardDescription>Referral partners that fit the city and category of this experience.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {venuesQuery.isLoading ? <LoadingBlock message="Loading venue partners..." className="md:col-span-2 min-h-[160px]" /> : null}
            {venuesQuery.error ? (
              <ErrorState description={getErrorMessage(venuesQuery.error, "Unable to load venue recommendations.")} className="md:col-span-2 min-h-[160px]" />
            ) : null}
            {!venuesQuery.isLoading && !venuesQuery.error && !(venuesQuery.data ?? []).length ? (
              <EmptyState title="No venue partners for this filter yet" description="Try a different city or category later." className="md:col-span-2 min-h-[160px]" />
            ) : null}
            {(venuesQuery.data ?? []).map((venue) => (
              <div key={venue.id} className="rounded-[24px] border border-border bg-background/70 p-5">
                <p className="font-semibold">{venue.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{venue.city} · {venue.approx_area_label}</p>
                <Button variant="outline" className="mt-4 w-full" onClick={() => handleVenueRedirect(venue.id)}>
                  View partner
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Right column ─────────────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* Not signed in */}
        {!user ? (
          <Card>
            <CardHeader>
              <CardTitle>Want to join?</CardTitle>
              <CardDescription>Sign in or create a free account to apply to this event.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button asChild className="flex-1"><Link href="/login">Sign in</Link></Button>
              <Button asChild variant="outline" className="flex-1"><Link href="/register">Join free</Link></Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Host tools — only for the host */}
        {isHost ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Host tools</CardTitle>
                {(event.pending_application_count ?? 0) > 0 ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                    {event.pending_application_count}
                  </span>
                ) : null}
              </div>
              <CardDescription>
                {(event.pending_application_count ?? 0) > 0
                  ? `${event.pending_application_count} pending application${(event.pending_application_count ?? 0) > 1 ? "s" : ""} waiting for review.`
                  : "Manage applications, confirm venue, and control event state."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/events/${event.id}/applications`}>Manage event</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Application status — already applied */}
        {!isHost && hasApplied ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle>Your application</CardTitle>
                <Badge variant={
                  myApplication?.status === "APPROVED" ? "success" :
                  myApplication?.status === "DECLINED" ? "outline" : "warning"
                }>
                  {myApplication?.status ?? "PENDING"}
                </Badge>
              </div>
              <CardDescription>
                {myApplication?.status === "APPROVED"
                  ? "You have been approved — complete your contribution to secure your spot."
                  : myApplication?.status === "DECLINED"
                  ? "The host was unable to approve your application this time."
                  : "The host is reviewing your application. You will be notified once a decision is made."}
              </CardDescription>
            </CardHeader>
            {myApplication?.status === "APPROVED" ? (
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/events/${event.id}/checkout`}>Complete contribution</Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        {/* Apply flow — signed in, not host, not yet applied */}
        {user && !isHost && !hasApplied ? (
          <>
            {/* Blockers checklist */}
            {blockers.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Complete these first</CardTitle>
                  <CardDescription>
                    Finish the steps below before you can submit an application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {blockers.map((blocker, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-[16px] border border-border bg-secondary/30 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        <p className="text-sm font-medium">{blocker.label}</p>
                      </div>
                      {blocker.action ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={blocker.action.href}>{blocker.action.text}</Link>
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {/* Apply form */}
            {isEventOpen ? (
              <Card>
                <CardHeader>
                  <CardTitle>Apply to join</CardTitle>
                  <CardDescription>
                    You only pay after approval — your contribution is held securely until the event locks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorNotice className="mb-4" message={submitError} />
                  <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                      <Label htmlFor="intro_message">Why are you a good fit?</Label>
                      <Textarea
                        id="intro_message"
                        {...form.register("intro_message")}
                        placeholder="Tell the host a bit about yourself and why you'd love to attend."
                        rows={4}
                      />
                    </div>
                    {requiresInvite ? (
                      <div className="space-y-2">
                        <Label htmlFor="invite_code">Invite code</Label>
                        <Input id="invite_code" {...form.register("invite_code")} placeholder="Required for this event" />
                      </div>
                    ) : null}
                    {canApply ? (
                      <Button className="w-full" type="submit" disabled={applyMutation.isPending}>
                        {applyMutation.isPending ? "Submitting…" : "Submit application"}
                      </Button>
                    ) : (
                      <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                        Complete the steps above before applying.
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  This event is no longer accepting applications.
                </CardContent>
              </Card>
            )}
          </>
        ) : null}

        <Card className="bg-gradient-to-br from-rose-500 to-red-500 text-white">
          <CardHeader><CardTitle>Refund guarantee</CardTitle></CardHeader>
          <CardContent className="text-sm text-white/85">
            If the venue is not confirmed or minimum guests are not met before the lock deadline, the event auto-cancels and all held contributions are refunded.
          </CardContent>
        </Card>

        <EventShareCard event={event} />
      </div>
    </div>
  );
}
