"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { Card, Button, PageHeader, StateBox, StatusBadge } from "@/components/ui";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setIconUrl(url);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const create = useMutation({
    mutationFn: () => api.createCategory({ name: name.trim(), icon_url: iconUrl || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setName(""); setIconUrl("");
      if (fileInput.current) fileInput.current.value = "";
    },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Category> }) =>
      api.updateCategory(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <div>
      <PageHeader title="Categories" subtitle="Service categories shown to customers and providers." />

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name"
            className="flex-1 min-w-[180px] rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink" />
          <div className="flex items-center gap-2">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(iconUrl)} alt="icon" className="h-10 w-10 rounded-lg object-cover border border-line" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-line" />
            )}
            <input ref={fileInput} type="file" accept="image/*" onChange={onFilePicked} className="hidden" />
            <Button variant="ghost" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : iconUrl ? "Change image" : "Upload image"}
            </Button>
          </div>
          <Button onClick={() => create.mutate()} disabled={create.isPending || uploading || !name.trim()}>
            {create.isPending ? "Adding…" : "Add category"}
          </Button>
        </div>
        {uploadError && <p className="mt-3 text-sm font-medium text-danger">{uploadError}</p>}
        {create.error && <p className="mt-3 text-sm font-medium text-danger">{(create.error as Error).message}</p>}
      </Card>

      <Card>
        {isLoading && <StateBox>Loading categories…</StateBox>}
        {error && <StateBox>{(error as Error).message}</StateBox>}
        {data && data.length === 0 && <StateBox>No active categories.</StateBox>}

        {data && data.length > 0 && (
          <div className="divide-y divide-line">
            {data.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                {c.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(c.icon_url)} alt="" className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-line" />
                )}
                <div className="flex-1 font-medium text-ink">{c.name}</div>
                <StatusBadge status={c.is_active ? "active" : "rejected"} />
                <Button variant="ghost" onClick={() => setEditing(c)}>Edit</Button>
                <Button variant="ghost" disabled={update.isPending}
                  onClick={() => update.mutate({ id: c.id, body: { is_active: !c.is_active } })}>
                  {c.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(c.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editing && (
        <EditCategoryModal
          category={editing}
          onClose={() => setEditing(null)}
          onSave={(body) => update.mutate({ id: editing.id, body })}
          saving={update.isPending}
          error={update.error ? (update.error as Error).message : null}
        />
      )}
    </div>
  );
}

function EditCategoryModal({
  category, onClose, onSave, saving, error,
}: {
  category: Category;
  onClose: () => void;
  onSave: (body: Partial<Category>) => void;
  saving: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(category.name);
  const [iconUrl, setIconUrl] = useState(category.icon_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setIconUrl(url);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-semibold text-ink">Edit category</h2>

        <label className="mt-4 mb-1.5 block text-sm font-semibold text-ink">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink" />

        <label className="mt-4 mb-1.5 block text-sm font-semibold text-ink">Icon</label>
        <div className="flex items-center gap-3">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(iconUrl)} alt="icon" className="h-12 w-12 rounded-lg object-cover border border-line" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-line" />
          )}
          <input ref={fileInput} type="file" accept="image/*" onChange={onFilePicked} className="hidden" />
          <Button variant="ghost" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "Change image"}
          </Button>
        </div>
        {uploadError && <p className="mt-2 text-sm font-medium text-danger">{uploadError}</p>}

        {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={saving || uploading || !name.trim()}
            onClick={() => onSave({ name: name.trim(), icon_url: iconUrl || undefined })}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}