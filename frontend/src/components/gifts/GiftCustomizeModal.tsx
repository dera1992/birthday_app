"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Elements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNotice } from "@/components/ui/error-notice";
import { GiftPreview } from "./GiftPreview";
import { GiftCheckoutForm } from "./GiftCheckoutForm";
import { useCreateGiftIntent } from "@/features/gifts/mutations";
import { giftCustomizeSchema, type GiftCustomizeValues } from "@/lib/validators/gifts";
import { getErrorMessage } from "@/lib/api/errors";
import { stripePromise } from "@/lib/stripe";
import { formatCurrency, cn } from "@/lib/utils";
import type { GiftProduct } from "@/features/gifts/types";

type Step = "customize" | "payment" | "success";

interface GiftCustomizeModalProps {
  product: GiftProduct;
  slug: string;
  isOpen: boolean;
  isLoggedIn: boolean;
  /** Pre-filled from auth, hidden from guest */
  defaultBuyerName?: string;
  defaultBuyerEmail?: string;
  onClose: () => void;
}

export function GiftCustomizeModal({
  product,
  slug,
  isOpen,
  isLoggedIn,
  defaultBuyerName = "",
  defaultBuyerEmail = "",
  onClose,
}: GiftCustomizeModalProps) {
  const [step, setStep] = useState<Step>("customize");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const createIntent = useCreateGiftIntent(slug);

  const form = useForm<GiftCustomizeValues>({
    resolver: zodResolver(giftCustomizeSchema),
    defaultValues: {
      from_name: "",
      custom_message: "",
      visibility: "PUBLIC",
      is_anonymous: false,
      buyer_name: defaultBuyerName,
      buyer_email: defaultBuyerEmail,
    },
  });

  // Portal needs client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset when modal reopens for a product
  useEffect(() => {
    if (isOpen) {
      setStep("customize");
      setClientSecret(null);
      setSubmitError(null);
      form.reset({
        from_name: "",
        custom_message: "",
        visibility: "PUBLIC",
        is_anonymous: false,
        buyer_name: defaultBuyerName,
        buyer_email: defaultBuyerEmail,
      });
    }
  }, [isOpen, product.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isAnonymous = form.watch("is_anonymous");
  const visibility = form.watch("visibility");

  async function onCustomizeSubmit(values: GiftCustomizeValues) {
    setSubmitError(null);
    try {
      const res = await createIntent.mutateAsync({
        product_slug: product.slug,
        from_name: values.is_anonymous ? "" : (values.from_name ?? ""),
        custom_message: values.custom_message ?? "",
        visibility: values.visibility,
        buyer_name: values.is_anonymous
          ? "Anonymous"
          : isLoggedIn
          ? defaultBuyerName
          : (values.buyer_name ?? ""),
        buyer_email: isLoggedIn ? defaultBuyerEmail : (values.buyer_email ?? ""),
      });
      setClientSecret(res.client_secret);
      setStep("payment");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to create payment. Please try again."));
    }
  }

  function handlePaymentSuccess() {
    setStep("success");
    toast.success("Gift sent! 🎁");
  }

  function handleClose() {
    if (step === "payment" && !clientSecret) return; // don't close mid-payment accidentally
    onClose();
  }

  const elementsOptions = useMemo(
    () => ({
      clientSecret: clientSecret ?? "",
      appearance: {
        theme: "stripe" as const,
        variables: { borderRadius: "16px" },
      },
    }),
    [clientSecret]
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />

          {/* Panel — drawer on mobile, centered dialog on sm+ */}
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Send ${product.name}`}
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] max-w-lg overflow-y-auto rounded-t-3xl bg-background shadow-[0_-16px_60px_rgba(0,0,0,0.18)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
          >
            {/* Drag handle (mobile only) */}
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />

            {/* Header */}
            <div className="flex items-start gap-4 p-6 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-rose-50 dark:bg-rose-950/30">
                <GiftPreview
                  previewAssetUrl={product.preview_asset_url}
                  category={product.category}
                />
              </div>
              <div className="flex-1">
                <p className="font-bold leading-tight">{product.name}</p>
                <p className="mt-0.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {formatCurrency(product.price, product.currency.toUpperCase())}
                </p>
                {/* Step indicator */}
                <div className="mt-2 flex items-center gap-1.5">
                  {(["customize", "payment", "success"] as Step[]).map((s, i) => (
                    <div
                      key={s}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        step === s
                          ? "w-6 bg-rose-500"
                          : i < ["customize", "payment", "success"].indexOf(step)
                          ? "w-3 bg-rose-300"
                          : "w-3 bg-border"
                      )}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step content */}
            <div className="px-6 pb-8">
              <AnimatePresence mode="wait">
                {step === "customize" && (
                  <motion.div
                    key="customize"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.16 }}
                  >
                    <form
                      className="space-y-4"
                      onSubmit={form.handleSubmit(onCustomizeSubmit)}
                      noValidate
                    >
                      <ErrorNotice message={submitError} />

                      {/* Visibility toggle */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Visibility</label>
                        <p className="text-xs text-muted-foreground">
                          Public or private — your choice.
                        </p>
                        <div className="mt-2 flex gap-2">
                          {(["PUBLIC", "PRIVATE"] as const).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => form.setValue("visibility", v)}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition",
                                visibility === v
                                  ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                  : "border-border bg-background/80 text-muted-foreground hover:border-rose-200"
                              )}
                            >
                              {v === "PUBLIC" ? (
                                <>
                                  <Globe className="h-4 w-4" /> Public
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4" /> Private
                                </>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Anonymous toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isAnonymous ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Send anonymously</p>
                            <p className="text-xs text-muted-foreground">
                              Your name won&apos;t be shown
                            </p>
                          </div>
                        </div>
                        {/* Custom toggle pill */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isAnonymous}
                          onClick={() => form.setValue("is_anonymous", !isAnonymous)}
                          className={cn(
                            "relative h-6 w-11 rounded-full transition-colors",
                            isAnonymous ? "bg-rose-500" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                              isAnonymous ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>

                      {/* From name (hidden when anonymous) */}
                      {!isAnonymous && (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium" htmlFor="gift-from-name">
                            Your name <span className="text-muted-foreground">(optional)</span>
                          </label>
                          <Input
                            id="gift-from-name"
                            placeholder="e.g. Sarah"
                            {...form.register("from_name")}
                          />
                        </div>
                      )}

                      {/* Custom message */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium" htmlFor="gift-message">
                          Personal message{" "}
                          <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <Textarea
                          id="gift-message"
                          placeholder="Happy birthday! Wishing you an amazing day 🎉"
                          rows={3}
                          {...form.register("custom_message")}
                        />
                      </div>

                      {/* Guest-only buyer fields */}
                      {!isLoggedIn && !isAnonymous && (
                        <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            Your details
                          </p>
                          <Input
                            placeholder="Your name"
                            {...form.register("buyer_name")}
                          />
                          {form.formState.errors.buyer_name && (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.buyer_name.message}
                            </p>
                          )}
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...form.register("buyer_email")}
                          />
                          {form.formState.errors.buyer_email && (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.buyer_email.message}
                            </p>
                          )}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full rounded-xl bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
                        disabled={createIntent.isPending}
                      >
                        {createIntent.isPending ? "Creating payment…" : "Continue to Payment →"}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {step === "payment" && clientSecret && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.16 }}
                  >
                    <Elements stripe={stripePromise} options={elementsOptions}>
                      <GiftCheckoutForm
                        slug={slug}
                        onSuccess={handlePaymentSuccess}
                        onBack={() => setStep("customize")}
                      />
                    </Elements>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", damping: 22, stiffness: 280 }}
                    className="py-6 text-center"
                  >
                    <div className="mb-4 text-6xl">🎁</div>
                    <h2 className="font-display text-2xl font-bold">Gift sent!</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {visibility === "PUBLIC"
                        ? "Your gift will appear on the birthday page."
                        : "Your gift was sent privately — only the celebrant will see it."}
                    </p>
                    <div className="mt-6 flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={handleClose}
                      >
                        Close
                      </Button>
                      <Button
                        className="flex-1 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => {
                          setStep("customize");
                          setClientSecret(null);
                          form.reset();
                        }}
                      >
                        Send another
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
