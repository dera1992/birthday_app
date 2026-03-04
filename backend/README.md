# Birthday Experiences + Support Ecosystem Backend

Backend V1 for the product blueprint in [birthday_app_blueprint.md](/c:/projects/birthday_app/birthday_app_blueprint.md).

Stack:
- Django + DRF + SimpleJWT
- PostgreSQL + PostGIS
- Redis
- Celery worker + beat
- Stripe + Stripe Connect Express
- Docker Compose

## Running

Run all commands from `backend/`.

Start everything:

```bash
docker compose up --build
```

Useful commands:

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py test
docker compose exec web python manage.py seed_venue_partners
docker compose exec web python manage.py scan_lock_deadlines
```

Celery services are included in `docker-compose.yml`:
- `worker`: Celery worker
- `beat`: Celery beat scheduler

The refund-guarantee scan runs every 5 minutes via Celery beat and calls `apps.events.tasks.scan_lock_deadlines`.
You can also run the same logic manually with `python manage.py scan_lock_deadlines`.

## API Docs

- Swagger UI: `http://localhost:8000/api/docs/swagger/`
- ReDoc: `http://localhost:8000/api/docs/redoc/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

## Environment

See [.env.example](/c:/projects/birthday_app/backend/.env.example).

Important variables:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CONNECT_REFRESH_URL`
- `CONNECT_RETURN_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `THROTTLE_APPLY_RATE`
- `THROTTLE_MESSAGES_RATE`
- `THROTTLE_CONTRIBUTIONS_RATE`

## Stripe Test Setup

Use Stripe test keys in `.env`.

Forward webhooks locally with Stripe CLI:

```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

Relevant webhook events handled:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `account.updated`

Support contributions use a platform PaymentIntent with `metadata.type=support_contribution`.

## Endpoint List

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password/request`
- `POST /api/auth/forgot-password/confirm`
- `POST /api/auth/refresh`
- `POST /api/auth/verify-email`
- `POST /api/auth/verify-email/confirm`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/change-password`
- `GET /api/me`
- `PATCH /api/me`

### Birthday ecosystem

- `POST /api/birthday-profile`
- `GET /api/birthday-profile/{slug}`
- `PATCH /api/birthday-profile/{slug}`
- `POST /api/birthday-profile/{slug}/wishlist-items`
- `PATCH /api/wishlist-items/{id}`
- `POST /api/wishlist-items/{id}/reserve`
- `POST /api/birthday-profile/{slug}/messages`
- `GET /api/birthday-profile/{slug}/messages`
- `POST /api/support-messages/{id}/approve`
- `POST /api/support-messages/{id}/reject`
- `POST /api/birthday-profile/{slug}/contributions/create-intent`

### Events

- `POST /api/events`
- `POST /api/events/{id}/publish`
- `GET /api/events/{id}`
- `PATCH /api/events/{id}`
- `GET /api/events/feed?lat=&lng=&radius=&category=`
- `POST /api/events/{id}/apply`
- `POST /api/events/{id}/applications/{app_id}/approve`
- `POST /api/events/{id}/applications/{app_id}/decline`
- `POST /api/events/{id}/toggle-expand`
- `POST /api/events/{id}/venue/confirm`
- `POST /api/events/{id}/lock`
- `POST /api/events/{id}/cancel`
- `POST /api/events/{id}/complete`

### Payments and Connect

- `POST /api/events/{id}/payment/create-intent`
- `POST /api/events/{id}/payment/request-refund`
- `POST /api/connect/onboard`
- `GET /api/connect/status`
- `POST /api/webhooks/stripe`

### Venues and safety

- `GET /api/venues/recommendations?city=&category=`
- `POST /api/venues/{venue_id}/click`
- `POST /api/reports`
- `POST /api/blocks`
- `POST /api/events/{id}/ratings`

## Curl Examples

Register:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"host@example.com","password":"password123","first_name":"Host","last_name":"User"}'
```

In local development, verification emails are printed to the backend logs via Django's console email backend. Open the verification link from the log output, then continue to phone verification.

Login with email and password:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"host@example.com","password":"password123"}'
```

Request a password reset:

```bash
curl -X POST http://localhost:8000/api/auth/forgot-password/request \
  -H "Content-Type: application/json" \
  -d '{"email":"host@example.com"}'
```

Confirm a password reset:

```bash
curl -X POST http://localhost:8000/api/auth/forgot-password/confirm \
  -H "Content-Type: application/json" \
  -d '{"uid":"<uid>","token":"<token>","new_password":"newpassword123"}'
```

Change password while authenticated:

```bash
curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"password123","new_password":"newpassword123"}'
```

Request and verify dev OTP:

