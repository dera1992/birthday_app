import { z } from "zod";

export const birthdayProfileSchema = z.object({
  slug: z.string().optional(),
  day: z.coerce.number().min(1).max(31),
  month: z.coerce.number().min(1).max(12),
  hide_year: z.boolean().default(true),
  bio: z.string().min(10),
  visibility: z.enum(["PRIVATE", "LINK_ONLY", "PUBLIC"]),
  preferences: z.object({
    interests: z.array(z.string()).default([]),
  }),
  social_links: z.record(z.string()).default({}),
});

export const birthdayProfileDetailsSchema = z.object({
  bio: z.string().min(10),
  interests: z.string().optional(),
  gender: z.enum(["", "MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  date_of_birth: z.string().min(1, "Date of birth is required."),
  marital_status: z.enum(["", "SINGLE", "IN_A_RELATIONSHIP", "MARRIED", "DIVORCED", "WIDOWED", "PREFER_NOT_TO_SAY"]),
  occupation: z.string().optional(),
  instagram: z.string().url("Must be a full URL, e.g. https://instagram.com/you").optional().or(z.literal("")),
  tiktok: z.string().url("Must be a full URL, e.g. https://tiktok.com/@you").optional().or(z.literal("")),
  linkedin: z.string().url("Must be a full URL, e.g. https://linkedin.com/in/you").optional().or(z.literal("")),
  x: z.string().url("Must be a full URL, e.g. https://x.com/you").optional().or(z.literal("")),
});

export const wishlistItemSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  external_url: z.string().url().optional().or(z.literal("")),
  price: z.string().optional(),
  currency: z.string().min(3),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  source_type: z.enum(["CUSTOM", "REFERRAL_PRODUCT"]).default("CUSTOM"),
  referral_product_id: z.number().optional().nullable(),
  allow_contributions: z.boolean().default(false),
  contribution_public: z.boolean().default(true),
  target_amount: z.string().optional().nullable(),
});

export const wishlistContributionSchema = z.object({
  amount: z.string().min(1),
  currency: z.string().min(3),
  contributor_name: z.string().optional(),
  contributor_email: z.string().email().optional().or(z.literal("")),
});

export const wishlistReserveSchema = z.object({
  reserver_name: z.string().min(1),
  reserver_email: z.string().email(),
});

export const supportMessageSchema = z.object({
  sender_name: z.string().optional(),
  body: z.string().min(4),
});

export const supportContributionSchema = z.object({
  amount: z.string().min(1),
  currency: z.string().min(3),
  supporter_name: z.string().optional(),
  supporter_email: z.string().email().optional().or(z.literal("")),
});
