"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/location/LocationPicker";
import type { LocationValue } from "@/components/location/LocationPicker";
import { PackGrid } from "@/components/packs/PackGrid";
import { PackPreviewDrawer } from "@/components/packs/PackPreviewDrawer";
import { useAuth } from "@/features/auth/auth-context";
import { publishEventRequest, useCreateEvent } from "@/features/events/api";
import { usePacks } from "@/features/packs/api";
import { getErrorMessage } from "@/lib/api/errors";
import { eventCreateSchema } from "@/lib/validators/events";
import type { CuratedPack } from "@/lib/api/types";

// ── Constants ────────────────────────────────────────────────────────────────

const MARITAL_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "SINGLE", label: "Single" },
  { value: "IN_A_RELATIONSHIP", label: "In a relationship" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const OCCUPATION_OPTIONS: { value: string; label: string }[] = [
  "Accountant", "Architect", "Artist", "Chef", "Consultant", "Designer",
  "Developer", "Doctor", "Engineer", "Entrepreneur", "Finance", "Lawyer",
  "Manager", "Marketing", "Nurse", "Photographer", "Sales", "Scientist",
  "Student", "Teacher", "Writer",
].map((o) => ({ value: o, label: o }));

const INTEREST_OPTIONS: { value: string; label: string }[] = [
  "Art", "Brunch", "Cocktails", "Cooking", "Dancing", "Fashion",
  "Fitness", "Food & Dining", "Gaming", "Hiking", "Live Events",
  "Music", "Nightlife", "Photography", "Reading", "Sport",
  "Travel", "Wine", "Yoga",
].map((i) => ({ value: i, label: i }));

// ── CheckboxDropdown ──────────────────────────────────────────────────────────

function CheckboxDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select options…",
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  }

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
      ? selected.join(", ")
      : `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-background/80 px-4 text-sm text-left"
      >
        <span className={selected.length === 0 ? "text-muted-foreground" : ""}>{triggerLabel}</span>
        <div className="flex shrink-0 items-center gap-2">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange([]); } }}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-border bg-background shadow-lg">
          <div className="border-b border-border p-2">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No options found</p>
            ) : (
              filtered.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  {opt.label}
                </label>
              ))
            )}
          </div>
          {selected.length > 0 && (
            <div className="flex justify-end border-t border-border p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [locationValue, setLocationValue] = useState<LocationValue | null>({
    lat: 51.5072,
    lng: -0.1276,
    label: "Central London",
  });

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
      no_show_fee_percent: 0,
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
          <form className="grid gap-x-6 gap-y-5 lg:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="lg:col-span-2">
              <ErrorNotice message={submitError} />
            </div>

            {/* ── Basics ──────────────────────────────────────────────── */}
            <div className="lg:col-span-2 border-b pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basics</p>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} {...form.register("description")} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Agenda</Label>
              <Textarea rows={4} {...form.register("agenda")} placeholder="e.g. 7:00 pm — Arrival&#10;7:30 pm — Dinner&#10;9:00 pm — Dancing" />
            </div>

            {/* ── Event details ────────────────────────────────────────── */}
            <div className="lg:col-span-2 border-b pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event details</p>
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
                <option value="DISCOVERABLE">Discoverable — appears in discovery feed</option>
                <option value="INVITE_ONLY">Invite only — link access only</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start date & time</Label>
              <Input type="datetime-local" {...form.register("start_at")} />
            </div>
            <div className="space-y-2">
              <Label>End date & time</Label>
              <Input type="datetime-local" {...form.register("end_at")} />
            </div>

            {/* ── Location ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 border-b pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</p>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Event area</Label>
              <LocationPicker
                value={locationValue}
                onChange={(v) => {
                  setLocationValue(v);
                  form.setValue("location_point", { lat: v.lat, lng: v.lng });
                  form.setValue("approx_area_label", v.label);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Search radius (metres)</Label>
              <Input type="number" {...form.register("radius_meters", { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">How far from this area guests can be located.</p>
            </div>

            {/* ── Capacity ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 border-b pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capacity</p>
            </div>
            <div className="space-y-2">
              <Label>Minimum guests</Label>
              <Input type="number" {...form.register("min_guests", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Maximum guests</Label>
              <Input type="number" {...form.register("max_guests", { valueAsNumber: true })} />
            </div>

            {/* ── Payment ──────────────────────────────────────────────── */}
            <div className="lg:col-span-2 border-b pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</p>
            </div>
            <div className="space-y-2">
              <Label>Payment mode</Label>
              <select className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm" {...form.register("payment_mode")}>
                <option value="FREE">Free — no contribution required</option>
                <option value="PAID">Paid — guests contribute to costs</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input {...form.register("currency")} placeholder="GBP" />
            </div>
            <div className="space-y-2">
              <Label>Contribution per approved guest</Label>
              <Input {...form.register("amount")} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Total amount required</Label>
              <Input {...form.register("target_amount")} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Lock deadline</Label>
              <Input type="datetime-local" {...form.register("lock_deadline_at")} />
            </div>
            <div className="space-y-2">
              <Label>No-show penalty (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={5}
                placeholder="0"
                {...form.register("no_show_fee_percent", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                % of deposit forfeited if a confirmed attendee does not show up. 0 = no penalty.
              </p>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Expense breakdown</Label>
              <Textarea
                rows={3}
                {...form.register("expense_breakdown")}
                placeholder={"Venue booking: 120\nFood and drinks: 110\nCake and decor: 50"}
              />
              <p className="text-xs text-muted-foreground">
                Explain clearly what the money covers so guests can decide whether the plan matches their budget.
              </p>
            </div>

            {/* ── Guest criteria ───────────────────────────────────────── */}
            <div className="lg:col-span-2 border-b pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest criteria</p>
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
                onChange={(event) => {
                  const value = event.target.value;
                  form.setValue("criteria.allowed_genders", value === "BOTH" || value === "" ? [] : [value]);
                }}
                defaultValue="BOTH"
              >
                <option value="BOTH">Any gender</option>
                <option value="MALE">Male only</option>
                <option value="FEMALE">Female only</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Age range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Min</p>
                  <Input
                    type="number"
                    placeholder="18"
                    onChange={(e) => form.setValue("criteria.min_age", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Max</p>
                  <Input
                    type="number"
                    placeholder="99"
                    onChange={(e) => form.setValue("criteria.max_age", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Interests</Label>
              <p className="text-xs text-muted-foreground">Only applicants who share at least one selected interest will match. Leave unselected to allow any.</p>
              <CheckboxDropdown
                options={INTEREST_OPTIONS}
                selected={form.watch("criteria.interests") ?? []}
                onChange={(next) => form.setValue("criteria.interests", next)}
                placeholder="No filter — any interests"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Marital status</Label>
              <p className="text-xs text-muted-foreground">Restrict to applicants with one of these statuses. Leave unselected to allow any.</p>
              <CheckboxDropdown
                options={MARITAL_STATUS_OPTIONS}
                selected={form.watch("criteria.allowed_marital_statuses") ?? []}
                onChange={(next) => form.setValue("criteria.allowed_marital_statuses", next)}
                placeholder="No filter — any marital status"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Occupations</Label>
              <p className="text-xs text-muted-foreground">Restrict to applicants with one of these occupations. Leave unselected to allow any.</p>
              <CheckboxDropdown
                options={OCCUPATION_OPTIONS}
                selected={form.watch("criteria.allowed_occupations") ?? []}
                onChange={(next) => form.setValue("criteria.allowed_occupations", next)}
                placeholder="No filter — any occupation"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.watch("criteria.verified_only")}
                  onChange={(e) => form.setValue("criteria.verified_only", e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Only allow verified users to apply
              </label>
            </div>

            {/* ── Submit ───────────────────────────────────────────────── */}
            <div className="lg:col-span-2 border-t pt-2">
              <div className="grid gap-3 md:grid-cols-2">
                <Button type="submit" className="w-full" disabled={createEvent.isPending} onClick={() => setSubmitMode("draft")}>
                  Save draft
                </Button>
                <Button type="submit" className="w-full" variant="outline" disabled={createEvent.isPending} onClick={() => setSubmitMode("publish")}>
                  Save and publish
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
