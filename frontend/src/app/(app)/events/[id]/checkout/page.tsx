"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingBlock, ErrorState } from "@/components/ui/state-block";
import { useCreateEventPaymentIntent, useEvent, useRequestRefund } from "@/features/events/api";
import { StripePaymentForm } from "@/features/payments/components/stripe-payment-form";
import { stripePromise } from "@/lib/stripe";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/errors";

export default function EventCheckoutPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);

  const eventQuery = useEvent(eventId);
  const paymentIntent = useCreateEventPaymentIntent(eventId);
  const refundMutation = useRequestRefund(eventId);
  const event = eventQuery.data;

  const [succeeded, setSucceeded] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    paymentIntent.mutateAsync()
      .then((res) => {
        if (!res.client_secret) {
          setIntentError(`Payment status: ${res.status}. If already paid, return to the event page.`);
        }
      })
      .catch((err) => setIntentError(getErrorMessage(err, "Unable to initialise payment.")));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const stripeOptions = useMemo(
    () => ({
      clientSecret: paymentIntent.data?.client_secret ?? "",
      appearance: { theme: "stripe" } as const,
    }),
    [paymentIntent.data?.client_secret]
  );

  async function handleRefund() {
    try {
      const res = await refundMutation.mutateAsync();
      toast.success(res.detail);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to request refund."));
    }
  }

  if (eventQuery.isLoading) return <LoadingBlock message="Loading event…" />;
  if (eventQuery.error) return <ErrorState description={getErrorMessage(eventQuery.error, "Unable to load event.")} />;
  if (!event) return null;

  if (succeeded) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            <div>
              <p className="text-2xl font-semibold">You&apos;re in!</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your contribution of <strong>{formatCurrency(event.amount, event.currency)}</strong> is held securely in escrow.
                It will only be released to the host once the event locks. If the event doesn&apos;t lock, you get a full refund automatically.
              </p>
            </div>
            <Button asChild className="mt-2 w-full">
              <Link href={`/events/${eventId}`}>Back to event</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Event summary */}
      <Card>
        <CardHeader>
          <Badge className="w-fit">Checkout</Badge>
          <CardTitle className="pt-3 font-display text-3xl">{event.title}</CardTitle>
          <CardDescription>{formatDate(event.start_at)} · {event.approx_area_label}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 rounded-[18px] bg-secondary/50 p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Your contribution</p>
              <p className="mt-1 font-display text-3xl">{formatCurrency(event.amount, event.currency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Capacity</p>
              <p className="mt-1 font-medium">{event.approved_count} / {event.max_guests} guests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escrow notice */}
      <div className="flex gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          Your payment is held in escrow and only released to the host once the event locks with venue confirmed and minimum guests met.
          If it doesn&apos;t lock, you get a <strong>full automatic refund</strong>.
        </p>
      </div>

      {/* Payment form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
          <CardDescription>Your card details are encrypted and handled securely by Stripe.</CardDescription>
        </CardHeader>
        <CardContent>
          {intentError ? (
            <div className="space-y-4">
              <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                {intentError}
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/events/${eventId}`}>Back to event</Link>
              </Button>
            </div>
          ) : !paymentIntent.data?.client_secret ? (
            <LoadingBlock message="Preparing payment…" className="min-h-[120px]" />
          ) : (
            <Elements stripe={stripePromise} options={stripeOptions}>
              <StripePaymentForm
                returnPath={`/events/${eventId}/checkout`}
                submitLabel={`Pay ${formatCurrency(event.amount, event.currency)}`}
                onSuccess={() => setSucceeded(true)}
              />
            </Elements>
          )}
        </CardContent>
      </Card>

      {/* Pre-lock refund */}
      <Card>
        <CardHeader>
          <CardTitle>Change your mind?</CardTitle>
          <CardDescription>
            You can request a refund any time before the event locks. Once locked, contributions are committed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleRefund} disabled={refundMutation.isPending}>
            {refundMutation.isPending ? "Requesting…" : "Request pre-lock refund"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
