# FixIt Admin Console

A web admin panel for the FixIt platform, built with **Next.js 15 (App Router) + TypeScript + Tailwind + TanStack Query**. It talks directly to your existing FastAPI backend — no new backend code required.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Point it at your backend
cp .env.local.example .env.local
# then edit .env.local and set NEXT_PUBLIC_API_BASE_URL to your API
# (e.g. http://localhost:8000)

# 3. Run it
npm run dev
# open http://localhost:3000
```

Sign in with the phone number of a user whose `role == "admin"`. (OTP goes
through your backend's Twilio flow, same as the mobile app.)

## What's included

| Page | Route | Backend endpoints |
|------|-------|-------------------|
| Approvals | `/providers` | `GET /admin/pending`, `PATCH /admin/{id}/approval` |
| Disputes | `/disputes` | `GET /disputes/`, `PATCH /disputes/{id}/resolve` |
| Bookings | `/bookings` | `GET /admin/bookings` |
| Users | `/users` | `GET /admin/users`, `PATCH /admin/{id}/ban` & `/unban` |
| Promo Codes | `/promo-codes` | `GET`/`POST /admin/promo-codes/`, `PATCH /admin/promo-codes/{id}` |
| Categories | `/categories` | `GET`/`POST /categories/`, `PATCH`/`DELETE /categories/{id}` |

## How it's wired (for learning)

- **`src/lib/api.ts`** — the only file that talks to the backend. Stores the
  JWT in `localStorage`, attaches `Authorization: Bearer`, and exposes one
  typed function per endpoint. Start here when adding a new call.
- **`src/types/index.ts`** — TypeScript mirrors of your Pydantic schemas.
- **Route groups** — the `(dashboard)` folder wraps every authenticated page
  in one layout (sidebar + auth guard) without showing up in the URL.
- **`"use client"`** — sits at the top of every interactive page. That's the
  one Next.js concept beyond plain React you need here: components are
  server-rendered by default, and this opts them into the browser so they can
  use `useState`, `useQuery`, etc.
- **TanStack Query** — `useQuery` fetches + caches; `useMutation` does
  writes, then `invalidateQueries` refetches so the UI stays in sync.

## Adding a new feature page (the pattern)

1. Add the endpoint function in `src/lib/api.ts`.
2. Create `src/app/(dashboard)/<name>/page.tsx` starting with `"use client"`.
3. `useQuery` to load, `useMutation` for actions, copy the table/Card markup
   from an existing page.
4. Add the route to `NAV` in `src/components/Sidebar.tsx`.

## Notes / things to confirm against your backend

- **CORS**: your FastAPI app must allow the admin origin
  (`http://localhost:3000` in dev). Add `CORSMiddleware` if requests are
  blocked in the browser console.
- **Promo schema**: the create form sends `code`, `discount_percentage`,
  `max_uses`. If your `PromoCodeCreate` schema has required fields like
  `expires_at`, add them to the form and to `createPromo` in `api.ts`.
- `GET /categories/` returns only active categories by design, so a
  deactivated category disappears from the list (it still exists server-side).
