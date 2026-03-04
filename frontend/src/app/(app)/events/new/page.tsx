"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PackGrid } from "@/components/packs/PackGrid";
import { PackPreviewDrawer } from "@/components/packs/PackPreviewDrawer";
import { useAuth } from "@/features/auth/auth-context";
import { publishEventRequest, useCreateEvent } from "@/features/events/api";
import { usePacks } from "@/features/packs/api";
import { getErrorMessage } from "@/lib/api/errors";
import { eventCreateSchema } from "@/lib/validators/events";
import type { CuratedPack } from "@/lib/api/types";

type EventValues = z.infer<typeof eventCreateSchema>;
type Step = "pack-select" | "form";

export default function NewEventPage() {
  const { user } = useAuth();
  const createEvent = useCreateEvent();
  const packsQuery = usePacks();
  const [submitMode, setSubmitMode] = useState<"draft" | "publish">("draft");
  const [step, setStep] = useState<Step>("pack-select");
  const [selectedPack, setSelectedPack] = useState<CuratedPack | null>(null);
  const [previewPack, setPreviewPack] = useState<CuratedPack | null>(null);

  const form = useForm<EventValues>({
    resolver: zodResolver(eventCreateSchema),
    defaultValues: {
      pack_slug: null,
      title: "",
      description: "",
      agenda: "",
      category: "DINING",
      start_at: "",
      end_at: "",
      visibility: "DISCOVERABLE",
      expand_to_strangers: false,
      location_point: { lat: 51.5072, lng: -0.1276 },
      radius_meters: 5000,
      approx_area_label: "Central London",
      min_guests: 4,
      max_guests: 8,
      payment_mode: "PAID",
      amount: "35.00",
      target_amount: "280.00",
      currency: "GBP",
      expense_breakdown: "Venue booking: 120\nFood and drinks: 110\nCake and decor: 50",
      lock_deadline_at: "",
      criteria: {
        verified_only: true,
        interests: [],
        allowed_genders: [],
        min_age: undefined,
        max_age: undefined,
        allowed_marital_statuses: [],
        allowed_occupations: [],
        must_pay_to_apply: true,
      },
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!user?.birthday_profile_completed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-4xl">Complete your birthday profile first</CardTitle>
          <CardDescription>
            Shared birthday support does not need a full profile, but hosting does. Finish your birthday profile first so your events and guest approvals are grounded in real profile data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={user?.birthday_profile_slug ? `/birthday-profile/${user.birthday_profile_slug}/edit` : "/birthday-profile/new"}>
              {user?.birthday_profile_slug ? "Finish birthday profile" : "Create birthday profile"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  function handlePackConfirm(pack: CuratedPack | null) {
    if (pack) {
      const d = pack.defaults;
      if (d.category) form.setValue("category", d.category);
      if (d.agenda_template) form.setValue("agenda", d.agenda_template);
      if (d.min_guests != null) form.setValue("min_guests", d.min_guests);
      if (d.max_guests != null) form.setValue("max_guests", d.max_guests);
      if (d.radius_meters != null) form.setValue("radius_meters", d.radius_meters);
      if (d.payment_mode) form.setValue("payment_mode", d.payment_mode);
      if (d.criteria_defaults) {
        const existing = form.getValues("criteria") || {};
        for (const [k, v] of Object.entries(d.criteria_defaults)) {
          if (!(k in existing)) {
            form.setValue(`criteria.${k}` as Parameters<typeof form.setValue>[0], v as never);
          }
        }
      }
      form.setValue("pack_slug", pack.slug);
    } else {
      form.setValue("pack_slug", null);
    }
    setSelectedPack(pack);
    setStep("form");
  }

  async function onSubmit(values: EventValues) {
    setSubmitError(null);
    try {
      const created = await createEvent.mutateAsync(values);
      if (submitMode === "publish") {
        await publishEventRequest(created.id);
        toast.success("Event created and published.");
        window.location.href = `/events/mine?created=${created.id}&published=1`;
        return;
      }

      toast.success("Event draft created.");
      window.location.href = `/events/mine?created=${created.id}`;
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to create event."));
    }
  }

  // Step 1: Pack selection
  if (step === "pack-select") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-4xl">Choose a birthday pack</CardTitle>
            <CardDescription>
              Packs pre-fill your event details and show tailored venue recommendations. You can customise every field after selecting one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PackGrid
              packs={packsQuery.data ?? []}
              isLoading={packsQuery.isLoading}
              selectedSlug={selectedPack?.slug ?? null}
              onSelect={(pack) => setSelectedPack(pack)}
              onPreview={(pack) => setPreviewPack(pack)}
            />
            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={() => handlePackConfirm(null)}>
                Skip — use blank form
              </Button>
              <Button
                disabled={!selectedPack}
                onClick={() => selectedPack && handlePackConfirm(selectedPack)}
              >
                Continue with {selectedPack ? selectedPack.name : "pack"} →
              </Button>
            </div>
          </CardContent>
        </Card>

        <PackPreviewDrawer
          pack={previewPack}
          onClose={() => setPreviewPack(null)}
          onSelect={(pack) => {
            setPreviewPack(null);
            handlePackConfirm(pack);
          }}
        />
      </div>
    );
  }

  // Step 2: Event creation form
  return (
    <div className="space-y-6">
      {selectedPack ? (
        <div className="flex items-center gap-3 rounded-[22px] border border-border bg-background/70 px-4 py-3">
          <span className="text-2xl">{selectedPack.icon_emoji}</span>
          <div>
            <p className="text-sm font-semibold">{selectedPack.name}</p>
            {selectedPack.defaults.budget_range_label ? (
              <p className="text-xs text-muted-foreground">{selectedPack.defaults.budget_range_label}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setStep("pack-select")}>
            Change pack
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-4xl">Create a new event</CardTitle>
          <CardDescription>Create the event as a draft first, then publish it from your host area once the details look right.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-border bg-background/70 p-4">
              <p className="text-sm font-semibold">1. Save draft</p>
              <p className="mt-2 text-sm text-muted-foreground">Drafts are private to you and visible in My Events immediately.</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background/70 p-4">
              <p className="text-sm font-semibold">2. Review host tools</p>
              <p className="mt-2 text-sm text-muted-foreground">Confirm criteria, payout setup, and venue details before going live.</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background/70 p-4">
              <p className="text-sm font-semibold">3. Publish</p>
              <p className="mt-2 text-sm text-muted-foreground">Only published OPEN events show in discovery. Drafts never appear in the feed.</p>
            </div>
          </div>
          <form className="grid gap-6 lg:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="lg:col-span-2">
              <ErrorNotice message={submitError} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Agenda</Label>
              <Textarea {...form.register("agenda")} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm" {...form.register("category")}>
                <option value="DINING">Dining</option>
                <option value="NIGHTLIFE">Nightlife</option>
                <option value="WELLNESS">Wellness</option>
                <option value="OUTDOORS">Outdoors</option>
                <option value="CULTURE">Culture</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <select className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm" {...form.register("visibility")}>
                <option value="DISCOVERABLE">Discoverable</option>
                <option value="INVITE_ONLY">Invite only</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="datetime-local" {...form.register("start_at")} />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input type="datetime-local" {...form.register("end_at")} />
            </div>
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input type="number" step="any" {...form.register("location_point.lat", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input type="number" step="any" {...form.register("location_point.lng", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Approx area</Label>
              <Input {...form.register("approx_area_label")} />
            </div>
            <div className="space-y-2">
              <Label>Radius meters</Label>
              <Input type="number" {...form.register("radius_meters", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Minimum guests</Label>
              <Input type="number" {...form.register("min_guests", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Maximum guests</Label>
              <Input type="number" {...form.register("max_guests", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Payment mode</Label>
              <select className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm" {...form.register("payment_mode")}>
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Contribution per approved guest</Label>
              <Input {...form.register("amount")} />
            </div>
            <div className="space-y-2">
              <Label>Total amount required</Label>
              <Input {...form.register("target_amount")} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input {...form.register("currency")} />
            </div>
            <div className="space-y-2">
              <Label>Lock deadline</Label>
              <Input type="datetime-local" {...form.register("lock_deadline_at")} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Expense breakdown</Label>
              <Textarea
                {...form.register("expense_breakdown")}
                placeholder={"Venue booking: 120\nFood and drinks: 110\nCake and decor: 50"}
              />
              <p className="text-sm text-muted-foreground">
                Explain clearly what the money covers so people can decide whether this birthday plan matches their interest and budget.
              </p>
            </div>
            <div className="space-y-3 lg:col-span-2">
              <Label>Criteria interests (comma separated)</Label>
              <Input
                placeholder="brunch, live-music"
                onChange={(event) =>
                  form.setValue(
                    "criteria.interests",
                    event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                  )
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.watch("criteria.verified_only")}
                  onChange={(event) => form.setValue("criteria.verified_only", event.target.checked)}
                />
                Verified users only
              </label>
            </div>
            <div className="space-y-3">
              <Label>Gender restriction</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
                onChange={(event) => {
                  const value = event.target.value;
                  form.setValue(
                    "criteria.allowed_genders",
                    value === "BOTH" || value === "" ? [] : [value]
                  );
                }}
                defaultValue="BOTH"
              >
                <option value="BOTH">Male and female</option>
                <option value="MALE">Male only</option>
                <option value="FEMALE">Female only</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Minimum age</Label>
                <Input
                  type="number"
                  onChange={(event) =>
                    form.setValue("criteria.min_age", event.target.value ? Number(event.target.value) : undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum age</Label>
                <Input
                  type="number"
                  onChange={(event) =>
                    form.setValue("criteria.max_age", event.target.value ? Number(event.target.value) : undefined)
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Allowed marital statuses</Label>
              <Input
                placeholder="single, married"
                onChange={(event) =>
                  form.setValue(
                    "criteria.allowed_marital_statuses",
                    event.target.value
                      .split(",")
                      .map((value) => value.trim().toUpperCase().replaceAll(" ", "_"))
                      .filter(Boolean)
                  )
                }
              />
            </div>
            <div className="space-y-3">
              <Label>Allowed occupations</Label>
              <Input
                placeholder="designer, engineer"
                onChange={(event) =>
                  form.setValue(
                    "criteria.allowed_occupations",
                    event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>
            <div className="lg:col-span-2">
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createEvent.isPending}
                  onClick={() => setSubmitMode("draft")}
                >
                  Save draft
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  variant="outline"
                  disabled={createEvent.isPending}
                  onClick={() => setSubmitMode("publish")}
                >
                  Save and continue to publish
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
