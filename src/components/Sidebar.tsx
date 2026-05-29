"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/api";

const NAV = [
  { href: "/providers", label: "Approvals" },
  { href: "/disputes", label: "Disputes" },
  { href: "/bookings", label: "Bookings" },
  { href: "/users", label: "Users" },
  { href: "/promo-codes", label: "Promo Codes" },
  { href: "/categories", label: "Categories" },
  { href: "/account", label: "Account" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    auth.clear();
    router.push("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-60 flex-col border-r border-line bg-white">
      <div className="px-6 py-6">
        <div className="font-display text-2xl font-bold text-ink">
          Fix<span className="text-brand">It</span>
        </div>
        <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-mute">
          Admin Console
        </div>
      </div>

      <nav className="flex-1 px-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active ? "bg-ink text-white" : "text-slate hover:bg-line/50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="m-3 rounded-lg border border-line px-3 py-2 text-left text-sm font-semibold text-slate hover:bg-line/40"
      >
        Sign out
      </button>
    </aside>
  );
}
