"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { LoadingBlock, ErrorState } from "@/components/ui/state-block";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/location/LocationPicker";
import type { LocationValue } from "@/components/location/LocationPicker";
import { useAuth } from "@/features/auth/auth-context";
import { useEvent, useUpdateEvent } from "@/features/events/api";
import { getErrorMessage } from "@/lib/api/errors";
import { eventCreateSchema } from "@/lib/validators/events";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert ISO datetime string to datetime-local input value (YYYY-MM-DDTHH:mm) */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

// ── Page ──────────────────────────────────────────────────────────────────────

type EventValues = z.infer<typeof eventCreateSchema>;

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const eventQuery = useEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const event = eventQuery.data;

  const [locationValue, setLocationValue] = useState<LocationValue | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [populated, setPopulated] = useState(false);

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
      approx_area_label: "",
      min_guests: 4,
      max_guests: 8,
      payment_mode: "PAID",
      amount: "",
      target_amount: "",
      currency: "GBP",
      expense_breakdown: "",
      lock_deadline_at: "",
      criteria: {
        verified_only: false,
        interests: [],
        allowed_genders: [],
        min_age: undefined,
        max_age: undefined,
        allowed_marital_statuses: [],
        allowed_occupations: [],
        must_pay_to_apply: false,
      },
    },
  });

  // Populate form once event data loads
  useEffect(() => {
    if (!event || populated) return;

    const criteria = (event.criteria ?? {}) as {
      verified_only?: boolean;
      interests?: string[];
      allowed_genders?: string[];
      min_age?: number;
      max_age?: number;
      allowed_marital_statuses?: string[];
      allowed_occupations?: string[];
      must_pay_to_apply?: boolean;
    };

    form.reset({
      pack_slug: event.pack?.slug ?? null,
      title: event.title,
      description: event.description,
      agenda: event.agenda,
      category: event.category,
      start_at: toDatetimeLocal(event.start_at),
      end_at: toDatetimeLocal(event.end_at),
      visibility: event.visibility,
      expand_to_strangers: event.expand_to_strangers,
      location_point: event.location_point,
      radius_meters: event.radius_meters,
      approx_area_label: event.approx_area_label,
      min_guests: event.min_guests,
      max_guests: event.max_guests,
      payment_mode: event.payment_mode,
      amount: event.amount ?? "",
      target_amount: event.target_amount ?? "",
      currency: event.currency,
      expense_breakdown: event.expense_breakdown,
      lock_deadline_at: toDatetimeLocal(event.lock_deadline_at),
      criteria: {
        verified_only: criteria.verified_only ?? false,
        interests: criteria.interests ?? [],
        allowed_genders: criteria.allowed_genders ?? [],
        min_age: criteria.min_age,
        max_age: criteria.max_age,
        allowed_marital_statuses: criteria.allowed_marital_statuses ?? [],
        allowed_occupations: criteria.allowed_occupations ?? [],
        must_pay_to_apply: criteria.must_pay_to_apply ?? false,
      },
    });

    setLocationValue({
      lat: event.location_point.lat,
      lng: event.location_point.lng,
      label: event.approx_area_label,
    });

    setPopulated(true);
  }, [event, form, populated]);

  async function onSubmit(values: EventValues) {
    setSubmitError(null);
    try {
      await updateEvent.mutateAsync(values as unknown as Record<string, unknown>);
      toast.success("Event updated successfully.");
      router.push(`/events/${eventId}`);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to update event."));
    }
  }

  if (eventQuery.isLoading) return <LoadingBlock message="Loading event…" />;
  if (eventQuery.error) return <ErrorState description={getErrorMessage(eventQuery.error, "Unable to load this event.")} />;
  if (!event) return null;

  const isHost = event.host === user?.id;
  if (!isHost) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          You do not have permission to edit this event.
        </CardContent>
      </Card>
    );
  }

  const currentGender =
    (form.watch("criteria.allowed_genders") ?? []).length === 1
      ? (form.watch("criteria.allowed_genders") ?? [])[0]
      : "BOTH";

  return (
    <div className="space-y-6">
      {event.pack ? (
        <div className="flex items-center gap-3 rounded-[22px] border border-border bg-background/70 px-4 py-3">
          <span className="text-2xl">{event.pack.icon_emoji}</span>
          <div>
            <p className="text-sm font-semibold">{event.pack.name}</p>
            {event.pack.defaults.budget_range_label ? (
              <p className="text-xs text-muted-foreground">{event.pack.defaults.budget_range_label}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-4xl">Edit event</CardTitle>
          <CardDescription>
            Changes are saved immediately. Guests who have already applied will see the updated details.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                value={currentGender}
                onChange={(e) => {
                  const value = e.target.value;
                  form.setValue("criteria.allowed_genders", value === "BOTH" || value === "" ? [] : [value]);
                }}
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
                    defaultValue={
                      ((event.criteria as { min_age?: number } | null)?.min_age) ?? ""
                    }
                    onChange={(e) => form.setValue("criteria.min_age", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Max</p>
                  <Input
                    type="number"
                    placeholder="99"
                    defaultValue={
                      ((event.criteria as { max_age?: number } | null)?.max_age) ?? ""
                    }
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
                <Button type="submit" className="w-full" disabled={updateEvent.isPending}>
                  {updateEvent.isPending ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href={`/events/${eventId}`}>Cancel</Link>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
