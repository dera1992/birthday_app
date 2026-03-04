# Birthday Experiences + Support Ecosystem — System Blueprint (V1)

> **Positioning:** Premium curated birthday experiences + birthday support ecosystem  
> **Launch:** Manchester (full), London (clustered zones)  
> **Core modes:** Invite-only (optionally expandable to strangers) + discoverable (radius feed) with application-based approval  
> **Payments:** Optional (celebrant decides). Paid events use **Stripe Connect (separate charges & transfers)** with **escrow-like release** on LOCK/CONFIRMED and refunds before lock if venue/prep not confirmed.

---

## 1. Product pillars

### 1.1 Birthday Support Ecosystem (digital layer)
- Birthday Profile Page (shareable)
- Wishlist (reserve to avoid duplicates)
- Supporter messages (optional moderation)
- Support contributions (donations)

### 1.2 Premium Curated Experiences (physical layer)
- Create Birthday Event (small group, structured)
- Radius discovery (PostGIS)
- Application + approval workflow
- Public venue only policy (exact location hidden until confirmed)
- Ratings + report/block (trust & safety)

### 1.3 Venue Referral Engine
- Recommended venues by city + category
- Referral click tracking
- Future: venue onboarding as Connect accounts (optional)

---

## 2. High-level architecture

### 2.1 Components
**Client (Next.js)**
- Auth, Profile, Birthday Page
- Event Feed (map/list), Event Details, Apply/Invite
- Payments & Refunds
- Host dashboard (applications, lock/confirm, payouts setup)
- Venue recommendations & referral redirects
- Trust & safety (report/block)
- Optional: Chat + Notifications (Phase 2)

**API (Django + DRF)**
- Accounts + verification
- Birthdays (profile, wishlist, messages, contributions)
- Events (creation, feed, applications, state machine)
- Payments (Stripe PI creation, webhook reconciliation, refunds)
- Connect (Express onboarding + status)
- Venues (recommendations + click tracking)
- Safety (report/block, ratings)

**Data layer**
- PostgreSQL + PostGIS (geo search)
- Redis (cache + Celery broker)
- Object storage (S3/R2) for media

**Async / jobs (Celery)**
- Payment reconciliation
- Auto-cancel + refund on lock deadline
- Reminders (birthday + event)
- Moderation queue fanout
- Notification delivery

**External services**
- Stripe + Stripe Connect (Express)
- SMS OTP (Twilio/MessageBird)
- Email (SES/SendGrid)
- Maps (Mapbox/Google Maps)
- Error tracking (Sentry)

---

## 3. Core workflows

### 3.1 Invite-only → expandable to strangers
1. Host creates event: `INVITE_ONLY`, `expand_to_strangers=false`
2. Shares invite link/code to friends
3. If not enough interest: host toggles `expand_to_strangers=true`
4. Event appears in radius feed; strangers can apply
5. Host approves applicants (manual)
6. If paid: approved users pay deposit/contribution (platform charges; funds held)
7. Host confirms venue + min_guests met → event LOCKED/CONFIRMED
8. Funds are transferred to payee (host/venue) via Stripe Connect transfers

### 3.2 Discoverable within radius → application-based approval
1. User opens feed: events within radius
2. Applies with intro message
3. Host approves/declines
4. Paid events: user pays after approval
5. Host confirms venue + min_guests met → lock/confirm → release funds
6. After event: ratings + trust signals

### 3.3 Refund guarantee (as specified)
- If venue/prep not confirmed by lock deadline, or event cancelled pre-lock → **automatic refunds**
- Users can withdraw pre-lock → refund (policy-based)

---

## 4. State machines

### 4.1 Event lifecycle states
- `DRAFT` → `OPEN` → `MIN_MET` → `LOCKED` → `CONFIRMED` → `COMPLETED`
- Side exits: `CANCELLED`, `EXPIRED`

**Recompute rule:** while `OPEN` or `MIN_MET`, if approved_count >= min_guests → `MIN_MET` else `OPEN`.

### 4.2 Venue status
- `NOT_SET` → `PROPOSED` → `CONFIRMED`

### 4.3 Payment status
- `REQUIRES_PAYMENT` → `HELD_ESCROW` → (`RELEASED` | `REFUNDED`)
- Edge: `FAILED`, `CANCELLED`

### 4.4 Lock rule
Event can become `LOCKED` only if:
- approved attendees ≥ min_guests
- venue_status == `CONFIRMED`
- lock_deadline_at not passed

---

## 5. Discoverability & privacy rules

### 5.1 Discoverable if
- state in `{OPEN, MIN_MET}` AND
- (`visibility == DISCOVERABLE` OR (`visibility == INVITE_ONLY` AND `expand_to_strangers == true`))

### 5.2 Privacy
- Before approval: show approximate area label (neighborhood) and distance; hide exact venue
- After event CONFIRMED: reveal exact venue details to approved attendees

### 5.3 Safety
- Phone verification required to apply
- Deposit can be required to reduce spam/no-shows
- Report/block + admin review queue
- Rate limiting on apply/messages

---

## 6. Payments & Stripe Connect escrow design

### 6.1 Chosen pattern: Separate charges and transfers (Stripe Connect)
- Customer is charged on **platform**
- PaymentIntent is created with:
  - `transfer_group = "event_<id>"`
  - `application_fee_amount` (platform fee)
