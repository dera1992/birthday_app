export type GiftCategory = "CARD" | "FLOWER" | "MESSAGE" | "BADGE" | "VIDEO";

export type GiftProduct = {
  id: number;
  name: string;
  slug: string;
  category: GiftCategory;
  description: string;
  price: string;
  currency: string;
  preview_asset_url: string;
};

export type GiftPurchase = {
  id: number;
  product: GiftProduct;
  buyer_name: string;
  from_name: string;
  custom_message: string;
  visibility: "PUBLIC" | "PRIVATE";
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  gross_amount: string;
  celebrant_amount: string;
  created_at: string;
};

export type CreateGiftIntentPayload = {
  product_slug: string;
  from_name: string;
  custom_message: string;
  visibility: "PUBLIC" | "PRIVATE";
  buyer_name: string;
  buyer_email: string;
};

export type GiftIntentResponse = {
  purchase: GiftPurchase;
  client_secret: string;
};
