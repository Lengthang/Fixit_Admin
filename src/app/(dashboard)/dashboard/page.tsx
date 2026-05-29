"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Cell,
} from "recharts";
import { api } from "@/lib/api";
import { Card, PageHeader, StateBox } from "@/components/ui";
import type { Booking } from "@/types";

// Bookings whose money actually counts as platform revenue (completed jobs).
const REVENUE_STATUSES = ["completed", "awaiting_confirmation"];

export default function DashboardPage() {
  const users = useQuery({ queryKey: ["users"], queryFn: api.users });
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: api.bookings });
  const disputes = useQuery({ queryKey: ["disputes"], queryFn: api.disputes });
  const pending = useQuery({ queryKey: ["pending-providers"], queryFn: api.pendingProviders });

  const stats = useMemo(() => {
    const u = users.data ?? [];
    const b = bookings.data ?? [];
    const d = disputes.data ?? [];

    const providers = u.filter((x) => x.role === "provider").length;
    const customers = u.filter((x) => x.role === "customer").length;

    const COMMISSION_RATE = 0.15; // keep in sync with backend PLATFORM_COMMISSION_RATE
    const gmv = b
      .filter((x) => REVENUE_STATUSES.includes(x.status))
      .reduce((sum, x) => sum + Number(x.total_amount), 0);
    const revenue = gmv * COMMISSION_RATE;

    const openDisputes = d.filter((x) => x.status === "open").length;

    // Revenue by day (last 14 days), from completed bookings.
    const byDay = new Map<string, number>();
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - i);
      byDay.set(dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }), 0);
    }
    b.filter((x) => REVENUE_STATUSES.includes(x.status)).forEach((x) => {
      const key = new Date(x.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + Number(x.total_amount));
    });
    const revenueSeries = Array.from(byDay, ([date, value]) => ({ date, value }));

    // Booking count by status.
    const statusCounts = new Map<string, number>();
    b.forEach((x) => statusCounts.set(x.status, (statusCounts.get(x.status) ?? 0) + 1));
    const statusSeries = Array.from(statusCounts, ([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
    }));

    return {
      totalUsers: u.length, providers, customers,
      totalBookings: b.length, revenue, gmv, openDisputes,
      pendingCount: pending.data?.length ?? 0,
      revenueSeries, statusSeries,
    };
  }, [users.data, bookings.data, disputes.data, pending.data]);

  const loading = users.isLoading || bookings.isLoading;
  const anyError = users.error || bookings.error;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview at a glance." />

      {anyError && (
        <Card className="mb-6 p-5">
          <StateBox>{((users.error || bookings.error) as Error).message}</StateBox>
        </Card>
      )}

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Commission revenue" value={`$${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} accent="brand" loading={loading} />
        <Kpi label="GMV (total volume)" value={`$${stats.gmv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} loading={loading} />
        <Kpi label="Bookings" value={String(stats.totalBookings)} loading={loading} />
        <Kpi label="Providers" value={String(stats.providers)} loading={loading} />
        <Kpi label="Customers" value={String(stats.customers)} loading={loading} />
      </div>

      {/* Revenue chart */}
      <Card className="mb-6 p-5">
        <div className="mb-4 text-sm font-semibold text-ink">Revenue · last 14 days</div>
        {loading ? (
          <StateBox>Loading chart…</StateBox>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={stats.revenueSeries} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FF6B35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9AA0AE" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9AA0AE" }} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E8EAEF", fontSize: 13 }}
               formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
               />
                <Area type="monotone" dataKey="value" stroke="#FF6B35" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Booking status breakdown */}
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-ink">Bookings by status</div>
          {loading ? (
            <StateBox>Loading…</StateBox>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={stats.statusSeries} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#9AA0AE" }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: "#9AA0AE" }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8EAEF", fontSize: 13 }} cursor={{ fill: "#F7F8FA" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.statusSeries.map((s, i) => (
                      <Cell key={i} fill={statusColor(s.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Needs attention */}
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-ink">Needs attention</div>
          <div className="space-y-3">
            <AttentionRow
              href="/providers"
              label="Pending provider approvals"
              count={stats.pendingCount}
              tone={stats.pendingCount > 0 ? "warn" : "ok"}
            />
            <AttentionRow
              href="/disputes"
              label="Open disputes"
              count={stats.openDisputes}
              tone={stats.openDisputes > 0 ? "danger" : "ok"}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent, loading }: { label: string; value: string; accent?: "brand"; loading: boolean }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${accent === "brand" ? "text-brand" : "text-ink"}`}>
        {loading ? "…" : value}
      </div>
    </Card>
  );
}

function AttentionRow({ href, label, count, tone }: { href: string; label: string; count: number; tone: "ok" | "warn" | "danger" }) {
  const toneClass = { ok: "bg-okSoft text-ok", warn: "bg-warnSoft text-warn", danger: "bg-dangerSoft text-danger" }[tone];
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 hover:bg-line/30">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${toneClass}`}>{count}</span>
    </Link>
  );
}

function statusColor(status: string): string {
  const s = status.replace(/ /g, "_");
  if (["completed", "awaiting_confirmation"].includes(s)) return "#1F9D55";
  if (["pending", "in_progress"].includes(s)) return "#C26A00";
  if (["cancelled", "rejected", "disputed"].includes(s)) return "#D64545";
  return "#2D6CDF";
}