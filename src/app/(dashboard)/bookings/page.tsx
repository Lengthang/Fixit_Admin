"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, PageHeader, StateBox, StatusBadge } from "@/components/ui";
import { useSortableData, SortableTh, type SortableColumn } from "@/lib/sortable";
import type { Booking } from "@/types";

export default function BookingsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["bookings"], queryFn: api.bookings });

  const columns = useMemo<SortableColumn<Booking>[]>(
    () => [
      { key: "customer", type: "text", accessor: (b) => b.customer?.name },
      { key: "provider", type: "text", accessor: (b) => b.provider?.name },
      { key: "scheduled", type: "date", accessor: (b) => b.scheduled_at },
      { key: "total", type: "number", accessor: (b) => Number(b.total_amount) },
      { key: "status", type: "text", accessor: (b) => b.status },
    ],
    [],
  );

  const { sorted, sort, toggle } = useSortableData(data ?? [], columns);

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
                <SortableTh sortKey="customer" sort={sort} onSort={toggle} className="px-5 py-3 font-semibold">Customer</SortableTh>
                <SortableTh sortKey="provider" sort={sort} onSort={toggle} className="px-5 py-3 font-semibold">Provider</SortableTh>
                <SortableTh sortKey="scheduled" sort={sort} onSort={toggle} className="px-5 py-3 font-semibold">Scheduled</SortableTh>
                <SortableTh sortKey="total" sort={sort} onSort={toggle} className="px-5 py-3 font-semibold">Total</SortableTh>
                <SortableTh sortKey="status" sort={sort} onSort={toggle} className="px-5 py-3 font-semibold">Status</SortableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((b) => (
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