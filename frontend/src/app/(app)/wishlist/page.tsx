"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ExternalLink, Gift } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBirthdayProfile, useWishlistCancel, useWishlistCreate } from "@/features/birthday/api";
import { useAuth } from "@/features/auth/auth-context";
import { formatCurrency } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/errors";
import { wishlistItemSchema } from "@/lib/validators/birthday";

type WishlistValues = z.infer<typeof wishlistItemSchema>;

export default function WishlistPage() {
  const { user } = useAuth();
  const slug = user?.birthday_profile_slug ?? "";
  const profileQuery = useBirthdayProfile(slug);
  const profile = profileQuery.data;
  const wishlistCreate = useWishlistCreate(slug);
  const [addError, setAddError] = useState<string | null>(null);

  const form = useForm<WishlistValues>({
    resolver: zodResolver(wishlistItemSchema),
    defaultValues: { title: "", description: "", external_url: "", price: "", currency: "GBP" },
  });

  async function onSubmit(values: WishlistValues) {
    setAddError(null);
    try {
      await wishlistCreate.mutateAsync(values);
      toast.success("Wishlist item added.");
      form.reset();
    } catch (err) {
      setAddError(getErrorMessage(err, "Unable to add wishlist item."));
    }
  }

  if (!slug) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Gift className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-semibold">No birthday profile yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your birthday profile first, then you can manage your wishlist here.
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link href="/birthday-profile/new">Create birthday profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = profile?.wishlist_items ?? [];
  const reservedCount = items.filter((i) => i.is_reserved).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage what friends can reserve for your birthday.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/birthday/${slug}`}>View public page →</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total items</p>
            <p className="mt-1 font-display text-4xl">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="mt-1 font-display text-4xl">{reservedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Existing items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your items</CardTitle>
            <CardDescription>
              Reserved items are locked for that friend. You can clear a reservation if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <WishlistItemRow key={item.id} item={item} slug={slug} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add item form */}
      <Card>
        <CardHeader>
          <CardTitle>Add item</CardTitle>
          <CardDescription>
            Add a gift idea for your friends to browse and reserve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorNotice message={addError} />
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Input placeholder="Title (e.g. AirPods Pro)" {...form.register("title")} />
            <Textarea
              placeholder="Description — where to find it, colour, size, etc."
              {...form.register("description")}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="External URL (optional)" {...form.register("external_url")} />
              <Input placeholder="Price (e.g. 49.99)" {...form.register("price")} />
            </div>
            <Input placeholder="Currency (e.g. GBP)" {...form.register("currency")} />
            <Button type="submit" disabled={wishlistCreate.isPending} className="w-full">
              {wishlistCreate.isPending ? "Adding…" : "Add to wishlist"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function WishlistItemRow({
  item,
  slug,
}: {
  item: {
    id: number;
    title: string;
    description: string;
    price: string | null;
    currency: string;
    is_reserved: boolean;
    external_url?: string | null;
    reservation?: { reserver_name: string; reserver_email?: string } | null;
  };
  slug: string;
}) {
  const cancelMutation = useWishlistCancel(item.id, slug);

  async function handleClear() {
    try {
      await cancelMutation.mutateAsync();
      toast.success("Reservation cleared.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to clear reservation."));
    }
  }

  return (
    <div className="rounded-[24px] border border-border bg-background/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{item.title}</p>
            {item.external_url ? (
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
          {item.is_reserved && item.reservation ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Reserved by <strong>{item.reservation.reserver_name}</strong>
              {item.reservation.reserver_email ? ` · ${item.reservation.reserver_email}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="font-semibold">{formatCurrency(item.price, item.currency)}</p>
          <Badge variant={item.is_reserved ? "warning" : "success"}>
            {item.is_reserved ? "Reserved" : "Available"}
          </Badge>
        </div>
      </div>
      {item.is_reserved ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3"
          disabled={cancelMutation.isPending}
          onClick={handleClear}
        >
          {cancelMutation.isPending ? "Clearing…" : "Clear reservation"}
        </Button>
      ) : null}
    </div>
  );
}
