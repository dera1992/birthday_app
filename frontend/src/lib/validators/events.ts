import { z } from "zod";

export const eventFilterSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius: z.number().min(1000).max(50000).default(5000),
  category: z.string().optional(),
});

export const eventCreateSchema = z.object({
  pack_slug: z.string().optional().nullable(),
  title: z.string().min(3),
  description: z.string().min(10),
  agenda: z.string().min(5),
  category: z.string().min(1),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  visibility: z.string().min(1),
  expand_to_strangers: z.boolean(),
  location_point: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
  }),
  radius_meters: z.coerce.number().min(100),
  approx_area_label: z.string().min(2),
  min_guests: z.coerce.number().min(1),
  max_guests: z.coerce.number().min(1),
  payment_mode: z.string().min(1),
  amount: z.string().optional(),
  target_amount: z.string().optional(),
  currency: z.string().min(3),
  expense_breakdown: z.string().min(10),
  no_show_fee_percent: z.number().min(0).max(100).default(0),
  lock_deadline_at: z.string().min(1),
  criteria: z.object({
    verified_only: z.boolean().default(false),
    interests: z.array(z.string()).default([]),
    allowed_genders: z.array(z.string()).default([]),
    min_age: z.coerce.number().optional(),
    max_age: z.coerce.number().optional(),
    allowed_marital_statuses: z.array(z.string()).default([]),
    allowed_occupations: z.array(z.string()).default([]),
    must_pay_to_apply: z.boolean().optional(),
  }),
});

export const applySchema = z.object({
  intro_message: z.string().min(6),
  invite_code: z.string().optional(),
});
