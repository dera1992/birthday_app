"use client";

import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";
import { useEventInvites } from "@/features/events/api";
import type { EventRecord } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

function buildEventUrl(eventId: number) {
  if (typeof window === "undefined") {
    return `/events/${eventId}`;
  }

  return `${window.location.origin}/events/${eventId}`;
}

export function EventShareCard({ event }: { event: EventRecord }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const isDraft = event.state === "DRAFT";
  const isInviteOnly = event.visibility === "INVITE_ONLY";
  const isHost = user?.id === event.host;
  const invitesQuery = useEventInvites(event.id, isHost && isInviteOnly && !isDraft);
  const shareUrl = buildEventUrl(event.id);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Event link copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to copy the event link.");
    }
  }

  if (isDraft) {
    return (
      <Card>
        <CardHeader>
          <Badge variant="warning">Draft only</Badge>
          <CardTitle className="pt-3">Share unlocks after publish</CardTitle>
          <CardDescription>
            Drafts stay private to the host. Publish the event first, then you can send a clean event link to guests.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">Share ready</Badge>
          {isInviteOnly ? <Badge variant="outline">Invite only</Badge> : <Badge variant="outline">Discoverable</Badge>}
        </div>
        <CardTitle className="pt-3">Share this event</CardTitle>
        <CardDescription>
          {isInviteOnly
            ? "People with the direct link can view the event. Applying may still require an invite code if the host keeps stranger expansion off."
            : "Copy the direct event link and send it anywhere. Published events are safe to share."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[22px] border border-border bg-background/70 p-4 text-sm text-muted-foreground break-all">{shareUrl}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button type="button" asChild>
            <a href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Join me here: ${shareUrl}`)}`}>
              <Send className="h-4 w-4" />
              Share by email
            </a>
          </Button>
        </div>
        {isHost && isInviteOnly ? (
          <div className="rounded-[22px] border border-border bg-background/70 p-4">
            <p className="text-sm font-semibold">Host invite codes</p>
            {invitesQuery.isLoading ? <p className="mt-2 text-sm text-muted-foreground">Loading invite codes...</p> : null}
            {!invitesQuery.isLoading && !(invitesQuery.data ?? []).length ? (
              <p className="mt-2 text-sm text-muted-foreground">Create invite codes from Host tools to share controlled access.</p>
            ) : null}
            <div className="mt-3 space-y-2">
              {(invitesQuery.data ?? []).slice(0, 3).map((invite) => (
                <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-3 py-2 text-sm">
                  <span className="font-semibold tracking-[0.2em]">{invite.code}</span>
                  <span className="text-muted-foreground">
                    {invite.max_uses ? `${invite.used_count}/${invite.max_uses} used` : `${invite.used_count} used`}
                    {invite.expires_at ? ` · expires ${formatDate(invite.expires_at)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
