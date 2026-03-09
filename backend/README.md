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
Wishlist item contributions use `metadata.type=wishlist_contribution` and credit `WishlistItem.amount_raised` on success.

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
- `POST /api/support-messages/{id}/react` — celebrant adds emoji reaction
- `POST /api/support-messages/{id}/reply` — celebrant replies to approved message
- `GET /api/birthday-profile/{slug}/public-wishlist` — public items (hidden after birthday passes)
- `POST /api/wishlist-items/{id}/contributions/create-intent` — anonymous/authenticated chip-in
- `POST /api/birthday-profile/{slug}/contributions/create-intent`
- `GET /api/birthday-profile/{slug}/contributions` — owner only
- `GET /api/referral-products?category=` — curated product marketplace
- `POST /api/referral-products/{id}/click` — track affiliate click

### Wishlist business rules
- `WishlistItem.visibility`: PUBLIC (default) or PRIVATE. Private items are only visible to the celebrant.
- Public items are auto-hidden from `/public-wishlist` once the celebrant's birthday (day+month) has passed for the current year.
- `allow_contributions`: enables per-item crowd-funding. `target_amount` (max £100) is required when enabled.
- Contributions are rejected if the item is already fully funded or if the requested amount would exceed the remaining target.
- On `payment_intent.succeeded` with `metadata.type=wishlist_contribution`, `WishlistItem.amount_raised` is incremented atomically.

### Referral products
- `ReferralProduct` is a curated catalog of affiliate/partner products managed via Django admin.
- Seed 7 sample products: `python manage.py seed_referral_products`
- Click tracking via `POST /api/referral-products/{id}/click` (increments `click_count`).
- `WishlistItem` can link to a `ReferralProduct` via `source_type=REFERRAL_PRODUCT`.
- For referral-linked items, the affiliate URL is used as the external link on the public birthday page.

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

## Gift Engine

Digital gifts are now data-driven. Non-technical admins can create templates and products from Django admin without changing frontend code.

Admin workflow:
- Open Django admin and create or edit a `GiftProduct`.
- Choose a `renderer_type`.
- Add `template_asset_url` and `preview_asset_url`.
- Paste a JSON `customization_schema`.
- Paste a JSON `layout_config`.
- Optionally add `purchase_instructions`.
- Publish by setting `is_active=true`.

Relevant admin models:
- `GiftProduct`
- `GiftPurchase`
- `GiftTemplate` (optional reusable asset/config source for backwards-compatible reuse)

Supported renderer types:
- `CARD_TEMPLATE`
- `FLOWER_GIFT`
- `ANIMATED_MESSAGE`
- `BADGE_GIFT`
- `VIDEO_TEMPLATE`

Supported customization field types:
- `text`
- `textarea`
- `select`
- `color`
- `number`
- `toggle`

Example schema:

```json
{
  "fields": [
    {
      "name": "recipient_name",
      "type": "text",
      "label": "Recipient Name",
      "required": true,
      "max_length": 80
    },
    {
      "name": "message",
      "type": "textarea",
      "label": "Birthday Message",
      "required": true,
      "max_length": 300
    },
    {
      "name": "sender_name",
      "type": "text",
      "label": "From",
      "required": false
    },
    {
      "name": "theme_color",
      "type": "select",
      "label": "Theme Color",
      "required": false,
      "options": ["pink", "gold", "blue"]
    },
    {
      "name": "show_confetti",
      "type": "toggle",
      "label": "Show Confetti",
      "required": false
    }
  ]
}
```

Example layout config:

```json
{
  "title": {
    "x": "50%",
    "y": "20%",
    "align": "center",
    "fontSize": 40,
    "fontWeight": 700,
    "color": "#ffffff"
  },
  "message": {
    "x": "50%",
    "y": "45%",
    "align": "center",
    "fontSize": 24,
    "fontWeight": 400,
    "color": "#ffffff",
    "maxWidth": "70%"
  },
  "sender": {
    "x": "50%",
    "y": "75%",
    "align": "center",
    "fontSize": 20,
    "fontWeight": 500,
    "color": "#ffffff"
  }
}
```

Gift engine commands:

```bash
docker compose exec web python manage.py seed_gift_products
docker compose exec web python manage.py seed_ai_gift_products
# Optional flags:
docker compose exec web python manage.py seed_ai_gift_products --price 9.99 --currency usd --provider NANO_BANANA
```

Gift API additions:
- `GET /api/gifts/catalog?category=`
- `GET /api/gifts/products?category=` (legacy alias)
- `GET /api/gifts/{slug}`
- `GET /api/birthday-profile/{slug}/gifts`
- `POST /api/birthday-profile/{slug}/gifts/create-intent`
- `GET /api/gifts/purchases/{id}/generation-status`  — AI generation status polling
- `POST /api/gifts/purchases/{id}/select-option`      — select AI design option
- `GET /api/gifts/purchases/{id}/download`            — download (redirects to AI asset URL for AI gifts)

