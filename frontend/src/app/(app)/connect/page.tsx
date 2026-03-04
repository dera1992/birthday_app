"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { ErrorState, LoadingBlock } from "@/components/ui/state-block";
import { useConnectOnboard, useConnectStatus } from "@/features/connect/api";
import { getErrorMessage } from "@/lib/api/errors";

export default function ConnectPage() {
  const status = useConnectStatus();
  const onboard = useConnectOnboard();
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (status.isLoading) {
    return <LoadingBlock message="Loading payout status..." />;
  }

  if (status.error) {
    return <ErrorState description={getErrorMessage(status.error, "Unable to load payout status.")} />;
  }

  async function handleOnboard() {
    setSubmitError(null);
    try {
      const response = await onboard.mutateAsync();
      toast.success("Opening Stripe Connect onboarding.");
      window.open(response.onboarding_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to start Connect onboarding."));
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader>
          <Badge>Payouts</Badge>
          <CardTitle className="pt-3 font-display text-4xl">Stripe Connect onboarding</CardTitle>
          <CardDescription>Paid events use separate charges and transfers, so the platform must verify your payout readiness before lock.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorNotice message={submitError} />
          <Button onClick={handleOnboard} disabled={onboard.isPending}>
            {status.data?.has_account ? "Resume onboarding" : "Start onboarding"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Refresh and return pages route back here so the host can see updated account requirements immediately.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ErrorNotice message={submitError} />
          <div className="flex items-center justify-between">
            <span>Has account</span>
            <Badge variant={status.data?.has_account ? "success" : "outline"}>{status.data?.has_account ? "Yes" : "No"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Charges enabled</span>
            <Badge variant={status.data?.connect_account?.charges_enabled ? "success" : "warning"}>
              {status.data?.connect_account?.charges_enabled ? "Enabled" : "Pending"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Payouts enabled</span>
            <Badge variant={status.data?.connect_account?.payouts_enabled ? "success" : "warning"}>
              {status.data?.connect_account?.payouts_enabled ? "Enabled" : "Pending"}
            </Badge>
          </div>
          <div>
            <p className="mb-2 font-medium">Requirements</p>
            <pre className="overflow-auto rounded-[20px] bg-secondary/70 p-4 text-xs">{JSON.stringify(status.data?.connect_account?.requirements ?? {}, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
