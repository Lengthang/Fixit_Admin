"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { Card, Button, PageHeader, StateBox, StatusBadge } from "@/components/ui";
import type { Booking, WalletTransaction } from "@/types";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const userQ = useQuery({
    queryKey: ["user-detail", id],
    queryFn: () => api.userDetail(id),
  });

  const bookingsQ = useQuery({ queryKey: ["bookings"], queryFn: api.bookings });
  const disputesQ = useQuery({ queryKey: ["disputes"], queryFn: api.disputes });
  const walletQ = useQuery({
    queryKey: ["user-wallet", id],
    queryFn: () => api.userWallet(id),
  });

  const setBan = useMutation({
    mutationFn: (ban: boolean) => (ban ? api.banUser(id) : api.unbanUser(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-detail", id] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const user = userQ.data;
  const providerId = user?.provider_profile?.id ?? null;

  // Booking history — filtered client-side from the platform-wide list.
  const asCustomer = useMemo<Booking[]>(
    () => bookingsQ.data?.filter((b) => b.customer_id === id) ?? [],
    [bookingsQ.data, id],
  );
  const asProvider = useMemo<Booking[]>(
    () => (providerId ? bookingsQ.data?.filter((b) => b.provider_id === providerId) ?? [] : []),
    [bookingsQ.data, providerId],
  );

  // Disputes raised by this user (counterparty disputes aren't resolvable
  // from the dispute payload alone, so they're intentionally excluded).
  const raisedDisputes = useMemo(
    () => disputesQ.data?.filter((d) => d.raised_by === id) ?? [],
    [disputesQ.data, id],
  );

  return (
    <div>
      <Link href="/users" className="mb-4 inline-block text-sm font-semibold text-slate hover:text-ink">
        ← Back to users
      </Link>

      {userQ.isLoading && <StateBox>Loading user…</StateBox>}
      {userQ.error && <StateBox>{(userQ.error as Error).message}</StateBox>}

      {user && (
        <>
          {/* ── Header / identity ── */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {user.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(user.profile_photo_url)} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-line text-2xl font-bold text-slate">
                  {(user.name ?? "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-display text-3xl font-semibold text-ink">{user.name ?? "Unnamed"}</h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate">
                  <span className="capitalize">{user.role}</span>
                  <span>·</span>
                  <StatusBadge status={user.is_active ? "active" : "banned"} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {user.is_active ? (
                <Button variant="danger" disabled={setBan.isPending} onClick={() => setBan.mutate(true)}>
                  {setBan.isPending ? "Working…" : "Ban user"}
                </Button>
              ) : (
                <Button variant="ok" disabled={setBan.isPending} onClick={() => setBan.mutate(false)}>
                  {setBan.isPending ? "Working…" : "Unban user"}
                </Button>
              )}
            </div>
          </div>

          {setBan.error && (
            <p className="mb-4 text-sm font-medium text-danger">{(setBan.error as Error).message}</p>
          )}

          <div className="space-y-6">
            {/* ── Personal information ── */}
            <Section title="Personal information">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Detail label="Full name" value={user.name ?? "—"} />
                <Detail label="Phone" value={user.phone} />
                <Detail label="Email" value={user.email ?? "—"} />
              </div>
            </Section>

            {/* ── Account details ── */}
            <Section title="Account details">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Detail label="Role" value={user.role} capitalize />
                <DetailNode label="Status">
                  <StatusBadge status={user.is_active ? "active" : "banned"} />
                </DetailNode>
                <Detail label="Registered" value={new Date(user.created_at).toLocaleString()} />
                <Detail label="Last updated" value={new Date(user.updated_at).toLocaleString()} />
                <Detail label="User ID" value={user.id} mono />
                <Detail
                  label="Google linked"
                  value={user.google_id ? "Yes" : "No"}
                />
              </div>
            </Section>

            {/* ── Provider profile ── */}
            {user.provider_profile && (
              <Section title="Provider profile">
                {(() => {
                  const p = user.provider_profile!;
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        <DetailNode label="Verification">
                          <StatusBadge status={p.status} />
                        </DetailNode>
                        <DetailNode label="Availability">
                          <StatusBadge status={p.is_available ? "active" : "rejected"} />
                        </DetailNode>
                        <Detail label="Rating" value={`${p.avg_rating.toFixed(1)} ★`} />
                        <Detail label="Jobs completed" value={String(p.total_jobs_completed ?? 0)} />
                        <Detail label="Experience" value={`${p.years_experience} yrs`} />
                        <Detail label="Location" value={p.location ?? "—"} />
                        <Detail label="Service radius" value={`${p.service_radius_km} km`} />
                        <Detail label="Certification" value={p.certification ?? "—"} />
                      </div>

                      {p.bio && <p className="text-sm leading-relaxed text-slate">{p.bio}</p>}

                      {/* Verification documents */}
                      {(p.certification_url || p.national_id_url) && (
                        <div>
                          <SubLabel>Verification documents</SubLabel>
                          <div className="flex flex-wrap gap-2">
                            {p.certification_url && (
                              <a href={mediaUrl(p.certification_url)} target="_blank" rel="noreferrer">
                                <Button variant="ghost">View certification</Button>
                              </a>
                            )}
                            {p.national_id_url && (
                              <a href={mediaUrl(p.national_id_url)} target="_blank" rel="noreferrer">
                                <Button variant="ghost">View national ID</Button>
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Categories */}
                      {p.categories.length > 0 && (
                        <div>
                          <SubLabel>Categories</SubLabel>
                          <div className="flex flex-wrap gap-1.5">
                            {p.categories.map((c) => (
                              <span key={c.id} className="rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-medium text-slate">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Availability */}
                      {p.availability.length > 0 && (
                        <div>
                          <SubLabel>Weekly availability</SubLabel>
                          <div className="flex flex-wrap gap-2">
                            {p.availability.map((a) => (
                              <span key={a.id} className="rounded-lg border border-line px-2.5 py-1 text-xs text-slate">
                                <span className="font-semibold capitalize text-ink">{a.day_of_week}</span>{" "}
                                {a.open_time.slice(0, 5)}–{a.close_time.slice(0, 5)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Services offered */}
                      {p.services && p.services.length > 0 && (
                        <div>
                          <SubLabel>Services offered</SubLabel>
                          <div className="overflow-hidden rounded-xl border border-line">
                            <table className="w-full text-sm">
                              <thead className="bg-line/20 text-left text-xs uppercase tracking-wide text-mute">
                                <tr>
                                  <th className="px-4 py-2 font-semibold">Service</th>
                                  <th className="px-4 py-2 font-semibold">Price</th>
                                  <th className="px-4 py-2 font-semibold">Duration</th>
                                  <th className="px-4 py-2 font-semibold">Active</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-line">
                                {p.services.map((s) => (
                                  <tr key={s.id}>
                                    <td className="px-4 py-2 font-medium text-ink">{s.title}</td>
                                    <td className="px-4 py-2 text-slate">{s.price}</td>
                                    <td className="px-4 py-2 text-slate">
                                      {s.duration_minutes ? `${s.duration_minutes} min` : "—"}
                                    </td>
                                    <td className="px-4 py-2">
                                      <StatusBadge status={s.is_active ? "active" : "rejected"} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </Section>
            )}

            {/* ── Bookings as customer ── */}
            <Section title="Bookings — as customer">
              <BookingTable
                rows={asCustomer}
                isLoading={bookingsQ.isLoading}
                error={bookingsQ.error as Error | null}
                counterpartyLabel="Provider"
                counterparty={(b) => b.provider?.name ?? "—"}
                empty="No bookings made as a customer."
              />
            </Section>

            {/* ── Bookings as provider ── */}
            {user.provider_profile && (
              <Section title="Bookings — as provider">
                <BookingTable
                  rows={asProvider}
                  isLoading={bookingsQ.isLoading}
                  error={bookingsQ.error as Error | null}
                  counterpartyLabel="Customer"
                  counterparty={(b) => b.customer?.name ?? "—"}
                  empty="No bookings fulfilled as a provider."
                />
              </Section>
            )}

            {/* ── Wallet & payments ── */}
            <Section title="Wallet & payments">
              {walletQ.isLoading && <StateBox>Loading wallet…</StateBox>}
              {walletQ.error && <StateBox>{(walletQ.error as Error).message}</StateBox>}
              {walletQ.data && (
                <>
                  <div className="mb-4 flex items-baseline gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-mute">Balance</span>
                    <span className="font-display text-2xl font-semibold text-ink">{walletQ.data.balance}</span>
                  </div>
                  {walletQ.data.transactions.length === 0 ? (
                    <StateBox>No wallet transactions.</StateBox>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-line">
                      <table className="w-full text-sm">
                        <thead className="bg-line/20 text-left text-xs uppercase tracking-wide text-mute">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Type</th>
                            <th className="px-4 py-2 font-semibold">Amount</th>
                            <th className="px-4 py-2 font-semibold">Description</th>
                            <th className="px-4 py-2 font-semibold">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {walletQ.data.transactions.map((t: WalletTransaction) => (
                            <tr key={t.id}>
                              <td className="px-4 py-2 capitalize text-ink">{t.type.replace(/_/g, " ")}</td>
                              <td className="px-4 py-2 font-medium text-ink">{t.amount}</td>
                              <td className="px-4 py-2 text-slate">{t.description ?? "—"}</td>
                              <td className="px-4 py-2 text-slate">{new Date(t.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </Section>

            {/* ── Disputes ── */}
            <Section title="Disputes raised">
              {disputesQ.isLoading && <StateBox>Loading disputes…</StateBox>}
              {disputesQ.error && <StateBox>{(disputesQ.error as Error).message}</StateBox>}
              {disputesQ.data && raisedDisputes.length === 0 && (
                <StateBox>No disputes raised by this user.</StateBox>
              )}
              {raisedDisputes.length > 0 && (
                <div className="divide-y divide-line">
                  {raisedDisputes.map((d) => (
                    <Link
                      key={d.id}
                      href="/disputes"
                      className="flex items-center gap-4 py-3 hover:bg-line/20"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={d.status} />
                          {d.resolution && (
                            <span className="text-xs font-medium capitalize text-mute">{d.resolution}</span>
                          )}
                        </div>
                        <div className="mt-1 truncate text-sm text-ink">{d.reason}</div>
                        <div className="text-xs text-mute">
                          Booking {d.booking_id.slice(0, 8)} · {new Date(d.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-blue">View →</span>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Local presentation helpers ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h2>
      {children}
    </Card>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">{children}</div>;
}

function Detail({
  label, value, mono = false, capitalize = false,
}: { label: string; value: string; mono?: boolean; capitalize?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
      <div className={`text-ink ${mono ? "font-mono text-xs break-all" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function DetailNode({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function BookingTable({
  rows, isLoading, error, counterpartyLabel, counterparty, empty,
}: {
  rows: Booking[];
  isLoading: boolean;
  error: Error | null;
  counterpartyLabel: string;
  counterparty: (b: Booking) => string;
  empty: string;
}) {
  if (isLoading) return <StateBox>Loading bookings…</StateBox>;
  if (error) return <StateBox>{error.message}</StateBox>;
  if (rows.length === 0) return <StateBox>{empty}</StateBox>;

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-line/20 text-left text-xs uppercase tracking-wide text-mute">
          <tr>
            <th className="px-4 py-2 font-semibold">{counterpartyLabel}</th>
            <th className="px-4 py-2 font-semibold">Scheduled</th>
            <th className="px-4 py-2 font-semibold">Total</th>
            <th className="px-4 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-line/20">
              <td className="px-4 py-2 font-medium text-ink">{counterparty(b)}</td>
              <td className="px-4 py-2 text-slate">{new Date(b.scheduled_at).toLocaleString()}</td>
              <td className="px-4 py-2 font-semibold text-ink">{b.currency} {b.total_amount}</td>
              <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}