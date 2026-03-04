"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GiftCategoryPills } from "@/components/gifts/GiftCategoryPills";
import { GiftGrid } from "@/components/gifts/GiftGrid";
import { GiftCustomizeModal } from "@/components/gifts/GiftCustomizeModal";
import { GiftsReceivedWall } from "@/components/gifts/GiftsReceivedWall";
import { useGiftCatalog, useBirthdayGifts } from "@/features/gifts/queries";
import { useBirthdayProfile } from "@/features/birthday/api";
import { useAuth } from "@/features/auth/auth-context";
import type { GiftCategory, GiftProduct } from "@/features/gifts/types";

/**
 * /birthday/[slug]/gifts — Full-page digital gift storefront.
 *
 * Gives buyers a focused, distraction-free gift-buying experience
 * with the full product catalog, category filters, and received gifts wall.
 */
export default function GiftStorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { user } = useAuth();

  const profileQuery = useBirthdayProfile(slug);
  const [activeCategory, setActiveCategory] = useState<GiftCategory | "ALL">("ALL");
  const catalogQuery = useGiftCatalog(activeCategory === "ALL" ? undefined : activeCategory);
  const giftsQuery = useBirthdayGifts(slug);
  const [selectedProduct, setSelectedProduct] = useState<GiftProduct | null>(null);

  const profile = profileQuery.data;
  const isOwner = Boolean(user?.id && profile?.user === user.id);

  return (
    <>
      {selectedProduct && (
        <GiftCustomizeModal
          product={selectedProduct}
          slug={slug}
          isOpen
          isLoggedIn={Boolean(user)}
          defaultBuyerName={user ? `${user.first_name} ${user.last_name}`.trim() : ""}
          defaultBuyerEmail={user?.email ?? ""}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-b from-rose-50/60 to-background dark:from-rose-950/20 dark:to-background">
        {/* Hero */}
        <div className="border-b border-border/60 bg-background/80 py-10 text-center backdrop-blur">
          <Badge variant="outline" className="mb-3 border-rose-300 text-rose-600">
            Digital Gift Store
          </Badge>
          <h1 className="font-display text-4xl font-bold">
            {profile ? `Celebrate ${profile.bio ? "them" : "this birthday"}` : "Gift Store"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Send an instant digital gift — cards, flowers, personalised messages and more. Choose
            public or private delivery.
          </p>
          <Button variant="outline" asChild className="mt-5 rounded-full">
            <Link href={`/birthday/${slug}`}>← Back to birthday page</Link>
          </Button>
        </div>

        {/* Catalog */}
        <div className="container py-10">
          <div className="space-y-6">
            <GiftCategoryPills active={activeCategory} onChange={setActiveCategory} />
            <GiftGrid
              products={catalogQuery.data ?? []}
              isLoading={catalogQuery.isLoading}
              onSelect={setSelectedProduct}
            />
          </div>

          {/* Received gifts */}
          <div className="mt-14">
            <GiftsReceivedWall
              gifts={giftsQuery.data ?? []}
              isLoading={giftsQuery.isLoading}
              isOwner={isOwner}
            />
          </div>
        </div>
      </div>
    </>
  );
}
