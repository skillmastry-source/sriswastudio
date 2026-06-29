---
name: Sriswa Studio Store
description: Anti-tarnish jewellery e-commerce — storefront, admin panel, WhatsApp notifications, Clerk v6 auth, PostgreSQL
---

## Architecture
- `artifacts/store` — React+Vite frontend (previewPath `/`)
- `artifacts/api-server` — Express API server (port 8080, routes under `/api`)
- `lib/db` — Drizzle ORM schema + migrations
- `lib/api-spec` — OpenAPI spec → codegen into `lib/api-client-react` and `lib/api-zod`

## Clerk v6 Notes
- `@clerk/react` v6 does NOT export `SignedIn` or `SignedOut` — use `Show` component instead
- `clerk-stub.tsx` wraps `Show` as `SignedIn`/`SignedOut` for backward compat
- `publishableKey` must use `publishableKeyFromHost` from `@clerk/react/internal`
- `proxyUrl = import.meta.env.VITE_CLERK_PROXY_URL` — unconditional, empty in dev

**Why:** Clerk v6 removed `SignedIn`/`SignedOut` in favor of `Show` with `when="signed-in|signed-out"`.

## Clerk Express v2 Auth — CRITICAL
- **NEVER use `(req as any).auth?.userId`** — this is the v1 pattern and always returns undefined in v2
- **Always use `getAuth(req)` from `@clerk/express`** to read the auth state
- `clerkMiddleware` callback must explicitly include `secretKey: process.env.CLERK_SECRET_KEY` — without it the middleware cannot verify JWTs even if `CLERK_SECRET_KEY` is in the environment
- `customFetch` (api-client-react) must set `credentials: "include"` so session cookies are sent
- `AuthTokenSync` component in App.tsx uses `useAuth().getToken()` via `setAuthTokenGetter` to attach Bearer tokens

**Why:** `@clerk/express` v2 changed auth access from `req.auth` property injection to `getAuth(req)` helper. Using the old pattern silently returns undefined → all admin routes 401.

## Backend Routes
- GET/POST `/api/categories`, `/api/products`, `/api/cart`, `/api/orders`
- PATCH `/api/orders/:id/status` (triggers WhatsApp to customer)
- GET `/api/admin/dashboard`, `/api/admin/inventory`, `/api/admin/settings`
- POST `/api/storage/uploads/request-url` (object storage)
- GET `/api/site-design` (public), PATCH `/api/admin/site-design` (admin)

## Route Registration Order Matters
Both `adminRouter` AND `customersRouter` use `router.use(requireAdmin)` WITHOUT a path prefix — they intercept ALL unauthenticated requests before later routers. Any public routes MUST be registered before BOTH of these in `routes/index.ts`.

Current safe order: health → categories → products → cart → orders → storage → siteDesign → payments → leads → cms → **landingPages** → customers → coupons → media → admin

**Why:** Express evaluates sub-routers in registration order. customersRouter's global requireAdmin fires on every request reaching it, returning 401 before the landing-pages GET handler ever runs. Discovered when public GET /landing-pages returned 401 with 2ms response time — a sign that requireAdmin fired synchronously before any DB call.

## Site Design Settings
- `store_settings.site_design` jsonb column — auto-added on server start via `ALTER TABLE IF NOT EXISTS`
- `useSiteSettings()` hook in storefront, `useUpdateSiteSettings()` for admin saves
- Admin page at `/admin/design` — tabbed UI: Colors, Header, Hero, USP Strip, Collection, New Arrivals, Testimonials, Footer
- All storefront colors/text driven by settings; defaults in `DEFAULT_SITE_DESIGN` exported from both hook and API route

## WhatsApp (Twilio)
- Env secrets needed: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- Admin phone set in `/admin/settings` → `store_settings.admin_whatsapp`
- Templates use `{{orderNumber}}`, `{{customerName}}`, `{{total}}`, `{{phone}}`, `{{status}}`

## Database Tables
categories, products, product_images, product_variants, orders, order_items, cart_items, store_settings, landing_pages

## Deployment
- Deploy via Replit, then point Hostinger domain CNAME to `.replit.app` domain