```bash
curl -X POST http://localhost:8000/api/auth/request-otp \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+447700900123"}'

curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+447700900123","code":"123456"}'
```

Create birthday profile:

```bash
curl -X POST http://localhost:8000/api/birthday-profile \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"day":14,"month":7,"hide_year":true,"bio":"Birthday week","preferences":{"interests":["brunch","live-music"]},"visibility":"PUBLIC"}'
```

Create wishlist item:

```bash
curl -X POST http://localhost:8000/api/birthday-profile/<slug>/wishlist-items \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Flowers","description":"Bouquet","currency":"GBP"}'
```

Reserve or cancel a wishlist reservation:

```bash
curl -X POST http://localhost:8000/api/wishlist-items/1/reserve \
  -H "Content-Type: application/json" \
  -d '{"reserver_name":"Friend","reserver_email":"friend@example.com"}'

curl -X POST http://localhost:8000/api/wishlist-items/1/reserve \
  -H "Authorization: Bearer <owner_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"cancel"}'
```

Create support contribution intent:

```bash
curl -X POST http://localhost:8000/api/birthday-profile/<slug>/contributions/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount":"20.00","currency":"GBP","supporter_name":"Guest","supporter_email":"guest@example.com"}'
```

Create event:

```bash
curl -X POST http://localhost:8000/api/events \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Rooftop Birthday Dinner",
    "description":"Curated evening dinner",
    "agenda":"Welcome drinks, dinner, cake",
    "category":"DINING",
    "start_at":"2026-03-20T19:00:00Z",
    "end_at":"2026-03-20T23:00:00Z",
    "visibility":"DISCOVERABLE",
    "expand_to_strangers":false,
    "location_point":{"lat":53.4808,"lng":-2.2426},
    "radius_meters":8000,
    "approx_area_label":"Northern Quarter",
    "min_guests":4,
    "max_guests":8,
    "criteria":{"verified_only":true,"interests":["brunch","live-music"]},
    "payment_mode":"PAID",
    "amount":"35.00",
    "currency":"GBP",
    "lock_deadline_at":"2026-03-15T18:00:00Z"
  }'
```

Query event feed:

```bash
curl "http://localhost:8000/api/events/feed?lat=53.4808&lng=-2.2426&radius=5000&category=DINING"
```

Create payment intent after approval:

```bash
curl -X POST http://localhost:8000/api/events/1/payment/create-intent \
  -H "Authorization: Bearer <access_token>" \
  -H "Idempotency-Key: event-1-user-2"
```

Connect onboarding and status:

```bash
curl -X POST http://localhost:8000/api/connect/onboard \
  -H "Authorization: Bearer <access_token>"

curl http://localhost:8000/api/connect/status \
  -H "Authorization: Bearer <access_token>"
```

Complete event:

```bash
curl -X POST http://localhost:8000/api/events/1/complete \
  -H "Authorization: Bearer <host_access_token>"
```

Seed venue partners:

```bash
docker compose exec web python manage.py seed_venue_partners
docker compose exec web python manage.py seed_venue_partners --path apps/venues/data/venue_partners.json
```

Run the lock deadline scan manually:

```bash
docker compose exec web python manage.py scan_lock_deadlines
```

## Manual Test Flow

1. Register a host and guest, then verify the guest phone and email.
2. Create a birthday profile and confirm the slug is auto-generated when omitted.
3. Add a wishlist item, reserve it as a guest, then clear the reservation as the owner.
4. Post a support message as a guest, approve it as the owner, and confirm only approved messages are public.
5. Create a support contribution intent and confirm Stripe returns a client secret.
6. Create a paid event, publish it, apply as the guest, approve the application, and create a payment intent.
7. Complete Connect onboarding, verify `payouts_enabled`, confirm the venue, and lock the event.
8. Mark the event completed and submit a rating as an attendee.
9. Let an eligible event pass its lock deadline and confirm Celery cancels/refunds held escrow payments.

## Assumptions

- `BirthdayProfile.visibility=LINK_ONLY` is accessible via the shareable slug URL; `PRIVATE` is owner-only.
- Age-based event criteria are not enforced yet because user DOB/age is not stored in the current profile model.
- Interest criteria are enforced only when the applying user has `birthday_profile.preferences.interests`; otherwise the application is allowed.
- `criteria.must_pay_to_apply` is documented as a commitment rule, but actual charging still happens only after approval to reduce disputes.
- Wishlist reservation cancellation is owner-controlled through the same reserve endpoint with `{"action":"cancel"}`.
- Anonymous support contributions are supported with optional `supporter_name` and `supporter_email`, but they are still platform Stripe charges.
- Block rules are enforced for authenticated apply/message flows and private profile access.
