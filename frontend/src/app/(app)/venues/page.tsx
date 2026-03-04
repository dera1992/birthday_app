"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import {
  useAdminVenues,
  useCreateVenue,
  useDeleteVenue,
  useUpdateVenue,
} from "@/features/venues/admin-api";
import { getErrorMessage } from "@/lib/api/errors";
import type { VenuePartnerAdmin } from "@/lib/api/types";

const CITIES = ["London", "Manchester"];
const CATEGORIES = [
  "ACTIVITY", "BAR", "BRUNCH", "CLUB", "DINING", "DINNER",
  "KARAOKE", "LOUNGE", "NIGHTLIFE", "OUTDOOR", "PARK", "PRIVATE",
];

const EMPTY_FORM: Omit<VenuePartnerAdmin, "id"> = {
  name: "",
  city: "London",
  category: "DINING",
  approx_area_label: "",
  referral_url: "",
  is_active: true,
  is_sponsored: false,
  priority: 0,
  neighborhood_tags: [],
};

export default function AdminVenuesPage() {
  const { user } = useAuth();

  const [filters, setFilters] = useState({ city: "", category: "", is_active: "", is_sponsored: "", search: "" });
  const [editing, setEditing] = useState<VenuePartnerAdmin | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<VenuePartnerAdmin, "id">>(EMPTY_FORM);

  const venuesQuery = useAdminVenues(filters);
  const updateVenue = useUpdateVenue();
  const deleteVenue = useDeleteVenue();
  const createVenue = useCreateVenue();

  if (!user?.is_staff) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Admin access only</p>
          <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
        </CardContent>
      </Card>
    );
  }

  function openEdit(venue: VenuePartnerAdmin) {
    setAdding(false);
    setEditing(venue);
    setForm({
      name: venue.name,
      city: venue.city,
      category: venue.category,
      approx_area_label: venue.approx_area_label,
      referral_url: venue.referral_url,
      is_active: venue.is_active,
      is_sponsored: venue.is_sponsored,
      priority: venue.priority,
      neighborhood_tags: venue.neighborhood_tags,
    });
  }

  function openAdd() {
    setEditing(null);
    setAdding(true);
    setForm(EMPTY_FORM);
  }

  function closePanel() {
    setEditing(null);
    setAdding(false);
  }

  async function handleSave() {
    try {
      if (editing) {
        await updateVenue.mutateAsync({ id: editing.id, ...form });
        toast.success("Venue updated.");
      } else {
        await createVenue.mutateAsync(form);
        toast.success("Venue created.");
      }
      closePanel();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save venue."));
    }
  }

  async function handleDelete(venue: VenuePartnerAdmin) {
    if (!window.confirm(`Delete "${venue.name}"? This cannot be undone.`)) return;
    try {
      await deleteVenue.mutateAsync(venue.id);
      toast.success("Venue deleted.");
      if (editing?.id === venue.id) closePanel();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete venue."));
    }
  }

  const venues = venuesQuery.data ?? [];
  const isPanelOpen = editing !== null || adding;
  const isSaving = updateVenue.isPending || createVenue.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-3xl">Venue Partners</CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add venue
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search name…"
              className="w-48"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
            <select
              className="flex h-11 rounded-2xl border border-input bg-background/80 px-4 text-sm"
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            >
              <option value="">All cities</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="flex h-11 rounded-2xl border border-input bg-background/80 px-4 text-sm"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="flex h-11 rounded-2xl border border-input bg-background/80 px-4 text-sm"
              value={filters.is_active}
              onChange={(e) => setFilters((f) => ({ ...f, is_active: e.target.value }))}
            >
              <option value="">Active + inactive</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
            <select
              className="flex h-11 rounded-2xl border border-input bg-background/80 px-4 text-sm"
              value={filters.is_sponsored}
              onChange={(e) => setFilters((f) => ({ ...f, is_sponsored: e.target.value }))}
            >
              <option value="">All</option>
              <option value="true">Sponsored only</option>
              <option value="false">Non-sponsored only</option>
            </select>
          </div>

          {/* Count */}
          <p className="text-sm text-muted-foreground">
            {venuesQuery.isLoading ? "Loading…" : `${venues.length} venue${venues.length !== 1 ? "s" : ""}`}
          </p>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Referral URL</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {venuesQuery.isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">Loading…</td>
                  </tr>
                ) : venues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">No venues found.</td>
                  </tr>
                ) : (
                  venues.map((venue) => (
                    <tr
                      key={venue.id}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${editing?.id === venue.id ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium">{venue.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{venue.city}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[11px]">{venue.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{venue.approx_area_label}</td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <a
                          href={venue.referral_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 truncate text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{venue.referral_url}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{venue.priority}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {venue.is_sponsored && <Badge className="text-[11px]">Sponsored</Badge>}
                          <Badge variant={venue.is_active ? "outline" : "secondary"} className="text-[11px]">
                            {venue.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(venue)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deleteVenue.isPending}
                            onClick={() => handleDelete(venue)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit / Add panel */}
      {isPanelOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{adding ? "Add venue" : `Edit — ${editing?.name}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                >
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Approx area</Label>
                <Input value={form.approx_area_label} onChange={(e) => setForm((f) => ({ ...f, approx_area_label: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Referral URL</Label>
                <Input
                  type="url"
                  value={form.referral_url}
                  onChange={(e) => setForm((f) => ({ ...f, referral_url: e.target.value }))}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Neighborhood tags (comma separated)</Label>
                <Input
                  value={form.neighborhood_tags.join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      neighborhood_tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_sponsored}
                    onChange={(e) => setForm((f) => ({ ...f, is_sponsored: e.target.checked }))}
                  />
                  Sponsored
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving…" : editing ? "Save changes" : "Create venue"}
              </Button>
              <Button variant="ghost" onClick={closePanel}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
