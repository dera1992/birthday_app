import { z } from "zod";

import type { GiftCustomizationField, GiftProduct } from "@/features/gifts/types";


export type GiftCustomizeValues = {
  customization_data: Record<string, string | number | boolean>;
  visibility: "PUBLIC" | "PRIVATE";
  is_anonymous: boolean;
  buyer_name: string;
  buyer_email: string;
};

function buildFieldSchema(field: GiftCustomizationField) {
  switch (field.type) {
    case "text":
    case "textarea": {
      let schema = z.string();
      if (field.required) {
        schema = schema.min(1, `${field.label} is required.`);
      }
      if (field.max_length) {
        schema = schema.max(field.max_length, `${field.label} must be ${field.max_length} characters or fewer.`);
      }
      if (!field.required) {
        return schema.default("");
      }
      return schema;
    }
    case "select": {
      let schema = z.string();
      if (field.required) {
        schema = schema.min(1, `${field.label} is required.`);
      } else {
        schema = schema.default("");
      }
      return schema.refine((value) => !value || field.options?.includes(value), `${field.label} must be a valid option.`);
    }
    case "color": {
      let schema = z.string();
      if (field.required) {
        schema = schema.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, `${field.label} must be a valid color.`);
      } else {
        schema = schema.default("").refine((value) => !value || /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value), `${field.label} must be a valid color.`);
      }
      return schema;
    }
    case "number": {
      let schema = z.preprocess(
        (value) => {
          if (value === "" || value === undefined || value === null || Number.isNaN(value)) {
            return undefined;
          }
          return Number(value);
        },
        z.number().optional()
      );
      if (field.required) {
        schema = schema.refine((value) => value !== undefined, `${field.label} is required.`);
      }
      if (field.min !== undefined) {
        schema = schema.refine((value) => value === undefined || value >= field.min!, `${field.label} must be at least ${field.min}.`);
      }
      if (field.max !== undefined) {
        schema = schema.refine((value) => value === undefined || value <= field.max!, `${field.label} must be at most ${field.max}.`);
      }
      return schema;
    }
    case "toggle":
      return z.boolean().default(false);
    default:
      return z.any();
  }
}


export function buildGiftCustomizeSchema(product: GiftProduct, isLoggedIn: boolean) {
  const customizationShape = Object.fromEntries(
    (product.customization_schema?.fields ?? []).map((field) => [field.name, buildFieldSchema(field)])
  );

  return z.object({
    visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
    is_anonymous: z.boolean().default(false),
    buyer_name: z.string().default(""),
    buyer_email: z.string().email("Enter a valid email address.").or(z.literal("")).default(""),
    customization_data: z.object(customizationShape),
  }).superRefine((values, ctx) => {
    if (!isLoggedIn && !values.is_anonymous) {
      if (!values.buyer_name.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Your name is required.", path: ["buyer_name"] });
      }
      if (!values.buyer_email.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Your email is required.", path: ["buyer_email"] });
      }
    }
    if (!product.allow_anonymous_sender && values.is_anonymous) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "This gift does not allow anonymous sending.", path: ["is_anonymous"] });
    }
  });
}


export function getGiftCustomizeDefaultValues(
  product: GiftProduct,
  defaultBuyerName = "",
  defaultBuyerEmail = ""
): GiftCustomizeValues {
  const customization_data = Object.fromEntries(
    (product.customization_schema?.fields ?? []).map((field) => {
      const initial = product.default_config?.[field.name];
      if (initial !== undefined && initial !== null) {
        return [field.name, initial as string | number | boolean];
      }
      if (field.type === "toggle") {
        return [field.name, false];
      }
      return [field.name, ""];
    })
  );

  return {
    customization_data,
    visibility: "PUBLIC",
    is_anonymous: false,
    buyer_name: defaultBuyerName,
    buyer_email: defaultBuyerEmail,
  };
}


export function getSenderFieldNames(product: GiftProduct) {
  const schemaFieldNames = new Set((product.customization_schema?.fields ?? []).map((field) => field.name));
  return ["sender_name", "from_name"].filter((name) => schemaFieldNames.has(name));
}


export function deriveLegacyGiftFields(customizationData: Record<string, unknown>) {
  return {
    from_name: String(customizationData.sender_name ?? customizationData.from_name ?? ""),
    custom_message: String(customizationData.message ?? customizationData.custom_message ?? ""),
  };
}
