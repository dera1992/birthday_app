import { z } from "zod";

export const giftCustomizeSchema = z.object({
  from_name: z.string().max(255).optional(),
  custom_message: z.string().max(1000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  is_anonymous: z.boolean().default(false),
  buyer_name: z.string().optional(),
  buyer_email: z.string().email({ message: "Enter a valid email address." }).optional().or(z.literal("")),
});

export type GiftCustomizeValues = z.infer<typeof giftCustomizeSchema>;
