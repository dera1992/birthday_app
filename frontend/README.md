# Birthday Experiences Frontend

Premium Next.js App Router frontend for the Birthday Experiences + Support Ecosystem backend.

## Stack

- Next.js 16 + App Router + TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- TanStack React Query
- React Hook Form + Zod
- Stripe Elements
- Mapbox via `react-map-gl`
- `next-themes` for dark mode

## Run locally

```bash
cd frontend
npm install
npm run dev
```

The app expects the Django backend to be running already.

## Environment

Copy [.env.example](/c:/projects/birthday_app/frontend/.env.example) to `.env.local` and set:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

Example:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
```

## Auth

- JWT auth uses the backend SimpleJWT login endpoint.
- Access token is stored in `localStorage`.
- Refresh flow is not implemented yet.
- If the access token expires or a `401` is returned, the app clears auth storage and redirects back to login on guarded routes.

## Routes

Public:

- `/`
- `/pricing`
- `/login`
- `/register`
- `/birthday/[slug]`

Authenticated:

- `/`
- `/events`
- `/events/new`
- `/events/[id]`
- `/events/[id]/checkout`
- `/events/[id]/applications`
- `/connect`
- `/connect/return`
- `/connect/refresh`
- `/wallet` — earnings, withdraw, ledger

Public (gift store):

- `/birthday/[slug]/gifts` — full-page digital gift storefront

## Implemented integrations

- Events feed with geolocation prompt and city fallback
- Mapbox map pins plus ordered event list
- Event apply flow with invite code support
- Event checkout with Stripe Elements and payment-intent client secret flow
- Pre-lock refund request CTA
- Host management controls for publish, expand, confirm venue, lock, cancel
- Connect onboarding and status
- Public birthday page with wishlist reserve, support messages, and support contribution checkout
- Venue recommendation cards with click tracking redirect flow
- **Digital gift store** — catalog browser, category filters, multi-step payment modal (customize → Stripe → success), and public gifts received wall
- **Wallet page** — pending / available balance, manual withdraw, auto-payout mode toggle, and full ledger history

## Project structure

```text
frontend/
  src/
    app/
    components/
    features/
    hooks/
    lib/
```

## Digital Gift Store — testing locally

1. Seed at least one `GiftProduct` via Django admin (`/admin/gifts/giftproduct/add/`).
2. Open any birthday profile page (public or owned).
3. Click the **Digital Gifts** tab in the left column.
4. Pick a product → **Customize & Send** opens the modal.
5. Fill in your message / visibility and click **Continue to Payment**.
6. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
7. On success the gift appears in the **Gifts received** section below the grid.

For the full-page storefront visit `/birthday/{slug}/gifts`.

**Endpoint assumptions** (configured in `src/features/gifts/api.ts`):

| Action | Path |
|--------|------|
| Product catalog | `GET /gifts/products` |
| Profile gifts | `GET /birthday-profile/{slug}/gifts` |
| Create intent | `POST /birthday-profile/{slug}/gifts/create-intent` |

If backend paths change, update only `src/features/gifts/api.ts`.

## Assumptions

- The frontend uses `localStorage` for the access token because this V1 is API-first and does not yet use httpOnly session cookies.
- The backend already exposes the documented endpoints for login, profile, events, birthday support, payments, venues, and connect.
- Host review UI assumes a list endpoint at `GET /events/{id}/applications`. The current backend code in this repo exposes approve/decline actions but not that list route yet, so this page is ready for it and documents the dependency in the UI.
- The event detail page uses `approx_area_label` when asking for venue recommendations because the event payload does not currently include a separate city field.
- Password reset email delivery is not implemented in the backend; when backend `DEBUG=True`, the reset request returns `uid` and `token`, and the frontend leaves room for that backend behavior.

## Notes

- The root route is auth-aware: signed-out users see the marketing landing page, signed-in users see the dashboard.
- The exact venue is intentionally not shown broadly because the backend only returns minimal venue detail until the event reaches the right state and role visibility.
- The frontend uses hand-authored shadcn-compatible primitives instead of the CLI so the project remains repo-native.
