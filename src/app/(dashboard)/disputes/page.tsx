"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, Button, PageHeader, StateBox, StatusBadge } from "@/components/ui";
import type { Dispute, DisputeResolution } from "@/types";

export default function DisputesPage() {
  const qc = useQueryClient();
  const [active, setActive] = useState<Dispute | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["disputes"],
    queryFn: api.disputes,
  });

  const open = data?.filter((d) => d.status === "open") ?? [];
  const resolved = data?.filter((d) => d.status === "resolved") ?? [];

  return (
    <div>
      <PageHeader title="Disputes" subtitle="Resolve open cases by releasing, refunding, or splitting escrow." />

      <Card>
        {isLoading && <StateBox>Loading disputes…</StateBox>}
        {error && <StateBox>{(error as Error).message}</StateBox>}
        {data && data.length === 0 && <StateBox>No disputes on record.</StateBox>}

        {data && data.length > 0 && (
          <div className="divide-y divide-line">
            {[...open, ...resolved].map((d) => (
              <button
                key={d.id}
                onClick={() => setActive(d)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-line/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    {d.resolution && <span className="text-xs font-medium text-mute capitalize">{d.resolution}</span>}
                  </div>
                  <div className="mt-1 truncate text-sm text-ink">{d.reason}</div>
                  <div className="text-xs text-mute">
                    Booking {d.booking_id.slice(0, 8)} · {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-blue">
                  {d.status === "open" ? "Resolve →" : "View"}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {active && (
        <ResolveModal
          dispute={active}
          onClose={() => setActive(null)}
          onResolved={() => {
            qc.invalidateQueries({ queryKey: ["disputes"] });
            setActive(null);
          }}
        />
      )}
    </div>
  );
}

function ResolveModal({
  dispute,
  onClose,
  onResolved,
}: {
  dispute: Dispute;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [resolution, setResolution] = useState<DisputeResolution>("release");
  const [note, setNote] = useState("");
  const [payout, setPayout] = useState("");
  const [refund, setRefund] = useState("");

  const resolve = useMutation({
    mutationFn: () =>
      api.resolveDispute(dispute.id, {
        resolution,
        resolution_note: note || undefined,
        // The backend requires both amounts only for a partial split, and
        // validates that payout + refund equals the escrow amount.
        ...(resolution === "partial"
          ? { provider_payout: Number(payout), customer_refund: Number(refund) }
          : {}),
      }),
    onSuccess: onResolved,
  });

  const isResolved = dispute.status === "resolved";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-semibold text-ink">
          {isResolved ? "Dispute detail" : "Resolve dispute"}
        </h2>

        <div className="mt-4 space-y-3 text-sm">
          <Field label="Reason">{dispute.reason}</Field>
          {dispute.provider_response && <Field label="Provider response">{dispute.provider_response}</Field>}
          {dispute.reason_image_urls.length > 0 && (
            <div className="flex gap-2">
              {dispute.reason_image_urls.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt="evidence" className="h-20 w-20 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        {isResolved ? (
          <div className="mt-5 space-y-2 rounded-xl bg-okSoft p-4 text-sm">
            <div className="font-semibold capitalize text-ok">{dispute.resolution} — resolved</div>
            {dispute.resolution_note && <div className="text-slate">{dispute.resolution_note}</div>}
            <div className="text-slate">Provider payout: {dispute.provider_payout ?? 0}</div>
            <div className="text-slate">Customer refund: {dispute.customer_refund ?? 0}</div>
            <div className="text-slate">Platform commission: {dispute.platform_commission ?? 0}</div>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-semibold text-ink">Resolution</label>
              <div className="flex gap-2">
                {(["release", "refund", "partial"] as DisputeResolution[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition ${
                      resolution === r ? "border-ink bg-ink text-white" : "border-line text-slate hover:bg-line/40"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-mute">
                {resolution === "release" && "Full escrow to provider (net of commission)."}
                {resolution === "refund" && "Full escrow refunded to customer."}
                {resolution === "partial" && "Split escrow — amounts must sum to the escrow total."}
              </p>
            </div>

            {resolution === "partial" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Provider payout</label>
                  <input
                    value={payout}
                    onChange={(e) => setPayout(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Customer refund</label>
                  <input
                    value={refund}
                    onChange={(e) => setRefund(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
                  />
                </div>
              </div>
            )}

            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-ink">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>

            {resolve.error && (
              <p className="mt-3 text-sm font-medium text-danger">{(resolve.error as Error).message}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={() => resolve.mutate()} disabled={resolve.isPending}>
                {resolve.isPending ? "Resolving…" : "Confirm resolution"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
      <div className="text-ink">{children}</div>
    </div>
  );
}
