export type GiftCategory = "CARD" | "FLOWER" | "MESSAGE" | "BADGE" | "VIDEO";
export type GiftRendererType = "CARD_TEMPLATE" | "FLOWER_GIFT" | "ANIMATED_MESSAGE" | "BADGE_GIFT" | "VIDEO_TEMPLATE";
export type GiftCustomizationFieldType = "text" | "textarea" | "select" | "color" | "number" | "toggle";

export type GiftCustomizationField = {
  name: string;
  type: GiftCustomizationFieldType;
  label: string;
  required: boolean;
  max_length?: number;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
};

export type GiftCustomizationSchema = {
  fields: GiftCustomizationField[];
};

export type GiftTemplateSummary = {
  id: number;
  name: string;
  slug: string;
  renderer_type: GiftRendererType;
  catalog_preview_asset_url: string;
  template_asset_url: string;
  preview_asset_url: string;
  default_config: Record<string, unknown>;
};

export type GiftProduct = {
  id: number;
  name: string;
  slug: string;
  category: GiftCategory;
  description: string;
  price: string;
  currency: string;
  catalog_preview_asset_url: string;
  preview_asset_url: string;
  template_asset_url: string;
  renderer_type: GiftRendererType;
  customization_schema: GiftCustomizationSchema;
  layout_config: Record<string, unknown>;
  default_config: Record<string, unknown>;
  purchase_instructions: string;
  allow_anonymous_sender: boolean;
  template?: GiftTemplateSummary | null;
  // AI generation fields
  is_ai_generated_product: boolean;
  ai_generation_provider: string;
  ai_option_count: number;
  ai_generation_category: string;
};

export type AIGenerationStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "PROCESSING"
  | "GENERATED"
  | "SELECTED"
  | "FAILED";

export type AIGeneratedOption = {
  option_index: number;
  asset_url: string;
  preview_url: string;
  prompt_used: string;
  provider_metadata?: Record<string, unknown>;
};

export type AIGenerationStatusResponse = {
  purchase_id: number;
  generation_status: AIGenerationStatus;
  generated_options: AIGeneratedOption[];
  selected_option_index: number | null;
  selected_asset_url: string;
  is_downloadable: boolean;
  ai_download_url: string;
};

export type GiftPurchase = {
  id: number;
  product: GiftProduct;
  buyer_name: string;
  from_name: string;
  custom_message: string;
  customization_data: Record<string, unknown>;
  rendered_snapshot_url: string;
  is_anonymous: boolean;
  renderer_type: GiftRendererType;
  visibility: "PUBLIC" | "PRIVATE";
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  gross_amount: string;
  celebrant_amount: string;
  share_url: string;
  download_url: string;
  created_at: string;
  // AI generation fields
  generation_status: AIGenerationStatus;
  generated_options: AIGeneratedOption[];
  selected_option_index: number | null;
  selected_asset_url: string;
  ai_download_url: string;
  is_downloadable: boolean;
  ai_prompt_input: Record<string, unknown>;
  effective_asset_url: string;
};

export type AIPromptInput = {
  celebrant_name: string;
  sender_name?: string;
  message: string;
  style: string;
  color_palette?: string;
  tone?: string;
  occasion_subtype?: string;
};

export type CreateGiftIntentPayload = {
  product_slug: string;
  from_name: string;
  custom_message: string;
  visibility: "PUBLIC" | "PRIVATE";
  buyer_name: string;
  buyer_email: string;
  is_anonymous: boolean;
  customization_data: Record<string, unknown>;
  ai_prompt_input?: AIPromptInput;
};

export type GiftIntentResponse = {
  purchase: GiftPurchase;
  client_secret: string;
};
