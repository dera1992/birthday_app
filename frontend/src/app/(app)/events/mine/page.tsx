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
import { useMyEvents, usePublishEvent } from "@/features/events/api";
import { getErrorMessage } from "@/lib/api/errors";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MyEventsPage() {
  const searchParams = useSearchParams();
  const createdId = searchParams.get("created");
  const published = searchParams.get("published");
  const myEvents = useMyEvents();

  if (myEvents.isLoading) {
    return <LoadingBlock message="Loading your hosted events..." />;
  }

  if (myEvents.error) {
    return <ErrorState description={getErrorMessage(myEvents.error, "Unable to load your hosted events.")} />;
  }

  if (!myEvents.data?.length) {
    return (
      <EmptyState
        title="No hosted events yet"
        description="Create your first draft, then publish when the details are ready. Drafts live here even before they appear in discovery."
        actionHref="/events/new"
        actionLabel="Create your first event"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge>Host area</Badge>
            <CardTitle className="pt-3 font-display text-4xl">My events</CardTitle>
            <CardDescription>Drafts, published events, and next actions live here. Discovery feed only shows open events.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/events/new">Create event</Link>
          </Button>
        </CardHeader>
      </Card>

      {(createdId || published) && (
        <div className="rounded-[24px] border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
          {published ? "Your event was created and published." : "Your event was saved as a draft. Publish it when you are ready."}
        </div>
      )}

      <div className="grid gap-4">
        {myEvents.data.map((event) => (
          <MyEventCard key={event.id} event={event} highlight={createdId === String(event.id)} />
        ))}
      </div>
    </div>
  );
}

function MyEventCard({ event, highlight }: { event: import("@/lib/api/types").EventRecord; highlight: boolean }) {
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
            <span>
              {event.approved_count}/{event.max_guests} approved
            </span>
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
