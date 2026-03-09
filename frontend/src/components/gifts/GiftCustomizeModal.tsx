"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Elements } from "@stripe/react-stripe-js";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";

import { GiftAccessActions } from "@/components/gifts/GiftAccessActions";
import { DynamicGiftCustomizationForm } from "@/components/gifts/DynamicGiftCustomizationForm";
import { GiftCheckoutForm } from "@/components/gifts/GiftCheckoutForm";
import { GiftRenderer } from "@/components/gifts/GiftRenderer";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useCreateGiftIntent } from "@/features/gifts/mutations";
import type { GiftProduct, GiftPurchase } from "@/features/gifts/types";
import { getErrorMessage } from "@/lib/api/errors";
import {
  buildGiftCustomizeSchema,
  deriveLegacyGiftFields,
  getGiftCustomizeDefaultValues,
  getSenderFieldNames,
  type GiftCustomizeValues,
} from "@/lib/validators/gifts";
import { stripePromise } from "@/lib/stripe";
import { cn, formatCurrency } from "@/lib/utils";

type Step = "customize" | "payment" | "success";

interface GiftCustomizeModalProps {
  product: GiftProduct;
  slug: string;
  isOpen: boolean;
  isLoggedIn: boolean;
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
  const [createdPurchase, setCreatedPurchase] = useState<GiftPurchase | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const createIntent = useCreateGiftIntent(slug);
  const customizeSchema = useMemo(() => buildGiftCustomizeSchema(product, isLoggedIn), [product, isLoggedIn]);
  const defaultValues = useMemo(
    () => getGiftCustomizeDefaultValues(product, defaultBuyerName, defaultBuyerEmail),
    [product, defaultBuyerEmail, defaultBuyerName]
  );

  const form = useForm<GiftCustomizeValues>({
    resolver: zodResolver(customizeSchema),
    defaultValues,
  });
  const watchedCustomizationData = form.watch("customization_data");
  const watchedFromName = form.watch("from_name");
  const watchedMessage = form.watch("custom_message");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep("customize");
      setClientSecret(null);
      setCreatedPurchase(null);
      setSubmitError(null);
      form.reset(defaultValues);
    }
  }, [defaultValues, form, isOpen, product.slug]);

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

  async function onCustomizeSubmit(values: GiftCustomizeValues) {
    setSubmitError(null);
    try {
      const customizationData = { ...(values.customization_data ?? {}) };
      if (values.is_anonymous) {
        for (const senderField of getSenderFieldNames(product)) {
          customizationData[senderField] = "";
        }
      }

      const legacy = deriveLegacyGiftFields(customizationData);
      const res = await createIntent.mutateAsync({
        product_slug: product.slug,
        from_name: values.is_anonymous ? "" : legacy.from_name,
        custom_message: legacy.custom_message,
        visibility: values.visibility,
        buyer_name: values.is_anonymous ? "Anonymous" : isLoggedIn ? defaultBuyerName : values.buyer_name,
        buyer_email: isLoggedIn ? defaultBuyerEmail : values.buyer_email,
        is_anonymous: values.is_anonymous,
        customization_data: customizationData,
      });
      setCreatedPurchase(res.purchase);
      setClientSecret(res.client_secret);
      setStep("payment");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to create payment. Please try again."));
    }
  }

  function handlePaymentSuccess() {
    setStep("success");
    toast.success("Gift sent!");
  }

  function handleClose() {
    if (step === "payment" && !clientSecret) return;
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
      {isOpen ? (
        <>
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

          <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center sm:inset-0 sm:items-center sm:p-4">
            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label={`Send ${product.name}`}
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 48, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="w-full max-w-2xl overflow-hidden rounded-t-3xl bg-background shadow-[0_-16px_60px_rgba(0,0,0,0.18)] sm:max-h-[min(88dvh,820px)] sm:rounded-3xl sm:shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
            >
              <div className="max-h-[92dvh] overflow-y-auto sm:max-h-[min(88dvh,820px)]">
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />

                <div className="border-b border-border/60 bg-gradient-to-b from-rose-50/80 via-background to-background px-4 pb-4 pt-4 sm:px-6">
                  <GiftRenderer
                    product={product}
                    compact
                    previewMode="demo"
                    customizationData={(watchedCustomizationData as Record<string, unknown> | undefined) ?? {}}
                    message={watchedMessage}
                    fromName={watchedFromName}
                  />
                </div>

                <div className="flex items-start gap-4 p-6 pb-4">
                  <div className="flex-1">
                    <p className="font-bold leading-tight">{product.name}</p>
                    <p className="mt-0.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(product.price, product.currency.toUpperCase())}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {(["customize", "payment", "success"] as Step[]).map((currentStep, index) => (
                        <div
                          key={currentStep}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            step === currentStep
                              ? "w-6 bg-rose-500"
                              : index < ["customize", "payment", "success"].indexOf(step)
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

                <div className="px-6 pb-8">
                  <AnimatePresence mode="wait">
                    {step === "customize" ? (
                      <motion.div
                        key="customize"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.16 }}
                      >
                        <form className="space-y-4" onSubmit={form.handleSubmit(onCustomizeSubmit)} noValidate>
                          <ErrorNotice message={submitError} />
                          <DynamicGiftCustomizationForm form={form} product={product} isLoggedIn={isLoggedIn} />
                          <Button
                            type="submit"
                            className="w-full rounded-xl bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
                            disabled={createIntent.isPending}
                          >
                            {createIntent.isPending ? "Creating payment..." : "Continue to payment"}
                          </Button>
                        </form>
                      </motion.div>
                    ) : null}

                    {step === "payment" && clientSecret ? (
                      <motion.div
                        key="payment"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.16 }}
                      >
                        <Elements stripe={stripePromise} options={elementsOptions}>
                          <GiftCheckoutForm slug={slug} onSuccess={handlePaymentSuccess} onBack={() => setStep("customize")} />
                        </Elements>
                      </motion.div>
                    ) : null}

                    {step === "success" ? (
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
                          {form.getValues("visibility") === "PUBLIC"
                            ? "Your gift will appear on the birthday page."
                            : "Your gift was sent privately - only the celebrant will see it."}
                        </p>
                        {createdPurchase ? (
                          <div className="mt-5 flex justify-center">
                            <GiftAccessActions gift={createdPurchase} />
                          </div>
                        ) : null}
                        <div className="mt-6 flex gap-3">
                          <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>
                            Close
                          </Button>
                          <Button
                            className="flex-1 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                            onClick={() => {
                              setStep("customize");
                              setClientSecret(null);
                              form.reset(defaultValues);
                            }}
                          >
                            Send another
                          </Button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
