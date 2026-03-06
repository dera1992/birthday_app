"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/state-block";
import {
  useApplications,
  useApprove,
  useCancelEvent,
  useConfirmVenue,
  useCreateEventInvite,
  useDecline,
  useEvent,
  useEventInvites,
  useLock,
  useMarkNoShow,
  usePublishEvent,
  useToggleExpand,
} from "@/features/events/api";
import { useEventVenueRecommendations } from "@/features/packs/api";
import { getErrorMessage } from "@/lib/api/errors";
import { useRef, useState } from "react";
import { formatDate } from "@/lib/utils";
import { SocialLinks } from "@/components/social-links";

export default function EventApplicationsPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const eventQuery = useEvent(eventId);
  const applicationsQuery = useApplications(eventId);
  const approve = useApprove(eventId);
  const decline = useDecline(eventId);
  const invitesQuery = useEventInvites(eventId, Boolean(eventId));
  const createInvite = useCreateEventInvite(eventId);
  const publish = usePublishEvent(eventId);
  const toggleExpand = useToggleExpand(eventId);
  const confirmVenue = useConfirmVenue(eventId);
  const lock = useLock(eventId);
  const cancel = useCancelEvent(eventId);
  const markNoShow = useMarkNoShow(eventId);
  const venueRecsQuery = useEventVenueRecommendations(eventId, null);
  const event = eventQuery.data;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [venueSearch, setVenueSearch] = useState("");
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const venueInputRef = useRef<HTMLInputElement>(null);

  const allVenues = (venueRecsQuery.data ?? []).flatMap((g) => g.venues);
  const filteredVenues = venueSearch.trim()
    ? allVenues.filter((v) => v.name.toLowerCase().includes(venueSearch.toLowerCase()))
    : allVenues;
  const isUnknownVenue =
    venueSearch.trim().length > 2 &&
    !allVenues.some((v) => v.name.toLowerCase() === venueSearch.trim().toLowerCase());

  async function onConfirmVenue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!venueSearch.trim()) return;
    setSubmitError(null);
    try {
      await confirmVenue.mutateAsync({ venue_name: venueSearch.trim() });
      toast.success("Venue confirmed.");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to confirm venue."));
    }
  }

  async function runAction(action: () => Promise<unknown>, success: string, fallback: string) {
    setSubmitError(null);
    try {
      await action();
      toast.success(success);
    } catch (error) {
      setSubmitError(getErrorMessage(error, fallback));
    }
  }

  async function handlePublish() {
    setSubmitError(null);
    try {
      await publish.mutateAsync();
      toast.success("Event published.");
      if (event?.venue_status !== "CONFIRMED") {
        toast.warning("Venue has not been selected yet. Confirm a venue before the lock deadline.");
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to publish event."));
    }
  }

  async function onCreateInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const maxUsesValue = String(formData.get("max_uses") || "0");
    const expiresAtValue = String(formData.get("expires_at") || "");
    setSubmitError(null);
    try {
      await createInvite.mutateAsync({
        max_uses: Number(maxUsesValue || "0"),
        expires_at: expiresAtValue ? new Date(expiresAtValue).toISOString() : null,
      });
      toast.success("Invite code created.");
      event.currentTarget.reset();
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to create invite code."));
    }
  }

  return (
    <div className="space-y-6">
      {eventQuery.isLoading ? <LoadingBlock message="Loading host tools..." /> : null}
      {eventQuery.error ? <ErrorState description={getErrorMessage(eventQuery.error, "Unable to load this event.")} /> : null}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="font-display text-4xl">Host management</CardTitle>
              <CardDescription>Review applications, confirm venue, and only lock when the backend rules are satisfied.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handlePublish}>
                Publish
              </Button>
              <Button variant="outline" onClick={() => runAction(() => toggleExpand.mutateAsync(), "Discoverability updated.", "Unable to toggle expand mode.")}>
                Toggle expand
              </Button>
              <Button onClick={() => runAction(() => lock.mutateAsync(), "Event locked.", "Unable to lock event.")}>Lock event</Button>
              <Button variant="ghost" onClick={() => runAction(() => cancel.mutateAsync(), "Event cancelled.", "Unable to cancel event.")}>
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <ErrorNotice message={submitError} className="md:col-span-3" />
          <div className="rounded-[24px] bg-secondary/70 p-4">
            <p className="text-sm text-muted-foreground">State</p>
            <p className="mt-2 text-2xl font-semibold">{event?.state}</p>
          </div>
          <div className="rounded-[24px] bg-secondary/70 p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="mt-2 text-2xl font-semibold">
              {event?.approved_count}/{event?.max_guests}
            </p>
          </div>
          <div className={`rounded-[24px] p-4 ${event?.venue_status === "CONFIRMED" ? "bg-green-50 dark:bg-green-950/30" : "bg-secondary/70"}`}>
            <p className="text-sm text-muted-foreground">Venue</p>
            <p className={`mt-2 text-2xl font-semibold ${event?.venue_status === "CONFIRMED" ? "text-green-700 dark:text-green-400" : ""}`}>
              {event?.venue_status}
            </p>
            {event?.state === "PUBLISHED" && event?.venue_status !== "CONFIRMED" ? (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Venue not selected — confirm before the lock deadline.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="relative z-10">
        <CardHeader>
          <CardTitle>Venue confirmation</CardTitle>
          {event?.venue_name ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Currently confirmed: <span className="font-medium">{event.venue_name}</span></p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form onSubmit={onConfirmVenue} className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1 space-y-2">
              <Label htmlFor="venue_name">Search venue</Label>
              <Input
                ref={venueInputRef}
                id="venue_name"
                value={venueSearch}
                onChange={(e) => { setVenueSearch(e.target.value); setShowVenueSuggestions(true); }}
                onFocus={() => setShowVenueSuggestions(true)}
                onBlur={() => setTimeout(() => setShowVenueSuggestions(false), 150)}
                placeholder="Type to search venue recommendations…"
                autoComplete="off"
              />
              {showVenueSuggestions && filteredVenues.length > 0 ? (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-border bg-background shadow-lg">
                  {filteredVenues.map((v) => (
                    <li
                      key={v.id}
                      className="cursor-pointer px-4 py-2.5 text-sm hover:bg-secondary"
                      onMouseDown={() => { setVenueSearch(v.name); setShowVenueSuggestions(false); }}
                    >
                      <span className="font-medium">{v.name}</span>
                      <span className="ml-2 text-muted-foreground">{v.city}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {isUnknownVenue ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This venue is not in our partner list. Please ensure it is a publicly accessible location, not a private home address.
                </p>
              ) : null}
            </div>
            <Button className="md:self-end" type="submit" disabled={!venueSearch.trim() || confirmVenue.isPending}>
              Confirm venue
            </Button>
          </form>
        </CardContent>
      </Card>

      {event?.visibility === "INVITE_ONLY" ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite codes</CardTitle>
            <CardDescription>Create controlled codes for private sharing. Guests can open the link directly, but applying still depends on your invite settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={onCreateInvite} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Max uses</Label>
                <Input id="max_uses" name="max_uses" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires at</Label>
                <Input id="expires_at" name="expires_at" type="datetime-local" />
              </div>
              <Button className="md:self-end" type="submit" disabled={createInvite.isPending}>
                Create code
              </Button>
            </form>

            {invitesQuery.isLoading ? <LoadingBlock message="Loading invite codes..." className="min-h-[120px]" /> : null}
            {invitesQuery.error ? (
              <ErrorState description={getErrorMessage(invitesQuery.error, "Unable to load invite codes.")} className="min-h-[120px]" />
            ) : null}
            {!invitesQuery.isLoading && !invitesQuery.error && !(invitesQuery.data ?? []).length ? (
              <EmptyState
                title="No invite codes yet"
                description="Create your first code here for private guest sharing."
                className="min-h-[120px]"
              />
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {(invitesQuery.data ?? []).map((invite) => (
                <div key={invite.id} className="rounded-[24px] border border-border bg-background/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-2xl tracking-[0.2em]">{invite.code}</p>
                    <Badge variant="outline">{invite.max_uses ? `${invite.used_count}/${invite.max_uses}` : `${invite.used_count} used`}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {invite.expires_at ? `Expires ${formatDate(invite.expires_at)}` : "No expiry set"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Review applicants, approve selectively, and keep capacity under control.</CardDescription>
            </div>
            {(applicationsQuery.data ?? []).filter((a) => a.status === "PENDING").length > 0 ? (
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-500 px-2 text-sm font-semibold text-white">
                {(applicationsQuery.data ?? []).filter((a) => a.status === "PENDING").length}
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {applicationsQuery.isLoading ? <LoadingBlock message="Loading applications..." className="min-h-[160px]" /> : null}
          {applicationsQuery.error ? <ErrorState description={getErrorMessage(applicationsQuery.error, "Unable to load applications.")} className="min-h-[160px]" /> : null}
          {!applicationsQuery.isLoading && !applicationsQuery.error && !(applicationsQuery.data ?? []).length ? (
            <EmptyState
              title="No applications yet"
              description="Once guests apply, they will appear here for review. Publish and expand discoverability when you are ready."
              className="min-h-[160px]"
            />
          ) : null}
          {(applicationsQuery.data ?? []).map((application) => (
            <div key={application.id} className="rounded-[24px] border border-border bg-background/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {(() => {
                    const p = application.applicant_profile;
                    const hasName = Boolean(p?.first_name || p?.last_name);
                    const displayName = hasName
                      ? `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim()
                      : p?.email || `Applicant #${application.applicant}`;
                    return p?.slug ? (
                      <Link href={`/birthday/${p.slug}`} className="font-semibold hover:underline" target="_blank">
                        {displayName}
                      </Link>
                    ) : (
                      <p className="font-semibold">{displayName}</p>
                    );
                  })()}
                  {/* Only show email as secondary line when the heading already shows a real name */}
                  {(application.applicant_profile?.first_name || application.applicant_profile?.last_name) && application.applicant_profile?.email ? (
                    <p className="mt-1 text-sm text-muted-foreground">{application.applicant_profile.email}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted-foreground">{application.intro_message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {application.applicant_profile?.slug ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/birthday/${application.applicant_profile.slug}`} target="_blank">
                        View birthday page
                      </Link>
                    </Button>
                  ) : null}
                  <Badge variant={application.status === "APPROVED" ? "success" : application.status === "PENDING" ? "warning" : "outline"}>
                    {application.status}
                  </Badge>
                </div>
              </div>
              {application.applicant_profile ? (
                <div className="mt-4 grid gap-4 rounded-[20px] border border-border bg-secondary/40 p-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profile summary</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {application.applicant_profile.bio || "No bio added yet."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={application.applicant_profile.phone_verified ? "success" : "warning"}>
                        Phone {application.applicant_profile.phone_verified ? "verified" : "missing"}
                      </Badge>
                      <Badge variant={application.applicant_profile.email_verified ? "success" : "outline"}>
                        Email {application.applicant_profile.email_verified ? "verified" : "unverified"}
                      </Badge>
                      {application.applicant_profile.gender ? <Badge variant="outline">{application.applicant_profile.gender.replaceAll("_", " ")}</Badge> : null}
                      {application.applicant_profile.marital_status ? (
                        <Badge variant="outline">{application.applicant_profile.marital_status.replaceAll("_", " ")}</Badge>
                      ) : null}
                      {application.applicant_profile.occupation ? <Badge variant="outline">{application.applicant_profile.occupation}</Badge> : null}
                    </div>
                    {Array.isArray(application.applicant_profile.preferences?.interests) &&
                    application.applicant_profile.preferences.interests.length ? (
                      <div className="flex flex-wrap gap-2">
                        {(application.applicant_profile.preferences.interests as string[]).map((interest) => (
                          <Badge key={interest} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Social links</p>
                    {Object.entries(application.applicant_profile.social_links ?? {}).filter(([, v]) => Boolean(v)).length ? (
                      <div>
                        <SocialLinks
                          links={application.applicant_profile.social_links}
                          variant="list"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No linked social accounts yet.</p>
                    )}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => runAction(() => approve.mutateAsync(application.id), "Application approved.", "Unable to approve application.")}
                >
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => runAction(() => decline.mutateAsync(application.id), "Application declined.", "Unable to decline application.")}
                >
                  Decline
                </Button>
                {application.status === "APPROVED" && event && new Date() >= new Date(event.start_at) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700"
                    disabled={markNoShow.isPending}
                    onClick={() => runAction(
                      () => markNoShow.mutateAsync(application.applicant),
                      "No-show recorded.",
                      "Unable to mark no-show."
                    )}
                  >
                    Mark no-show
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
