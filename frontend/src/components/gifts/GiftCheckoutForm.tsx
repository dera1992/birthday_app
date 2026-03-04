"use client";

import { FormEvent, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface GiftCheckoutFormProps {
  slug: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function GiftCheckoutForm({ slug, onSuccess, onBack }: GiftCheckoutFormProps) {
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
        return_url: `${window.location.origin}/birthday/${slug}`,
      },
      redirect: "if_required",
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error.message ?? "Payment failed. Please try again.");
      return;
    }

    onSuccess();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-border bg-background/70 p-4">
        <PaymentElement />
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden />
        Secured by Stripe — your card details are never stored.
      </p>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 rounded-xl bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            "Pay & Send Gift"
          )}
        </Button>
      </div>
    </form>
  );
}
