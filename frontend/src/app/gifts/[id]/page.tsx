"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { GiftAccessActions } from "@/components/gifts/GiftAccessActions";
import { GiftRenderer } from "@/components/gifts/GiftRenderer";
import { useGiftPurchase } from "@/features/gifts/queries";
import { formatDate } from "@/lib/utils";

export default function GiftSharePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const purchaseId = Number(params.id);
  const token = searchParams.get("token") ?? undefined;
  const giftQuery = useGiftPurchase(Number.isFinite(purchaseId) ? purchaseId : undefined, token);

  const title = useMemo(() => {
    const gift = giftQuery.data;
    if (!gift) return "Digital gift";
    return gift.product.name;
  }, [giftQuery.data]);

  if (giftQuery.isLoading) {
    return <main className="container py-12 text-sm text-muted-foreground">Loading gift…</main>;
  }

  if (giftQuery.isError || !giftQuery.data) {
    return <main className="container py-12 text-sm text-muted-foreground">This gift is unavailable.</main>;
  }

  const gift = giftQuery.data;
  const fromLabel = gift.is_anonymous || !gift.from_name ? "Anonymous" : gift.from_name;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50/60 to-background px-4 py-10 dark:from-rose-950/20">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-[28px] border border-border/70 bg-card/95 p-6 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose-500">Digital gift</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sent by {fromLabel} on {formatDate(gift.created_at)}
          </p>
        </div>

        <div className="rounded-[28px] border border-border/70 bg-card/95 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
          <GiftRenderer
            product={gift.product}
            rendererType={gift.renderer_type}
            customizationData={gift.customization_data}
            message={gift.custom_message}
            fromName={gift.from_name}
          />
        </div>

        <div className="rounded-[24px] border border-border/70 bg-card/95 p-5">
          <GiftAccessActions gift={gift} />
        </div>
      </div>
    </main>
  );
}
