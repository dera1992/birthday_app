"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Expand, X } from "lucide-react";

import { GiftRenderer } from "@/components/gifts/GiftRenderer";
import { getPreviewShell } from "@/components/gifts/renderers/presentation";
import { Button } from "@/components/ui/button";
import type { GiftProduct } from "@/features/gifts/types";
import { formatCurrency } from "@/lib/utils";

interface GiftPreviewModalProps {
  product: GiftProduct;
  isOpen: boolean;
  onClose: () => void;
  onCustomize: (product: GiftProduct) => void;
}

export function GiftPreviewModal({ product, isOpen, onClose, onCustomize }: GiftPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const previewShell = getPreviewShell(product);

  useEffect(() => {
    setMounted(true);
  }, []);

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
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center sm:inset-0 sm:items-center sm:p-4">
            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label={`Preview ${product.name}`}
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 48, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-background shadow-[0_-16px_60px_rgba(0,0,0,0.18)] sm:rounded-3xl sm:shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
            >
              <div className="max-h-[92dvh] overflow-y-auto sm:max-h-[90dvh]">
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />

                <div className="flex items-start justify-between gap-4 border-b border-border/60 p-6 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Gift Preview</p>
                    <h2 className="mt-1 text-2xl font-bold">{product.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(product.price, product.currency.toUpperCase())}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6 p-6">
                  {previewShell === "studio_card" ? (
                    <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(244,244,245,0.9)_44%,rgba(226,232,240,0.84))] p-5 shadow-sm">
                      <div className="pointer-events-none absolute -left-12 top-0 h-44 w-44 rounded-full bg-rose-200/30 blur-3xl" />
                      <div className="pointer-events-none absolute -right-12 top-2 h-44 w-44 rounded-full bg-sky-200/30 blur-3xl" />
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(251,113,133,0.3),transparent_2%),radial-gradient(circle_at_84%_18%,rgba(96,165,250,0.24),transparent_2%),radial-gradient(circle_at_12%_78%,rgba(45,212,191,0.24),transparent_2%),radial-gradient(circle_at_87%_82%,rgba(250,204,21,0.24),transparent_2%),radial-gradient(circle_at_68%_8%,rgba(168,85,247,0.18),transparent_1.5%)] opacity-90" />
                      <div className="relative mx-auto max-w-[420px] rounded-[32px] border border-white/70 bg-white/92 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                        <GiftRenderer product={product} previewMode="demo" />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-border/60 bg-gradient-to-b from-rose-50/80 via-background to-background p-4 shadow-sm sm:p-5">
                      <div className="mx-auto w-full max-w-[320px]">
                        <GiftRenderer product={product} previewMode="demo" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="text-sm text-muted-foreground">
                      This preview uses sample text so buyers can see the final design before personalizing it.
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="rounded-xl" onClick={onClose}>
                        Close
                      </Button>
                      <Button
                        className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => onCustomize(product)}
                      >
                        <Expand className="h-4 w-4" aria-hidden />
                        Customize & Send
                      </Button>
                    </div>
                  </div>
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
