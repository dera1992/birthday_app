"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CuratedPack } from "@/lib/api/types";

interface PackPreviewDrawerProps {
  pack: CuratedPack | null;
  onClose: () => void;
  onSelect: (pack: CuratedPack) => void;
}

export function PackPreviewDrawer({ pack, onClose, onSelect }: PackPreviewDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {pack ? (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer — slides from right on md+, from bottom on mobile */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-y-auto bg-background shadow-2xl md:max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{pack.icon_emoji}</span>
                <div>
                  <p className="font-semibold">{pack.name}</p>
                  {pack.defaults.budget_range_label ? (
                    <p className="text-xs text-muted-foreground">{pack.defaults.budget_range_label}</p>
                  ) : null}
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-6 px-6 py-6">
              {/* Description */}
              <p className="text-sm text-muted-foreground">{pack.description}</p>

              {/* Agenda */}
              {pack.defaults.agenda_template ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Suggested agenda
                  </p>
                  <pre className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">
                    {pack.defaults.agenda_template}
                  </pre>
                </div>
              ) : null}

              {/* Defaults summary */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pre-filled defaults
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {pack.defaults.min_guests != null && pack.defaults.max_guests != null ? (
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Guests</p>
                      <p className="font-medium">
                        {pack.defaults.min_guests}–{pack.defaults.max_guests}
                      </p>
                    </div>
                  ) : null}
                  {pack.defaults.payment_mode ? (
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Payment</p>
                      <p className="font-medium capitalize">{pack.defaults.payment_mode.toLowerCase()}</p>
                    </div>
                  ) : null}
                  {pack.defaults.radius_meters != null ? (
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Radius</p>
                      <p className="font-medium">{(pack.defaults.radius_meters / 1000).toFixed(1)} km</p>
                    </div>
                  ) : null}
                  {pack.defaults.budget_range_label ? (
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-medium">{pack.defaults.budget_range_label}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Venue categories */}
              {pack.defaults.venue_categories?.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Venue recommendations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pack.defaults.venue_categories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4">
              <Button className="w-full" onClick={() => { onSelect(pack); onClose(); }}>
                Use this pack
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
