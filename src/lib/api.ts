// Single source of truth for talking to the FixIt FastAPI backend.
// - Stores the JWT in localStorage (admin panel runs entirely client-side).
// - Attaches Authorization: Bearer <token> to every request.
// - Throws a readable Error on non-2xx so React Query can surface it.

import type {
  User, UserDetail, ProviderProfile, Booking, Dispute,
  PromoCode, Category, ProviderStatus, DisputeResolution,
  AdminWalletView,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_KEY = "fixit_admin_token";

export const auth = {
  get token() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (auth.token) headers.set("Authorization", `Bearer ${auth.token}`);

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    auth.clear();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    // FastAPI returns { detail: "..." } on errors.
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch { /* non-JSON error body */ }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Helpers for verb + JSON body
const post = <T>(p: string, body?: unknown) =>
  request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const patch = <T>(p: string, body?: unknown) =>
  request<T>(p, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
const del = <T>(p: string) => request<T>(p, { method: "DELETE" });
export function mediaUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;        // already absolute
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}
// ── Typed API surface ──────────────────────────────────────────────
export const api = {
  // Auth
  sendOtp: (phone: string) => post<{ message: string }>("/auth/send-otp", { phone }),
  verifyOtp: (phone: string, code: string) =>
    post<{ access_token: string; is_new_user: boolean }>("/auth/verify-otp", { phone, code }),

  // Providers / approvals
  pendingProviders: () => request<ProviderProfile[]>("/admin/pending"),
  setProviderApproval: (providerId: string, status: ProviderStatus) =>
    patch<ProviderProfile>(`/admin/${providerId}/approval`, { status }),

  // Users
  users: () => request<User[]>("/admin/users"),
  userDetail: (userId: string) => request<UserDetail>(`/admin/providers/${userId}`),
  banUser: (userId: string) => patch<User>(`/admin/${userId}/ban`),
  unbanUser: (userId: string) => patch<User>(`/admin/${userId}/unban`),
  deleteUser: (userId: string) => del<{ message: string }>(`/admin/${userId}/`),
  userWallet: (userId: string) =>
    request<AdminWalletView>(`/admin/users/${userId}/wallet`),

  // Bookings
  bookings: () => request<Booking[]>("/admin/bookings"),

  // Disputes
  disputes: () => request<Dispute[]>("/disputes/"),
  dispute: (id: string) => request<Dispute>(`/disputes/${id}`),
  resolveDispute: (
    id: string,
    body: {
      resolution: DisputeResolution;
      resolution_note?: string;
      provider_payout?: number;
      customer_refund?: number;
    },
  ) => patch<Dispute>(`/disputes/${id}/resolve`, body),

  // Promo codes
  promoCodes: () => request<PromoCode[]>("/admin/promo-codes/"),
  createPromo: (body: Partial<PromoCode>) => post<PromoCode>("/admin/promo-codes/", body),
  deactivatePromo: (id: string) => patch<PromoCode>(`/admin/promo-codes/${id}`),

  // Categories
  categories: () => request<Category[]>("/categories/"),
  createCategory: (body: { name: string; icon_url?: string }) =>
    post<Category>("/categories/", body),
  updateCategory: (id: string, body: Partial<Category>) =>
    patch<Category>(`/categories/${id}`, body),
  deleteCategory: (id: string) => del<{ message: string }>(`/categories/${id}`),
  uploadImage: async (file: File): Promise<{ url: string; path: string }> => {
    const form = new FormData();
    form.append("file", file); // field name must be "file" — matches the backend
    const headers = new Headers();
    // Do NOT set Content-Type here; the browser sets it with the multipart boundary.
    if (auth.token) headers.set("Authorization", `Bearer ${auth.token}`);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/uploads/image`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!res.ok) {
      let detail = `Upload failed (${res.status})`;
      try { const b = await res.json(); if (b?.detail) detail = b.detail; } catch {}
      throw new Error(detail);
    }
    return res.json();
  },
  // Current logged-in user's profile, wallet, and transaction history.
  me: () => request<import("@/types").UserDetail>("/customer/me"),
  wallet: () => request<import("@/types").Wallet>("/payments/wallet"),
  walletTransactions: () =>
    request<import("@/types").WalletTransaction[]>("/payments/wallet/transactions"),
};
