"use client";

import { useMemo, useState, ReactNode } from "react";

// ── Shared, reusable client-side table sorting ──────────────────────────────
// One hook + one header-cell component, used by every existing admin table.
// Nothing here changes layout or markup — it sorts already-fetched rows and
// renders a sort arrow inside the SAME <th> styling the tables already use.

export type SortDir = "asc" | "desc";

// Column data types decide the DEFAULT direction on first click and how values
// are compared. "text" → A→Z, "number" → 1→∞, "date" → oldest→newest first.
export type SortType = "text" | "number" | "date";

export interface SortState {
  key: string;
  dir: SortDir;
}

// The default (first-click) direction per column type, per the spec:
//   text   → A→Z              (asc)
//   number → ascending 1→∞    (asc)
//   date   → oldest→newest    (asc)
const DEFAULT_DIR: Record<SortType, SortDir> = {
  text: "asc",
  number: "asc",
  date: "asc",
};

// Pull a comparable primitive out of a row for a given accessor.
function compareValues(a: unknown, b: unknown, type: SortType): number {
  // Nulls / undefined / empty always sink to the bottom regardless of dir.
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (type === "number") {
    return Number(a) - Number(b);
  }
  if (type === "date") {
    return new Date(a as string).getTime() - new Date(b as string).getTime();
  }
  // text — locale-aware, case-insensitive A→Z
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

// A column definition: how to read its sortable value + what type it is.
export interface SortableColumn<T> {
  key: string;                 // unique id, matches SortableTh `sortKey`
  type: SortType;
  accessor: (row: T) => unknown;
}

export function useSortableData<T>(
  rows: T[],
  columns: SortableColumn<T>[],
) {
  // No active column initially → rows render in their original order.
  const [sort, setSort] = useState<SortState | null>(null);

  const columnByKey = useMemo(() => {
    const m = new Map<string, SortableColumn<T>>();
    columns.forEach((c) => m.set(c.key, c));
    return m;
  }, [columns]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columnByKey.get(sort.key);
    if (!col) return rows;
    const copy = [...rows];
    copy.sort((ra, rb) => {
      const res = compareValues(col.accessor(ra), col.accessor(rb), col.type);
      return sort.dir === "asc" ? res : -res;
    });
    return copy;
  }, [rows, sort, columnByKey]);

  // Click handler: new column → default dir for its type; same column → flip.
  function toggle(key: string) {
    const col = columnByKey.get(key);
    if (!col) return;
    setSort((prev) => {
      if (!prev || prev.key !== key) {
        return { key, dir: DEFAULT_DIR[col.type] };
      }
      // Only one column active at a time — reversing the already-active one.
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  return { sorted, sort, toggle };
}

// Up / down arrow shown on the active column. Neutral (faded both-ways) icon
// shown on inactive sortable columns to signal they're clickable.
function SortArrow({ state }: { state: SortDir | null }) {
  if (state === null) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="ml-1 inline-block h-3.5 w-3.5 opacity-30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 9l4-4 4 4" />
        <path d="M16 15l-4 4-4-4" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="ml-1 inline-block h-3.5 w-3.5 text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {state === "asc" ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
    </svg>
  );
}

// Drop-in replacement for an existing <th>. Pass through the SAME className the
// table already used so the header layout is byte-for-byte unchanged; we only
// wrap the label in a button and append the arrow.
export function SortableTh({
  children,
  sortKey,
  sort,
  onSort,
  className = "",
}: {
  children: ReactNode;
  sortKey: string;
  sort: SortState | null;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = sort?.key === sortKey;
  const dir = active ? sort!.dir : null;
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="-mx-1 inline-flex items-center rounded px-1 font-semibold uppercase tracking-wide transition hover:text-ink"
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        {children}
        <SortArrow state={dir} />
      </button>
    </th>
  );
}