export type GiftRendererType =
  | "CARD_TEMPLATE"
  | "FLOWER_GIFT"
  | "ANIMATED_MESSAGE"
  | "BADGE_GIFT"
  | "VIDEO_TEMPLATE";

export type GiftCategory = "CARD" | "FLOWER" | "MESSAGE" | "BADGE" | "VIDEO";

export interface GiftCustomizationField {
  name: string;
  type: "text" | "textarea" | "select" | "color" | "number" | "toggle";
  label: string;
  required: boolean;
  max_length?: number;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface GiftProduct {
  id: number;
  name: string;
  slug: string;
  category: GiftCategory;
  description: string;
  price: string;
  currency: string;
  preview_asset_url: string;
  template_asset_url: string;
  catalog_preview_asset_url: string;
  renderer_type: GiftRendererType;
  customization_schema: { fields: GiftCustomizationField[] };
  default_config: Record<string, unknown>;
  layout_config: Record<string, unknown>;
  allow_anonymous_sender: boolean;
  is_ai_generated_product: boolean;
}

export interface GiftPurchase {
  id: number;
  product: GiftProduct;
  from_name: string;
  custom_message: string;
  customization_data: Record<string, unknown>;
  visibility: "PUBLIC" | "PRIVATE";
  is_anonymous: boolean;
  gross_amount: string;
  created_at: string;
  share_url: string;
  download_url: string;
}

export interface CreateGiftIntentPayload {
  product_slug: string;
  from_name: string;
  custom_message: string;
  visibility: "PUBLIC" | "PRIVATE";
  buyer_name: string;
  buyer_email: string;
  is_anonymous: boolean;
  customization_data: Record<string, unknown>;
}

export interface GiftIntentResponse {
  client_secret: string;
  purchase: GiftPurchase;
}
