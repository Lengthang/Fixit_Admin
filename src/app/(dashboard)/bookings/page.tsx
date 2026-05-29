"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, PageHeader, StateBox, StatusBadge } from "@/components/ui";

export default function BookingsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["bookings"], queryFn: api.bookings });

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Every booking across the platform, newest first." />
      <Card className="overflow-hidden">
        {isLoading && <StateBox>Loading bookings…</StateBox>}
        {error && <StateBox>{(error as Error).message}</StateBox>}
        {data && data.length === 0 && <StateBox>No bookings yet.</StateBox>}

        {data && data.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-line/20 text-left text-xs uppercase tracking-wide text-mute">
              <tr>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Provider</th>
                <th className="px-5 py-3 font-semibold">Scheduled</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((b) => (
                <tr key={b.id} className="hover:bg-line/20">
                  <td className="px-5 py-3 font-medium text-ink">{b.customer?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate">{b.provider?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate">{new Date(b.scheduled_at).toLocaleString()}</td>
                  <td className="px-5 py-3 font-semibold text-ink">
                    {b.currency} {b.total_amount}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