Backward compatibility:
- Existing gift products without templates still resolve a default renderer and schema.
- Existing purchases without `customization_data` still render using legacy `from_name` and `custom_message`.
- Legacy create-intent payloads using only `from_name` and `custom_message` are still accepted and mapped into `customization_data`.
- AI fields on `GiftProduct` and `GiftPurchase` default to non-AI values, so all existing data is unaffected.

---

## AI Gift Products

### Overview

AI gift products are normal `GiftProduct` entries with `is_ai_generated_product=True`.
They go through the standard payment flow but trigger post-payment AI image generation via Celery.

### How it works

1. User selects an AI gift product (e.g. "AI Birthday Card") and fills the form (celebrant name, message, style).
2. `POST /api/birthday-profile/{slug}/gifts/create-intent` creates a `GiftPurchase` with:
   - `generation_status = PENDING`
   - `ai_prompt_input = { celebrant_name, sender_name, message, style }`
3. Stripe PaymentIntent is created as usual.
4. On `payment_intent.succeeded` webhook:
   - `mark_gift_purchase_succeeded` and `credit_gift_earned` run (revenue split is identical to non-AI gifts).
   - `generate_ai_gift_options_task.delay(purchase_id)` is queued.
5. The Celery task calls Nano Banana, generates N design options, and saves them to `purchase.generated_options`.
   `generation_status` → `GENERATED`.
6. Frontend polls `GET .../generation-status` every 3 seconds until status is `GENERATED`.
7. User sees 2 design options side-by-side and clicks "Choose this design".
8. `POST .../select-option { "option_index": 0 }` → sets `selected_asset_url`, `ai_download_url`, `is_downloadable=True`, `generation_status=SELECTED`.
9. The gift appears on the birthday gift wall using `selected_asset_url` as the displayed image.
10. Buyer and celebrant can download via the `ai_download_url` or the download endpoint.

### Revenue split

Revenue split for AI gifts is **identical** to regular digital gifts:
- `platform_amount = gross * platform_fee_bps / 10000`
- `celebrant_amount = gross - platform_amount`
- Wallet credit happens on `payment_intent.succeeded` before generation starts.

### Nano Banana configuration

Required env vars:

| Variable | Description |
|---|---|
| `NANO_BANANA_API_KEY` | API key for Nano Banana |
| `NANO_BANANA_MODEL` | Model to use (default: `flux-schnell`) |
| `NANO_BANANA_BASE_URL` | Base URL (default: `https://api.nanabanana.ai/v1`) |

The provider is abstracted in `apps/gifts/providers/`:
- `base.py` — `BaseImageProvider` interface
- `nano_banana.py` — Nano Banana HTTP client adapter

To swap providers, implement `BaseImageProvider.generate_images()` and update `ai_generation_provider` on the product.

### Prompt templates

Default prompts are in `apps/gifts/ai_services.py` under `_DEFAULT_PROMPTS`.

You can override them per-product using `GiftProduct.ai_prompt_template` in Django admin.
Template variables: `{celebrant_name}`, `{sender_name}`, `{message}`, `{style}`.

### AI Gift Assumptions (V1)

- **Video products**: V1 generates a still cover image only. Full video generation is a future milestone. The product description communicates this to users.
- **Asset storage**: In V1, `selected_asset_url` and `ai_download_url` point directly to provider-returned URLs. A future improvement is to copy the selected asset into project-controlled storage so URLs don't expire.
- **Generation failure**: If Nano Banana fails after 3 retries, `generation_status` is set to `FAILED`. The buyer can contact support. Payment is not automatically refunded in V1.
- **Option count**: Default is 2 options per AI gift. Configurable via `GiftProduct.ai_option_count`.
- **Celery retries**: `generate_ai_gift_options_task` retries up to 3 times with exponential back-off (60 s, 120 s, 240 s base).

### Admin

- `GiftProduct` admin has an "AI Generation" fieldset (collapsible) with all AI-specific fields.
- `GiftPurchase` admin shows `generation_status`, `selected_asset_url`, `ai_download_url`, and has an inline for `AIGenerationJob`.
- `AIGenerationJob` admin lists provider, status, error messages for debugging.

### Renderer Engine Assumptions

- `GiftProduct.customization_schema` overrides `GiftTemplate.config_schema` when present.
- `GiftProduct.renderer_type` overrides the template renderer when present.
- `GiftProduct.template_asset_url` and `layout_config` override template-level assets/config when present.
- Overlay text is rendered by React using `layout_config`; the asset files themselves do not need text placeholders.
- Legacy products are auto-mapped to a default renderer, schema, and layout config so the frontend stays data-driven.

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
