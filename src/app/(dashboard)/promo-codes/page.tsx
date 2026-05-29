"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, Button, PageHeader, StateBox, StatusBadge } from "@/components/ui";

export default function PromoCodesPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [pct, setPct] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const { data, isLoading, error } = useQuery({ queryKey: ["promos"], queryFn: api.promoCodes });

  const create = useMutation({
    mutationFn: () =>
      api.createPromo({
        code: code.trim().toUpperCase(),
        discount_percentage: Number(pct),
        max_uses: maxUses ? Number(maxUses) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promos"] });
      setCode(""); setPct(""); setMaxUses("");
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.deactivatePromo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promos"] }),
  });

  return (
    <div>
      <PageHeader title="Promo Codes" subtitle="Create discount codes and deactivate old ones." />

      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE"
            className="rounded-lg border border-line px-3 py-2 text-sm uppercase outline-none focus:border-ink" />
          <input value={pct} onChange={(e) => setPct(e.target.value)} placeholder="% off" inputMode="numeric"
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink" />
          <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Max uses (optional)" inputMode="numeric"
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink" />
          <Button onClick={() => create.mutate()} disabled={create.isPending || !code.trim() || !pct}>
            {create.isPending ? "Creating…" : "Create code"}
          </Button>
        </div>
        {create.error && <p className="mt-3 text-sm font-medium text-danger">{(create.error as Error).message}</p>}
      </Card>

      <Card className="overflow-hidden">
        {isLoading && <StateBox>Loading promo codes…</StateBox>}
        {error && <StateBox>{(error as Error).message}</StateBox>}
        {data && data.length === 0 && <StateBox>No promo codes yet.</StateBox>}

        {data && data.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-line/20 text-left text-xs uppercase tracking-wide text-mute">
              <tr>
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Discount</th>
                <th className="px-5 py-3 font-semibold">Uses</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-line/20">
                  <td className="px-5 py-3 font-mono font-semibold text-ink">{p.code}</td>
                  <td className="px-5 py-3 text-slate">{p.discount_percentage}%</td>
                  <td className="px-5 py-3 text-slate">
                    {p.current_uses}{p.max_uses ? ` / ${p.max_uses}` : ""}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={p.is_active ? "active" : "rejected"} /></td>
                  <td className="px-5 py-3 text-right">
                    {p.is_active && (
                      <Button variant="ghost" disabled={deactivate.isPending} onClick={() => deactivate.mutate(p.id)}>
                        Deactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
