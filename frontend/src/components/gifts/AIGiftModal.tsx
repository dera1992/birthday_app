"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Elements } from "@stripe/react-stripe-js";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { GiftCheckoutForm } from "@/components/gifts/GiftCheckoutForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useCreateGiftIntent } from "@/features/gifts/mutations";
import { useAIGenerationStatus, useSelectAIGiftOption } from "@/features/gifts/queries";
import type { AIGeneratedOption, GiftProduct, GiftPurchase } from "@/features/gifts/types";
import { getErrorMessage } from "@/lib/api/errors";
import { stripePromise } from "@/lib/stripe";
import { cn, formatCurrency } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = "form" | "payment" | "generating" | "pick" | "success";

interface AIGiftModalProps {
  product: GiftProduct;
  slug: string;
  isOpen: boolean;
  isLoggedIn: boolean;
  defaultBuyerName?: string;
  defaultBuyerEmail?: string;
  onClose: () => void;
}

// ── Zod schema ───────────────────────────────────────────────────────────────

const AI_STYLES = ["Playful", "Elegant", "Luxury", "Floral", "Minimal", "Bold"] as const;

const aiGiftFormSchema = z.object({
  celebrant_name: z.string().min(1, "Celebrant name is required").max(100),
  sender_name: z.string().max(100).optional().default(""),
  message: z.string().min(1, "Message is required").max(300, "Max 300 characters"),
  style: z.enum(AI_STYLES, { required_error: "Style is required" }),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  is_anonymous: z.boolean().default(false),
  buyer_name: z.string().max(255).optional().default(""),
  buyer_email: z.string().email("Invalid email").optional().or(z.literal("")).default(""),
});

type AIGiftFormValues = z.infer<typeof aiGiftFormSchema>;

// ── Step indicator ───────────────────────────────────────────────────────────

const STEPS: Step[] = ["form", "payment", "generating", "pick", "success"];

function StepDots({ current }: { current: Step }) {
  const currentIndex = STEPS.indexOf(current);
  return (
    <div className="mt-2 flex items-center gap-1.5">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={cn(
            "h-1.5 rounded-full transition-all",
            s === current ? "w-6 bg-purple-500" : i < currentIndex ? "w-3 bg-purple-300" : "w-3 bg-border"
          )}
        />
      ))}
    </div>
  );
}