- Funds are “held” conceptually until lock/confirm
- On `LOCKED/CONFIRMED`, platform creates **Transfer(s)** to connected account(s)
- Refunds:
  - **Pre-lock:** refund the charge, mark payment REFUNDED
  - **Post-transfer (optional later):** reverse transfer + refund charge

**References (Stripe docs):**
- Separate charges and transfers: https://docs.stripe.com/connect/separate-charges-and-transfers
- Funds segregation & source_transaction: https://docs.stripe.com/connect/funds-segregation
- Integration recommendations: https://docs.stripe.com/connect/integration-recommendations

### 6.2 Payee (V1)
- Payee = Host (recommended for speed)
- Future: onboard venues as connected accounts and pay venues directly

### 6.3 Release policy
- Release funds on event `LOCKED` (or `CONFIRMED`)
- Optionally release at `LOCKED + 24h` or “24h before start” (Phase 2)

### 6.4 Refund guarantee automation (Celery)
- At `lock_deadline_at`:
  - If venue not confirmed or min not met: cancel event + refund all HELD_ESCROW payments

---

## 7. Core data model (V1)

### 7.1 Accounts
- `User` (Django auth)
- `UserVerification` (email_verified_at, phone_verified_at, phone_number, risk_flags)

### 7.2 Birthday ecosystem
- `BirthdayProfile` (day/month, hide_year, bio, preferences, visibility, slug)
- `WishlistItem`
- `WishlistReservation`
- `SupportMessage` (moderation_status)
- `SupportContribution`

### 7.3 Events marketplace
- `BirthdayEvent`  
  - host, title, description, agenda, category, start/end
  - visibility, expand_to_strangers
  - location_point (PostGIS), radius_meters, approx_area_label
  - min_guests, max_guests, criteria JSON
  - payment_mode, amount, currency
  - state, venue_status, lock_deadline_at
  - payee_user (default host)

- `EventInvite` (code, max_uses, used_count, expires_at)
- `EventApplication` (PENDING/APPROVED/DECLINED/WITHDRAWN)
- `EventAttendee` (active/cancelled/no-show)

### 7.4 Payments
- `ConnectAccount` (Express account; payouts_enabled, requirements)
- `EventPayment` (stripe_payment_intent_id, stripe_charge_id, stripe_transfer_id, status)
- `StripeEventProcessed` (idempotency for webhook events)

### 7.5 Venues & referrals
- `VenuePartner` (city, category, referral_url)
- `ReferralClick`

### 7.6 Safety
- `UserBlock`
- `UserReport`
- `EventRating`

---

## 8. API blueprint (DRF)

### 8.1 Auth & verification
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/verify-email`
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `GET /me`
- `PATCH /me`

### 8.2 Birthday profile
- `POST /birthday-profile`
- `GET /birthday-profile/{slug}`
- `PATCH /birthday-profile/{slug}`
- `POST /birthday-profile/{slug}/wishlist-items`
- `PATCH /wishlist-items/{id}`
- `POST /wishlist-items/{id}/reserve`
- `POST /birthday-profile/{slug}/messages`
- `GET /birthday-profile/{slug}/messages`
- `POST /birthday-profile/{slug}/contributions/create-intent`

### 8.3 Events
- `POST /events` (create DRAFT)
- `POST /events/{id}/publish` (DRAFT→OPEN)
- `GET /events/{id}`
- `PATCH /events/{id}` (host only)
- `GET /events/feed?lat=&lng=&radius=&category=`
- `POST /events/{id}/apply` (phone verified; invite_code if needed)
- `POST /events/{id}/applications/{app_id}/approve`
- `POST /events/{id}/applications/{app_id}/decline`
- `POST /events/{id}/toggle-expand`
- `POST /events/{id}/venue/confirm`
- `POST /events/{id}/lock`
- `POST /events/{id}/cancel`

### 8.4 Event payments (Connect)
- `POST /events/{id}/payment/create-intent` (after approval)
- `POST /events/{id}/payment/request-refund` (pre-lock)
- `POST /webhooks/stripe`

### 8.5 Connect onboarding
- `POST /connect/onboard` (create Express account + onboarding link)
- `GET /connect/status`

### 8.6 Venues
- `GET /venues/recommendations?city=&category=`
- `POST /venues/{venue_id}/click` (track + return redirect_url)

### 8.7 Safety
- `POST /reports`
- `POST /blocks`
- `POST /events/{id}/ratings`

---

## 9. Deployment blueprint (founder-operator)

### 9.1 Recommended
- Frontend: Vercel
- Backend: Render/Fly.io/VPS
- Postgres (PostGIS): managed
- Redis: managed
- Media: S3/R2

### 9.2 Environments
- Local: docker-compose (PostGIS + Redis)
- Staging: minimal
- Prod: monitored (Sentry)

---

## 10. Implementation notes (lean but solid)

- **Monolith** Django app, modularized by domain apps
- **Idempotency**:
  - Stripe webhook: store processed event IDs
  - PaymentIntent creation: `Idempotency-Key` header
- **Geo queries**:
  - PointField(geography=True)
  - `distance_lte` + Distance annotate + index
- **Refund automation**:
  - Celery job at lock_deadline
- **Privacy by design**:
  - approximate area in public responses
  - exact venue only after confirm
