export type ApiErrorShape = {
  detail?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorShape | string;

  constructor(message: string, status: number, payload?: ApiErrorShape | string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export type AuthTokens = {
  access: string;
  refresh?: string;
};

export type UserVerification = {
  email_verified_at: string | null;
  phone_verified_at: string | null;
  phone_number: string;
  risk_flags: Record<string, unknown>;
};

export type Me = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  verification?: UserVerification;
  birthday_profile_slug?: string | null;
  birthday_profile_completed?: boolean;
};

export type EventRecord = {
  id: number;
  host: number;
  host_profile?: {
    first_name: string;
    last_name: string;
    slug: string;
    bio: string;
    preferences: Record<string, unknown>;
    social_links: Record<string, string>;
    gender: string;
    marital_status: string;
    occupation: string;
    phone_verified: boolean;
    email_verified: boolean;
  };
  payee_user: number | null;
  title: string;
  description: string;
  agenda: string;
  category: string;
  start_at: string;
  end_at: string;
  visibility: string;
  expand_to_strangers: boolean;
  location_point: { lat: number; lng: number };
  radius_meters: number;
  approx_area_label: string;
  min_guests: number;
  max_guests: number;
  criteria: Record<string, unknown>;
  pack?: CuratedPack | null;
  payment_mode: string;
  amount: string | null;
  target_amount: string | null;
  currency: string;
  expense_breakdown: string;
  state: string;
  venue_status: string;
  venue_name: string;
  lock_deadline_at: string | null;
  approved_count: number;
  distance_meters?: number;
  my_application?: { id: number; status: string } | null;
  pending_application_count?: number | null;
  created_at: string;
  updated_at: string;
};

export type EventApplication = {
  id: number;
  event: number;
  applicant: number;
  intro_message: string;
  invite_code_used: string;
  status: string;
  approved_at: string | null;
  created_at: string;
  applicant_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    bio: string;
    slug: string;
    preferences: Record<string, unknown>;
    social_links: Record<string, string>;
    gender: string;
    date_of_birth: string | null;
    marital_status: string;
    occupation: string;
    phone_verified: boolean;
    email_verified: boolean;
  };
};

export type EventInvite = {
  id: number;
  event: number;
  code: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
};

export type PaymentIntentResponse = {
  payment_id: number;
  stripe_payment_intent_id: string;
  client_secret: string | null;
  status: string;
};

export type BirthdayWishlistReservation = {
  id: number;
  reserver_name: string;
  reserver_email: string;
  reserved_at: string;
};

export type BirthdayWishlistItem = {
  id: number;
  title: string;
  description: string;
  external_url: string;
  price: string | null;
  currency: string;
  is_reserved: boolean;
  reservation?: BirthdayWishlistReservation | null;
  created_at: string;
};

export type BirthdayMessage = {
  id: number;
  sender_name: string;
  body: string;
  moderation_status: string;
  created_at: string;
};

export type BirthdayProfile = {
  id: number;
  user: number;
  slug: string;
  first_name: string;
  last_name: string;
  day: number;
  month: number;
  hide_year: boolean;
  bio: string;
  preferences: Record<string, unknown>;
  social_links: Record<string, string>;
  gender: string;
  date_of_birth: string | null;
  marital_status: string;
  occupation: string;
  visibility: string;
  profile_image: string | null;
  wishlist_items: BirthdayWishlistItem[];
  created_at: string;
  updated_at: string;
};

export type SupportContribution = {
  id: number;
  amount: string;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  supporter_name: string;
  supporter_email: string;
  created_at: string;
};

export type SupportContributionIntentResponse = {
  contribution: SupportContribution;
  client_secret: string | null;
  detail: string;
};

export type VenueRecommendation = {
  id: number;
  name: string;
  city: string;
  category: string;
  approx_area_label: string;
  referral_url: string;
  is_sponsored: boolean;
  priority: number;
  neighborhood_tags: string[];
  distance_km?: number | null;
  avg_rating: number | null;
  rating_count: number;
};

export type VenuePartnerAdmin = {
  id: number;
  name: string;
  city: string;
  category: string;
  approx_area_label: string;
  referral_url: string;
  is_active: boolean;
  is_sponsored: boolean;
  priority: number;
  neighborhood_tags: string[];
};

export type CuratedPackDefaults = {
  category?: string;
  agenda_template?: string;
  min_guests?: number;
  max_guests?: number;
  radius_meters?: number;
  payment_mode?: string;
  criteria_defaults?: Record<string, unknown>;
  venue_categories?: string[];
  budget_range_label?: string;
};

export type CuratedPack = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon_emoji: string;
  defaults: CuratedPackDefaults;
};

export type GroupedVenueRecommendation = {
  category: string;
  venues: VenueRecommendation[];
};

export type ConnectAccount = {
  account_type: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: Record<string, unknown>;
  updated_at: string;
};

export type ConnectStatusResponse = {
  has_account: boolean;
  connect_account?: ConnectAccount | null;
};

export type GiftProduct = {
  id: number;
  name: string;
  slug: string;
  category: string;
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

export type GiftPurchaseIntentResponse = {
  purchase: GiftPurchase;
  client_secret: string;
};

export type WalletAccount = {
  pending_balance: string;
  available_balance: string;
  payout_mode: "MANUAL" | "AUTO";
  auto_payout_frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  auto_payout_min_threshold: string;
  updated_at: string;
};

export type WalletLedgerEntry = {
  id: number;
  type: "GIFT_EARNED" | "GIFT_REFUND_REVERSAL" | "PAYOUT" | "ADJUSTMENT";
  amount: string;
  currency: string;
  status: "PENDING" | "AVAILABLE" | "SETTLED";
  created_at: string;
};

export type WithdrawResponse = {
  detail: string;
  stripe_transfer_id: string;
  amount: string;
};

export type Notification = {
  id: number;
  type: "APPLICATION_RECEIVED" | "APPLICATION_APPROVED" | "APPLICATION_DECLINED";
  title: string;
  body: string;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};
