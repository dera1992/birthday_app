"use client";

import { FormEvent, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface StripePaymentFormProps {
  returnPath: string;
  submitLabel?: string;
  onSuccess?: () => void;
}

export function StripePaymentForm({ returnPath, submitLabel = "Confirm payment", onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${returnPath}`,
      },
      redirect: "if_required",
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error.message ?? "Payment failed.");
      return;
    }

    toast.success("Payment submitted successfully.");
    onSuccess?.();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-[24px] border border-border bg-background/70 p-4">
        <PaymentElement />
      </div>
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? "Processing…" : submitLabel}
      </Button>
    </form>
  );
}
