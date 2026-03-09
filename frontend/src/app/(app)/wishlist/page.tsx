"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ExternalLink, Gift, Lock, Eye, Heart, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useBirthdayProfile,
  useReferralProducts,
  useWishlistCancel,
  useWishlistCreate,
  useWishlistDelete,
  useWishlistUpdate,
} from "@/features/birthday/api";
import { useAuth } from "@/features/auth/auth-context";
import { formatCurrency } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/errors";
import { wishlistItemSchema } from "@/lib/validators/birthday";
import type { BirthdayWishlistItem, ReferralProduct } from "@/lib/api/types";

type WishlistValues = z.infer<typeof wishlistItemSchema>;

const REFERRAL_CATEGORIES = [
  { value: "", label: "All" },
  { value: "TECH", label: "Tech" },
  { value: "BEAUTY", label: "Beauty" },
  { value: "FASHION", label: "Fashion" },
  { value: "HOME", label: "Home" },
  { value: "BOOKS", label: "Books" },
  { value: "FOOD", label: "Food & Drink" },
  { value: "EXPERIENCE", label: "Experience" },
];

export default function WishlistPage() {
  const { user } = useAuth();
  const slug = user?.birthday_profile_slug ?? "";
  const profileQuery = useBirthdayProfile(slug);
  const profile = profileQuery.data;
  const wishlistCreate = useWishlistCreate(slug);
  const [addError, setAddError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"CUSTOM" | "REFERRAL_PRODUCT">("CUSTOM");
  const [selectedProduct, setSelectedProduct] = useState<ReferralProduct | null>(null);
  const [referralCategory, setReferralCategory] = useState("");

  const referralQuery = useReferralProducts(referralCategory || undefined);

  const form = useForm<WishlistValues>({
    resolver: zodResolver(wishlistItemSchema),
    defaultValues: {
      title: "",
      description: "",
      external_url: "",
      price: "",
      currency: "GBP",
      visibility: "PUBLIC",
      source_type: "CUSTOM",
      allow_contributions: false,
      contribution_public: true,
      target_amount: null,
    },
  });

  const allowContributions = form.watch("allow_contributions");

  function selectReferralProduct(product: ReferralProduct) {
    setSelectedProduct(product);
    form.setValue("title", product.name);
    form.setValue("description", product.description);
    form.setValue("external_url", product.affiliate_url);
    form.setValue("price", product.price ?? "");
    form.setValue("currency", product.currency);
    form.setValue("source_type", "REFERRAL_PRODUCT");
    form.setValue("referral_product_id", product.id);
  }

  function clearReferralProduct() {
    setSelectedProduct(null);
    form.setValue("title", "");
    form.setValue("description", "");
    form.setValue("external_url", "");
    form.setValue("price", "");
    form.setValue("source_type", "CUSTOM");
    form.setValue("referral_product_id", null);
  }

  async function onSubmit(values: WishlistValues) {
    setAddError(null);
    try {
      await wishlistCreate.mutateAsync({
        ...values,
        target_amount: values.allow_contributions ? values.target_amount : null,
      });
      toast.success("Wishlist item added.");
      form.reset();
      setSelectedProduct(null);
      setSourceType("CUSTOM");
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
  const privateCount = items.filter((i) => i.visibility === "PRIVATE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage what friends can see and reserve for your birthday.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/birthday/${slug}`}>View public page →</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Private</p>
            <p className="mt-1 font-display text-4xl">{privateCount}</p>
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
            Add a custom wish or pick from our curated marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Source type selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={sourceType === "CUSTOM" ? "default" : "outline"}
              onClick={() => { setSourceType("CUSTOM"); clearReferralProduct(); }}
            >
              <Gift className="mr-1.5 h-3.5 w-3.5" /> Custom wish
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sourceType === "REFERRAL_PRODUCT" ? "default" : "outline"}
              onClick={() => setSourceType("REFERRAL_PRODUCT")}
            >
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> From marketplace
            </Button>
          </div>

          {/* Referral product picker */}
          {sourceType === "REFERRAL_PRODUCT" && !selectedProduct && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {REFERRAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setReferralCategory(cat.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      referralCategory === cat.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {referralQuery.data?.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectReferralProduct(product)}
                    className="rounded-[16px] border border-border bg-background/70 p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="mb-2 h-24 w-full rounded-[10px] object-cover" />
                    )}
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.merchant_name}</p>
                    {product.price && (
                      <p className="mt-1 text-xs font-semibold">{formatCurrency(product.price, product.currency)}</p>
                    )}
                  </button>
                ))}
                {referralQuery.data?.length === 0 && (
                  <p className="col-span-2 text-sm text-muted-foreground">No products in this category yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Selected referral product banner */}
          {selectedProduct && (
            <div className="flex items-center justify-between rounded-[12px] border border-primary/30 bg-primary/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground">{selectedProduct.merchant_name}</p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={clearReferralProduct}>
                Change
              </Button>
            </div>
          )}

          <ErrorNotice message={addError} />
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Input placeholder="Title (e.g. AirPods Pro)" {...form.register("title")} />
            <Textarea
              placeholder="Description — where to find it, colour, size, etc."
              {...form.register("description")}
              rows={2}
            />
            {sourceType === "CUSTOM" && (
              <Input placeholder="External URL (optional)" {...form.register("external_url")} />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Price (e.g. 49.99)" {...form.register("price")} />
              <Input placeholder="Currency (e.g. GBP)" {...form.register("currency")} />
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between rounded-[12px] border border-border bg-background/50 px-4 py-3">
              <div className="flex items-center gap-2">
                {form.watch("visibility") === "PUBLIC" ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {form.watch("visibility") === "PUBLIC" ? "Public" : "Private"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {form.watch("visibility") === "PUBLIC"
                      ? "Visible to friends (hidden after your birthday)"
                      : "Only visible to you"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  form.setValue("visibility", form.watch("visibility") === "PUBLIC" ? "PRIVATE" : "PUBLIC")
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.watch("visibility") === "PUBLIC" ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.watch("visibility") === "PUBLIC" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Contributions toggle */}
            <div className="flex items-center justify-between rounded-[12px] border border-border bg-background/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Accept contributions</p>
                  <p className="text-xs text-muted-foreground">Let friends chip in towards this item</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => form.setValue("allow_contributions", !allowContributions)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  allowContributions ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    allowContributions ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {allowContributions && (
              <div className="space-y-3 rounded-[12px] border border-border bg-background/50 px-4 py-3">
                <Input
                  placeholder="Target amount (e.g. 50.00, max £100)"
                  {...form.register("target_amount")}
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Show amount raised publicly</p>
                  <button
                    type="button"
                    onClick={() => form.setValue("contribution_public", !form.watch("contribution_public"))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.watch("contribution_public") ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        form.watch("contribution_public") ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {form.formState.errors.target_amount && (
                  <p className="text-xs text-destructive">{form.formState.errors.target_amount.message}</p>
                )}
              </div>
            )}

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
  item: BirthdayWishlistItem;
  slug: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description);
  const [editPrice, setEditPrice] = useState(item.price ?? "");
  const [editUrl, setEditUrl] = useState(item.external_url ?? "");
  const [editVisibility, setEditVisibility] = useState<"PUBLIC" | "PRIVATE">(item.visibility);
  const [editAllowContributions, setEditAllowContributions] = useState(item.allow_contributions);
  const [editTargetAmount, setEditTargetAmount] = useState(item.target_amount ?? "");
  const [editContributionPublic, setEditContributionPublic] = useState(item.contribution_public);
  const updateMutation = useWishlistUpdate(item.id, slug);
  const deleteMutation = useWishlistDelete(item.id, slug);
  const cancelMutation = useWishlistCancel(item.id, slug);

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({
        title: editTitle,
        description: editDescription,
        price: editPrice || null,
        external_url: editUrl || "",
        visibility: editVisibility,
        allow_contributions: editAllowContributions,
        contribution_public: editContributionPublic,
        target_amount: editAllowContributions ? editTargetAmount || null : null,
      });
      toast.success("Item updated.");
      setEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update item."));
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync();
      toast.success("Item deleted.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to delete item."));
    }
  }

  async function handleClear() {
    try {
      await cancelMutation.mutateAsync(undefined);
      toast.success("Reservation cleared.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to clear reservation."));
    }
  }

  if (editing) {
    return (
      <div className="rounded-[24px] border border-primary/30 bg-background/70 p-4 space-y-3">
        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
        <Textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description"
          rows={2}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="External URL (optional)" />
          <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Price (optional)" />
        </div>

        {/* Visibility toggle */}
        <div className="flex items-center justify-between rounded-[12px] border border-border bg-background/50 px-4 py-3">
          <div className="flex items-center gap-2">
            {editVisibility === "PUBLIC" ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">{editVisibility === "PUBLIC" ? "Public" : "Private"}</p>
              <p className="text-xs text-muted-foreground">
                {editVisibility === "PUBLIC" ? "Visible to friends" : "Only visible to you"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditVisibility(editVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              editVisibility === "PUBLIC" ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                editVisibility === "PUBLIC" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Contributions toggle */}
        <div className="flex items-center justify-between rounded-[12px] border border-border bg-background/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Accept contributions</p>
              <p className="text-xs text-muted-foreground">Let friends chip in towards this item</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditAllowContributions(!editAllowContributions)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              editAllowContributions ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                editAllowContributions ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {editAllowContributions && (
          <div className="space-y-3 rounded-[12px] border border-border bg-background/50 px-4 py-3">
            <Input
              value={editTargetAmount}
              onChange={(e) => setEditTargetAmount(e.target.value)}
              placeholder="Target amount (e.g. 50.00, max £100)"
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Show amount raised publicly</p>
              <button
                type="button"
                onClick={() => setEditContributionPublic(!editContributionPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  editContributionPublic ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    editContributionPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={!editTitle.trim() || updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const effectiveUrl = item.external_url || item.referral_product?.affiliate_url;
  const progressPct =
    item.allow_contributions && item.target_amount
      ? Math.min((parseFloat(item.amount_raised) / parseFloat(item.target_amount)) * 100, 100)
      : null;

  return (
    <div className="rounded-[24px] border border-border bg-background/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{item.title}</p>
            {effectiveUrl ? (
              <a href={effectiveUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <Badge variant={item.visibility === "PUBLIC" ? "default" : "secondary"} className="text-[10px]">
              {item.visibility === "PUBLIC" ? (
                <><Eye className="mr-1 h-2.5 w-2.5" />Public</>
              ) : (
                <><Lock className="mr-1 h-2.5 w-2.5" />Private</>
              )}
            </Badge>
            {item.source_type === "REFERRAL_PRODUCT" && (
              <Badge variant="outline" className="text-[10px]">
                <ShoppingBag className="mr-1 h-2.5 w-2.5" />Marketplace
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
          {item.is_reserved && item.reservation ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Reserved by <strong>{item.reservation.reserver_name}</strong>
              {item.reservation.reserver_email ? ` · ${item.reservation.reserver_email}` : ""}
            </p>
          ) : null}
          {item.allow_contributions && item.target_amount && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <Heart className="mr-1 inline h-3 w-3" />
                  {formatCurrency(item.amount_raised, item.currency)} raised
                </span>
                <span>Goal: {formatCurrency(item.target_amount, item.currency)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {item.is_fully_funded && (
                <p className="text-xs font-medium text-green-600">Fully funded!</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="font-semibold">{formatCurrency(item.price, item.currency)}</p>
          <Badge variant={item.is_reserved ? "warning" : "success"}>
            {item.is_reserved ? "Reserved" : "Available"}
          </Badge>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:text-rose-700"
          disabled={deleteMutation.isPending}
          onClick={handleDelete}
        >
          {deleteMutation.isPending ? "Deleting…" : "Delete"}
        </Button>
        {item.is_reserved ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={cancelMutation.isPending}
            onClick={handleClear}
          >
            {cancelMutation.isPending ? "Clearing…" : "Clear reservation"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
