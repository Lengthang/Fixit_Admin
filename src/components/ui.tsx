"use client";

import { ReactNode } from "react";

// ── StatusBadge: colored pill for provider/dispute/booking statuses ──
const TONE: Record<string, string> = {
  approved: "bg-okSoft text-ok",
  resolved: "bg-okSoft text-ok",
  completed: "bg-okSoft text-ok",
  active: "bg-okSoft text-ok",
  pending: "bg-warnSoft text-warn",
  open: "bg-warnSoft text-warn",
  in_progress: "bg-warnSoft text-warn",
  awaiting_confirmation: "bg-warnSoft text-warn",
  rejected: "bg-dangerSoft text-danger",
  cancelled: "bg-dangerSoft text-danger",
  disputed: "bg-dangerSoft text-danger",
  banned: "bg-dangerSoft text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[status] ?? "bg-line text-slate";
  const label = status.replace(/_/g, " ");
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
      {label}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(26,29,41,0.04)] ${className}`}>
      {children}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "ok";
  disabled?: boolean;
  type?: "button" | "submit";
};
export function Button({ children, onClick, variant = "primary", disabled, type = "button" }: ButtonProps) {
  const styles = {
    primary: "bg-ink text-white hover:bg-black",
    ok: "bg-ok text-white hover:brightness-95",
    danger: "bg-danger text-white hover:brightness-95",
    ghost: "bg-transparent text-slate border border-line hover:bg-line/40",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${styles}`}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
    </div>
  );
}

export function StateBox({ children }: { children: ReactNode }) {
  return <div className="py-16 text-center text-sm text-mute">{children}</div>;
}
