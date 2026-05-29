"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { Card, Button, PageHeader, StateBox, StatusBadge } from "@/components/ui";

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ["users"], queryFn: api.users });

  const setBan = useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) =>
      ban ? api.banUser(id) : api.unbanUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div>
      <PageHeader title="Users" subtitle="Search, ban, or restore accounts." />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, phone, or email…"
        className="mb-4 w-full max-w-sm rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
      />

      {setBan.error && <p className="mb-3 text-sm font-medium text-danger">{(setBan.error as Error).message}</p>}

      <Card className="overflow-hidden">
        {isLoading && <StateBox>Loading users…</StateBox>}
        {error && <StateBox>{(error as Error).message}</StateBox>}
        {data && filtered.length === 0 && <StateBox>No matching users.</StateBox>}

        {filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-line/20 text-left text-xs uppercase tracking-wide text-mute">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-line/20">
                  <td className="px-5 py-3 font-medium text-ink">{u.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate">{u.phone}</td>
                  <td className="px-5 py-3 capitalize text-slate">{u.role}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={u.is_active ? "active" : "banned"} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setViewingId(u.id)}>View</Button>
                      {u.is_active ? (
                        <Button variant="danger" disabled={setBan.isPending}
                          onClick={() => setBan.mutate({ id: u.id, ban: true })}>Ban</Button>
                      ) : (
                        <Button variant="ok" disabled={setBan.isPending}
                          onClick={() => setBan.mutate({ id: u.id, ban: false })}>Unban</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    {viewingId && <UserDetailModal userId={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}

function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => api.userDetail(userId),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        {isLoading && <StateBox>Loading…</StateBox>}
        {error && <StateBox>{(error as Error).message}</StateBox>}
        {data && (
          <>
            <div className="flex items-center gap-4">
              {data.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(data.profile_photo_url)} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-line text-lg font-bold text-slate">
                  {(data.name ?? "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-display text-2xl font-semibold text-ink">{data.name ?? "Unnamed"}</div>
                <div className="text-sm text-slate capitalize">
                  {data.role} · <StatusBadge status={data.is_active ? "active" : "banned"} />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Phone" value={data.phone} />
              <Detail label="Email" value={data.email ?? "—"} />
              <Detail label="Joined" value={new Date(data.created_at).toLocaleDateString()} />
              <Detail label="User ID" value={data.id.slice(0, 8)} />
            </div>

            {data.provider_profile && (
              <div className="mt-5 rounded-xl bg-line/30 p-4">
                <div className="mb-2 font-semibold text-ink">Provider profile</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Detail label="Status" value={data.provider_profile.status} />
                  <Detail label="Rating" value={`${data.provider_profile.avg_rating} ★`} />
                  <Detail label="Experience" value={`${data.provider_profile.years_experience} yrs`} />
                  <Detail label="Location" value={data.provider_profile.location ?? "—"} />
                  <Detail label="Jobs done" value={String(data.provider_profile.total_jobs_completed ?? 0)} />
                  <Detail label="Radius" value={`${data.provider_profile.service_radius_km} km`} />
                </div>
                {data.provider_profile.bio && (
                  <p className="mt-3 text-sm text-slate">{data.provider_profile.bio}</p>
                )}
                {data.provider_profile.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {data.provider_profile.categories.map((c) => (
                      <span key={c.id} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate border border-line">
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
      <div className="text-ink">{value}</div>
    </div>
  );
}