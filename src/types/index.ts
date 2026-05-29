// Types mirror the FastAPI Pydantic schemas exactly.
// snake_case is kept because that's what the API returns — no client remapping.

export type ProviderStatus = "approved" | "pending" | "rejected";
export type UserRole = "customer" | "provider" | "admin";

export interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  is_active: boolean;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  role: string;
  google_id?: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  bio: string | null;
  profile_photo_url: string | null;
  years_experience: number;
  certification: string | null;
  certification_url: string | null;
  national_id_url: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number;
  avg_rating: number;
  is_available: boolean;
  status: ProviderStatus;
  created_at: string;
  categories: Category[];
  // present on detail response
  name?: string | null;
  total_jobs_completed?: number;
}

export interface UserDetail extends User {
  provider_profile: ProviderProfile | null;
}

// ── Bookings ──
export interface CustomerSummary {
  id: string;
  name: string | null;
  profile_photo_url: string | null;
}
export interface ProviderUserSummary {
  id: string;
  name: string | null;
  profile_photo_url: string | null;
  avg_rating: number;
}
export interface BookingItem {
  service_id: string;
  title: string;
  image_url: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
  duration_minutes: number | null;
}
export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  status: string;
  scheduled_at: string;
  address: string;
  notes: string | null;
  created_at: string;
  subtotal: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  has_review: boolean;
  customer: CustomerSummary | null;
  provider: ProviderUserSummary | null;
  items: BookingItem[];
}

// ── Disputes ──
export type DisputeRawStatus = "open" | "resolved";
export type DisputeResolution = "release" | "refund" | "partial";

export interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string;
  reason: string;
  reason_image_urls: string[];
  provider_response: string | null;
  provider_response_image_urls: string[];
  provider_responded_at: string | null;
  status: DisputeRawStatus;
  resolution: DisputeResolution | null;
  resolution_note: string | null;
  provider_payout: number | null;
  customer_refund: number | null;
  platform_commission: number | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ── Promo codes ──
export interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
}


// ── Wallet ──
export interface Wallet {
  id: string;
  user_id: string;
  balance: string;
  created_at: string;
}

export type TransactionType =
  | "top_up" | "escrow_hold" | "escrow_release"
  | "commission" | "withdrawal" | "refund";

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}