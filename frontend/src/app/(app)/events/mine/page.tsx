"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/state-block";
import { useMyAppliedEvents, useMyEvents, usePublishEvent } from "@/features/events/api";
import { getErrorMessage } from "@/lib/api/errors";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EventRecord } from "@/lib/api/types";

type Tab = "hosted" | "applied";

export default function MyEventsPage() {
  const searchParams = useSearchParams();
  const createdId = searchParams.get("created");
  const published = searchParams.get("published");
  const [tab, setTab] = useState<Tab>("hosted");

  const myEvents = useMyEvents();
  const appliedEvents = useMyAppliedEvents();

  const isLoading = tab === "hosted" ? myEvents.isLoading : appliedEvents.isLoading;
  const error = tab === "hosted" ? myEvents.error : appliedEvents.error;
  const data = tab === "hosted" ? (myEvents.data ?? []) : (appliedEvents.data ?? []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge>Events</Badge>
            <CardTitle className="pt-3 font-display text-4xl">My events</CardTitle>
            <CardDescription>Events you host and events you have applied to join.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/events/new">Create event</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 rounded-2xl border border-border bg-muted/30 p-1 w-fit">
            {(["hosted", "applied"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-xl px-5 py-2 text-sm font-medium transition-colors ${
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "hosted" ? "Hosted" : "Applied to"}
                {t === "hosted" && (myEvents.data?.length ?? 0) > 0 ? (
                  <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                    {myEvents.data!.length}
                  </span>
                ) : null}
                {t === "applied" && (appliedEvents.data?.length ?? 0) > 0 ? (
                  <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                    {appliedEvents.data!.length}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {(createdId || published) && tab === "hosted" && (
        <div className="rounded-[24px] border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
          {published ? "Your event was created and published." : "Your event was saved as a draft. Publish it when you are ready."}
        </div>
      )}

      {isLoading ? (
        <LoadingBlock message={tab === "hosted" ? "Loading your hosted events..." : "Loading events you applied to..."} />
      ) : error ? (
        <ErrorState description={getErrorMessage(error, "Unable to load events.")} />
      ) : data.length === 0 ? (
        tab === "hosted" ? (
          <EmptyState
            title="No hosted events yet"
            description="Create your first draft, then publish when the details are ready."
            actionHref="/events/new"
            actionLabel="Create your first event"
          />
        ) : (
          <EmptyState
            title="No applications yet"
            description="Browse public events near you and apply to ones you'd like to join."
            actionHref="/events"
            actionLabel="Browse events"
          />
        )
      ) : (
        <div className="grid gap-4">
          {data.map((event) =>
            tab === "hosted"
              ? <HostedEventCard key={event.id} event={event} highlight={createdId === String(event.id)} />
              : <AppliedEventCard key={event.id} event={event} />
          )}
        </div>
      )}
    </div>
  );
}

function HostedEventCard({ event, highlight }: { event: EventRecord; highlight: boolean }) {
  const publish = usePublishEvent(event.id);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
      setCopied(true);
      toast.success("Event link copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to copy the event link.");
    }
  }

  async function handlePublish() {
    setSubmitError(null);
    try {
      await publish.mutateAsync();
      window.location.href = `/events/mine?created=${event.id}&published=1`;
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to publish this event."));
    }
  }

  return (
    <Card className={highlight ? "border-primary/30 shadow-glow" : ""}>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <ErrorNotice message={submitError} className="mb-4" />
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{event.category}</Badge>
            <Badge variant={event.state === "DRAFT" ? "warning" : event.state === "OPEN" || event.state === "MIN_MET" ? "success" : "outline"}>
              {event.state}
            </Badge>
            <span className="text-sm text-muted-foreground">{event.approx_area_label}</span>
          </div>
          <h3 className="mt-3 font-display text-2xl">{event.title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{event.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{formatDate(event.start_at)}</span>
            <span>{formatCurrency(event.amount, event.currency)}</span>
            <span>{event.approved_count}/{event.max_guests} approved</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:w-[220px]">
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}`}>Open detail</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/applications`}>Host tools</Link>
          </Button>
          {event.state !== "DRAFT" ? (
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy share link"}
            </Button>
          ) : null}
          {event.state === "DRAFT" ? (
            <Button onClick={handlePublish} disabled={publish.isPending}>
              Publish now
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function AppliedEventCard({ event }: { event: EventRecord }) {
  const appStatus = event.my_application?.status ?? "PENDING";
  const statusVariant =
    appStatus === "APPROVED" ? "success" :
    appStatus === "DECLINED" ? "outline" : "warning";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{event.category}</Badge>
            <Badge variant={event.state === "OPEN" || event.state === "MIN_MET" ? "success" : "outline"}>
              {event.state}
            </Badge>
            <Badge variant={statusVariant}>Application: {appStatus}</Badge>
            <span className="text-sm text-muted-foreground">{event.approx_area_label}</span>
          </div>
          <h3 className="mt-3 font-display text-2xl">{event.title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{event.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{formatDate(event.start_at)}</span>
            <span>{formatCurrency(event.amount, event.currency)}</span>
            <span>{event.approved_count}/{event.max_guests} approved</span>
          </div>
          {event.venue_name ? (
            <p className="mt-2 text-sm font-medium text-primary">Venue confirmed: {event.venue_name}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 md:w-[200px]">
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}`}>View event</Link>
          </Button>
          {appStatus === "APPROVED" ? (
            <Button asChild>
              <Link href={`/events/${event.id}/checkout`}>Complete contribution</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
