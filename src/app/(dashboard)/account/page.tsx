"use client";

import { useQuery } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { Card, PageHeader, StateBox } from "@/components/ui";
import type { TransactionType } from "@/types";

// Money flowing IN to this wallet vs OUT — drives the +/- sign and color.
const INFLOW: TransactionType[] = ["top_up", "escrow_release", "commission", "refund"];

const LABEL: Record<TransactionType, string> = {
  top_up: "Top up",
  escrow_hold: "Payment held",
  escrow_release: "Job payout",
  commission: "Platform commission",
  withdrawal: "Withdrawal",
  refund: "Refund",
};

export default function AccountPage() {
  const profile = useQuery({ queryKey: ["me"], queryFn: api.me });
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: api.wallet });
  const txns = useQuery({ queryKey: ["wallet-txns"], queryFn: api.walletTransactions });

  const me = profile.data;

  return (
    <div>
      <PageHeader title="My Account" subtitle="Your profile and wallet activity." />

      {/* Profile card */}
      <Card className="mb-6 p-6">
        {profile.isLoading && <StateBox>Loading profile…</StateBox>}
        {profile.error && <StateBox>{(profile.error as Error).message}</StateBox>}
        {me && (
          <div className="flex items-center gap-5">
            {me.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(me.profile_photo_url)} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-line text-2xl font-bold text-slate">
                {(me.name ?? "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="font-display text-2xl font-semibold text-ink">{me.name ?? "Unnamed"}</div>
              <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <Info label="Phone" value={me.phone} />
                <Info label="Email" value={me.email ?? "—"} />
                <Info label="Role" value={me.role} />
                <Info label="Member since" value={new Date(me.created_at).toLocaleDateString()} />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Wallet balance */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-ink px-6 py-7 text-white">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Wallet balance</div>
          {wallet.isLoading ? (
            <div className="mt-1 text-3xl font-bold">…</div>
          ) : wallet.error ? (
            <div className="mt-1 text-sm text-white/70">{(wallet.error as Error).message}</div>
          ) : (
            <div className="mt-1 font-display text-4xl font-bold">
              ${Number(wallet.data?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>
      </Card>

      {/* Transaction history */}
      <Card>
        <div className="border-b border-line px-5 py-3 text-sm font-semibold text-ink">
          Transaction history
        </div>
        {txns.isLoading && <StateBox>Loading history…</StateBox>}
        {txns.error && <StateBox>{(txns.error as Error).message}</StateBox>}
        {txns.data && txns.data.length === 0 && <StateBox>No transactions yet.</StateBox>}

        {txns.data && txns.data.length > 0 && (
          <div className="divide-y divide-line">
            {txns.data.map((t) => {
              const inflow = INFLOW.includes(t.type);
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1">
                    <div className="font-medium text-ink">{LABEL[t.type] ?? t.type}</div>
                    <div className="text-xs text-mute">
                      {new Date(t.created_at).toLocaleString()}
                      {t.description ? ` · ${t.description}` : ""}
                    </div>
                  </div>
                  <div className={`font-semibold ${inflow ? "text-ok" : "text-danger"}`}>
                    {inflow ? "+" : "−"}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-mute">{label}: </span>
      <span className="font-medium capitalize text-ink">{value}</span>
    </div>
  );
}