// ── Option picker ─────────────────────────────────────────────────────────────

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: AIGeneratedOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
        selected
          ? "border-purple-500 shadow-[0_0_0_4px_rgba(168,85,247,0.15)]"
          : "border-border hover:border-purple-300"
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {option.asset_url ? (
          <img
            src={option.asset_url}
            alt={`Design option ${option.option_index + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-950/40 dark:to-purple-950/40">
            <Sparkles className="h-10 w-10 text-purple-400" />
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-500/20">
            <CheckCircle2 className="h-10 w-10 text-white drop-shadow-lg" />
          </div>
        )}
      </div>
      <div className="p-3 text-center">
        <p className="text-sm font-semibold">
          {selected ? "Selected" : `Option ${option.option_index + 1}`}
        </p>
      </div>
    </button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function AIGiftModal({
  product,
  slug,
  isOpen,
  isLoggedIn,
  defaultBuyerName = "",
  defaultBuyerEmail = "",
  onClose,
}: AIGiftModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [createdPurchase, setCreatedPurchase] = useState<GiftPurchase | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const createIntent = useCreateGiftIntent(slug);
  const generationStatus = useAIGenerationStatus(
    step === "generating" || step === "pick" ? createdPurchase?.id : undefined,
    createdPurchase?.share_token as string | undefined
  );
  const selectOption = useSelectAIGiftOption(
    createdPurchase?.id ?? 0,
    createdPurchase?.share_token as string | undefined
  );

  const form = useForm<AIGiftFormValues>({
    resolver: zodResolver(aiGiftFormSchema),
    defaultValues: {
      celebrant_name: "",
      sender_name: "",
      message: "",
      style: "Elegant",
      visibility: "PUBLIC",
      is_anonymous: false,
      buyer_name: defaultBuyerName,
      buyer_email: defaultBuyerEmail,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setClientSecret(null);
      setCreatedPurchase(null);
      setSelectedOptionIndex(null);
      setSubmitError(null);
      form.reset({
        celebrant_name: "",
        sender_name: defaultBuyerName,
        message: "",
        style: "Elegant",
        visibility: "PUBLIC",
        is_anonymous: false,
        buyer_name: defaultBuyerName,
        buyer_email: defaultBuyerEmail,
      });
    }
  }, [isOpen, defaultBuyerName, defaultBuyerEmail, form]);

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

  // Auto-transition from generating to pick once options are ready
  useEffect(() => {
    if (step !== "generating") return;
    const status = generationStatus.data?.generation_status;
    if (status === "GENERATED" || status === "SELECTED") {
      setStep("pick");
    } else if (status === "FAILED") {
      setSubmitError("AI generation failed. Please contact support or try again.");
      setStep("form");
    }
  }, [generationStatus.data?.generation_status, step]);

  const elementsOptions = useMemo(
    () => ({
      clientSecret: clientSecret ?? "",
      appearance: { theme: "stripe" as const, variables: { borderRadius: "16px" } },
    }),
    [clientSecret]
  );

  async function onFormSubmit(values: AIGiftFormValues) {
    setSubmitError(null);
    try {
      const res = await createIntent.mutateAsync({
        product_slug: product.slug,
        from_name: values.is_anonymous ? "" : values.sender_name ?? "",
        custom_message: values.message,
        visibility: values.visibility,
        buyer_name: values.is_anonymous ? "Anonymous" : isLoggedIn ? defaultBuyerName : values.buyer_name ?? "",
        buyer_email: isLoggedIn ? defaultBuyerEmail : values.buyer_email ?? "",
        is_anonymous: values.is_anonymous,
        customization_data: {},
        ai_prompt_input: {
          celebrant_name: values.celebrant_name,
          sender_name: values.is_anonymous ? "" : values.sender_name ?? "",
          message: values.message,
          style: values.style,
        },
      });
      setCreatedPurchase(res.purchase);
      setClientSecret(res.client_secret);
      setStep("payment");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to create payment. Please try again."));
    }
  }

  function handlePaymentSuccess() {
    setStep("generating");
    toast.success("Payment successful! Generating your AI designs...");
  }

  async function handleSelectOption(index: number) {
    if (!createdPurchase) return;
    setSelectedOptionIndex(index);
    try {
      await selectOption.mutateAsync(index);
      setStep("success");
      toast.success("Design selected! Your AI gift has been sent.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to select design. Please try again."));
      setSelectedOptionIndex(null);
    }
  }

  function handleClose() {
    if (step === "payment" && !clientSecret) return;
    onClose();
  }

  const generatedOptions = generationStatus.data?.generated_options ?? [];

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
              aria-label={`Generate AI ${product.category.toLowerCase()} gift`}
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 48, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="w-full max-w-2xl overflow-hidden rounded-t-3xl bg-background shadow-[0_-16px_60px_rgba(0,0,0,0.18)] sm:max-h-[min(92dvh,860px)] sm:rounded-3xl sm:shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
            >
              <div className="max-h-[92dvh] overflow-y-auto sm:max-h-[min(92dvh,860px)]">
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />

                {/* Header */}
                <div className="border-b border-border/60 bg-gradient-to-b from-purple-50/80 via-background to-background px-4 pb-4 pt-4 sm:px-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 shadow">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 pb-4">
                  <div className="flex-1">
                    <p className="font-bold leading-tight">{product.name}</p>
                    <p className="mt-0.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(product.price, product.currency.toUpperCase())}
                    </p>
                    <StepDots current={step} />
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
                    {/* ── Step: Form ── */}
                    {step === "form" ? (
                      <motion.div key="form" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.16 }}>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Tell us about the gift and we'll generate 2 unique AI designs for you to choose from.
                        </p>
                        <ErrorNotice message={submitError} />
                        <form className="space-y-4" onSubmit={form.handleSubmit(onFormSubmit)} noValidate>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Celebrant Name *</label>
                            <Input {...form.register("celebrant_name")} placeholder="e.g. Emma" />
                            {form.formState.errors.celebrant_name && (
                              <p className="mt-1 text-xs text-destructive">{form.formState.errors.celebrant_name.message}</p>
                            )}
                          </div>

                          {!form.watch("is_anonymous") && (
                            <div>
                              <label className="mb-1 block text-sm font-medium">Your Name</label>
                              <Input {...form.register("sender_name")} placeholder="e.g. Alex" />
                            </div>
                          )}

                          <div>
                            <label className="mb-1 block text-sm font-medium">Message *</label>
                            <Textarea
                              {...form.register("message")}
                              placeholder="Write a personal birthday message..."
                              className="resize-none"
                              rows={3}
                            />
                            {form.formState.errors.message && (
                              <p className="mt-1 text-xs text-destructive">{form.formState.errors.message.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium">Style *</label>
                            <div className="grid grid-cols-3 gap-2">
                              {AI_STYLES.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => form.setValue("style", s)}
                                  className={cn(
                                    "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                                    form.watch("style") === s
                                      ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                      : "border-border hover:border-purple-300"
                                  )}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                            {form.formState.errors.style && (
                              <p className="mt-1 text-xs text-destructive">{form.formState.errors.style.message}</p>
                            )}
                          </div>

                          {!isLoggedIn && (
                            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                              <p className="text-xs font-medium text-muted-foreground">Your contact details</p>
                              <div>
                                <label className="mb-1 block text-xs font-medium">Name</label>
                                <Input {...form.register("buyer_name")} placeholder="Your name" />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium">Email</label>
                                <Input {...form.register("buyer_email")} type="email" placeholder="your@email.com" />
                                {form.formState.errors.buyer_email && (
                                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.buyer_email.message}</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input
                              id="ai-anonymous"
                              type="checkbox"
                              {...form.register("is_anonymous")}
                              className="h-4 w-4 rounded border-border accent-purple-600"
                            />
                            <label htmlFor="ai-anonymous" className="text-sm text-muted-foreground">
                              Send anonymously
                            </label>
                          </div>

                          <Button
                            type="submit"
                            className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 text-white hover:from-rose-700 hover:to-purple-700"
                            disabled={createIntent.isPending}
                          >
                            {createIntent.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating payment...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Continue to payment
                              </>
                            )}
                          </Button>
                        </form>
                      </motion.div>
                    ) : null}

                    {/* ── Step: Payment ── */}
                    {step === "payment" && clientSecret ? (
                      <motion.div key="payment" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.16 }}>
                        <Elements stripe={stripePromise} options={elementsOptions}>
                          <GiftCheckoutForm slug={slug} onSuccess={handlePaymentSuccess} onBack={() => setStep("form")} />
                        </Elements>
                      </motion.div>
                    ) : null}

                    {/* ── Step: Generating ── */}
                    {step === "generating" ? (
                      <motion.div key="generating" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="py-10 text-center">
                        <div className="mb-4 flex justify-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg">
                            <Sparkles className="h-8 w-8 animate-pulse text-white" />
                          </div>
                        </div>
                        <h2 className="font-display text-xl font-bold">Creating your designs...</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Our AI is generating 2 unique designs. This usually takes 15–30 seconds.
                        </p>
                        <div className="mt-6 flex justify-center gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="h-2 w-2 rounded-full bg-purple-400"
                              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ) : null}

                    {/* ── Step: Pick option ── */}
                    {step === "pick" ? (
                      <motion.div key="pick" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        <p className="mb-1 font-semibold">Choose your design</p>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Two unique AI designs have been created. Pick the one you'd like to send.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {generatedOptions.map((option) => (
                            <OptionCard
                              key={option.option_index}
                              option={option}
                              selected={selectedOptionIndex === option.option_index}
                              onSelect={() => handleSelectOption(option.option_index)}
                            />
                          ))}
                        </div>
                        {selectOption.isPending && (
                          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving your selection...
                          </div>
                        )}
                      </motion.div>
                    ) : null}

                    {/* ── Step: Success ── */}
                    {step === "success" ? (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", damping: 22, stiffness: 280 }} className="py-6 text-center">
                        <div className="mb-4 flex justify-center">
                          <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <h2 className="font-display text-2xl font-bold">AI Gift Sent!</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your personalised AI design has been saved and sent to the celebrant.
                        </p>

                        {/* Download button */}
                        {createdPurchase && generationStatus.data?.is_downloadable && generationStatus.data?.ai_download_url ? (
                          <a
                            href={generationStatus.data.ai_download_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-rose-700 hover:to-purple-700"
                          >
                            <Download className="h-4 w-4" />
                            Download your design
                          </a>
                        ) : null}

                        <div className="mt-6 flex gap-3">
                          <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>
                            Close
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
