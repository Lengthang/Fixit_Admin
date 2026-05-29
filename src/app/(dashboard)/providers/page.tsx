"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { Card, Button, PageHeader, StateBox, StatusBadge } from "@/components/ui";
import type { ProviderStatus, ProviderProfile } from "@/types";

export default function ProvidersPage() {
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<ProviderProfile | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-providers"],
    queryFn: api.pendingProviders,
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProviderStatus }) =>
      api.setProviderApproval(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-providers"] });
      setViewing(null);
    },
  });

  return (
    <div>
      <PageHeader title="Provider Approvals" subtitle="Review and decide on pending applications." />

      {decide.error && (
        <p className="mb-4 text-sm font-medium text-danger">{(decide.error as Error).message}</p>
      )}

      <Card>
        {isLoading && <StateBox>Loading applications…</StateBox>}
        {error && <StateBox>{(error as Error).message}</StateBox>}
        {data && data.length === 0 && <StateBox>No pending providers. All caught up.</StateBox>}

        {data && data.length > 0 && (
          <div className="divide-y divide-line">
            {data.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                {p.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(p.profile_photo_url)} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-line text-sm font-bold text-slate">
                    {(p.name ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{p.name ?? "Unnamed provider"}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="truncate text-sm text-slate">
                    {p.location ?? "No location"} · {p.years_experience} yrs ·{" "}
                    {p.categories.map((c) => c.name).join(", ") || "No categories"}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" onClick={() => setViewing(p)}>View details</Button>
                  <Button variant="ok" disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: p.id, status: "approved" })}>Approve</Button>
                  <Button variant="danger" disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: p.id, status: "rejected" })}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {viewing && (
        <ProviderDetailModal
          provider={viewing}
          onClose={() => setViewing(null)}
          onDecide={(status) => decide.mutate({ id: viewing.id, status })}
          deciding={decide.isPending}
        />
      )}
    </div>
  );
}

function ProviderDetailModal({
  provider, onClose, onDecide, deciding,
}: {
  provider: ProviderProfile;
  onClose: () => void;
  onDecide: (status: ProviderStatus) => void;
  deciding: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          {provider.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(provider.profile_photo_url)} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-line text-lg font-bold text-slate">
              {(provider.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-display text-2xl font-semibold text-ink">{provider.name ?? "Unnamed"}</div>
            <StatusBadge status={provider.status} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <Detail label="Location" value={provider.location ?? "—"} />
          <Detail label="Experience" value={`${provider.years_experience} years`} />
          <Detail label="Service radius" value={`${provider.service_radius_km} km`} />
          <Detail label="Rating" value={`${provider.avg_rating} ★`} />
          <Detail label="Certification" value={provider.certification ?? "—"} />
          <Detail label="Applied on" value={new Date(provider.created_at).toLocaleDateString()} />
        </div>

        {provider.bio && (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-mute">Bio</div>
            <p className="mt-1 text-sm text-ink">{provider.bio}</p>
          </div>
        )}

        {provider.categories.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-mute">Categories</div>
            <div className="flex flex-wrap gap-1.5">
              {provider.categories.map((c) => (
                <span key={c.id} className="rounded-full border border-line bg-line/30 px-2.5 py-0.5 text-xs font-medium text-slate">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verification documents */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <DocLink label="Certification document" url={provider.certification_url} />
          <DocLink label="National ID" url={provider.national_id_url} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="danger" disabled={deciding} onClick={() => onDecide("rejected")}>Reject</Button>
          <Button variant="ok" disabled={deciding} onClick={() => onDecide("approved")}>Approve</Button>
        </div>
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

function DocLink({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
      {url ? (
        <a href={mediaUrl(url)} target="_blank" rel="noopener noreferrer"
          className="text-sm font-semibold text-blue hover:underline">
          View document →
        </a>
      ) : (
        <div className="text-sm text-mute">Not provided</div>
      )}
    </div>
  );
}