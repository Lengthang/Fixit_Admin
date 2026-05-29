"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, Button, PageHeader, StateBox, StatusBadge } from "@/components/ui";

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

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
                  <td className="px-5 py-3 font-medium text-ink">
                    <Link href={`/users/${u.id}`} className="hover:text-brand hover:underline">
                      {u.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate">{u.phone}</td>
                  <td className="px-5 py-3 capitalize text-slate">{u.role}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={u.is_active ? "active" : "banned"} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/users/${u.id}`}>
                        <Button variant="ghost">View</Button>
                      </Link>
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
    </div>
  );
}