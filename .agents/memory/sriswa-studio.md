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
- `clerkMiddleware` in `app.ts` must use `process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY` as publishable key — VPS .env only has `VITE_CLERK_PUBLISHABLE_KEY`; using `publishableKeyFromHost` alone can generate wrong keys in proxy environments
- `clerkMiddleware` must explicitly include `secretKey: process.env.CLERK_SECRET_KEY`
- `AuthTokenSync` component in App.tsx uses `useAuth().getToken()` via `setAuthTokenGetter` to attach Bearer tokens for api-client-react calls
- **ALL raw `fetch` calls to admin endpoints MUST include `Authorization: Bearer <token>`** — cookies alone are unreliable in cross-origin/proxy setups. Pattern: `const token = await getToken(); headers: { Authorization: \`Bearer \${token}\` }`
- Affected files fixed so far: `design.tsx` (LogoUploadField), `use-site-settings.tsx` (useUpdateSiteSettings), `cms/index.tsx` (fetch + delete), `builder/index.tsx`, `dashboard.tsx` (fetchAnalytics), `cms/form.tsx` (fetchPage/savePage)

**Why:** `@clerk/express` v2 changed auth access from `req.auth` property injection to `getAuth(req)` helper. Cookie-based auth is unreliable in dev (Vite proxy strips/mangles cookies). Bearer token is the only reliable auth mechanism.

## VPS Deploy — CRITICAL RULES
- Deploy script: `bash /var/www/sriswastudio/scripts/vps-deploy.sh`
- **NEVER add `--update-env` to `pm2 restart`** — this strips env vars (PORT, DATABASE_URL, etc.) from the running process, causing PM2 crash-loop and all pages to hang
- Plain `pm2 restart sriswa-api` keeps the existing env vars the process was started with
- VPS .env has `VITE_CLERK_PUBLISHABLE_KEY` (not `CLERK_PUBLISHABLE_KEY`) — app.ts must check both
- **The orval-generated client serializes `null` query params as the literal string "null"** (`?dateFrom=null`) — never pass `x || null` into generated-client query params; use `x || undefined` so the param is omitted. Server-side, validate parsed dates with `isNaN(d.getTime())` before passing to Drizzle (an Invalid Date in gte/lte throws → 500). Regression-locked in orders-list.test.ts.
- **Dev DB uses drizzle-kit push, so schema edits can silently skip migration files** — VPS applies only lib/db/drizzle/*.sql, so any schema column without a migration works in dev but 500s in prod (e.g. orders.payment_reference, store_settings.site_design/upi_*, landing_pages table — fixed in 0006). After ANY schema change, always generate/write a matching migration file AND add a column probe to the deploy script's schema verification.
- **A generic "failed with status code 500" in pino-http logs means no Express error middleware exists** — the real exception (message+stack) is swallowed. Express 5 forwards async route throws to the final 4-arg error handler; always register one after the router that logs `err.stack` via pino. Without it, production 500s are undebuggable from PM2 logs.
- **Legacy production rows can crash response builders that dev data never hits** (e.g. null created_at → `.toISOString()` TypeError → 500 on the whole list endpoint). Guard date/nullable conversions in serializers.
- **"Everything reset to old" symptom = stale code from a silently failed deploy.** With `set -e`, a git pull conflict (from manual VPS edits) or pnpm install failure aborts before rebuild — site keeps serving old code with no visible error. Script now has an ERR trap ("STILL RUNNING OLD CODE"), auto-stashes local edits (`git stash push -u`), and prints the deployed commit hash at the end so the user can verify what's live.

**Why:** PM2's `--update-env` reloads env from ecosystem config (not from shell), wiping all vars not in the config file. This caused the API server to crash on startup (PORT undefined), making every API request hang forever.

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

## Cart Query Key — CRITICAL
- `use-cart-context.tsx` MUST use `getGetCartQueryKey({sessionId})` as queryKey (not `['cart', sessionId]`)
- ProductCard add-to-cart `onSuccess` must call `queryClient.invalidateQueries({queryKey: getGetCartQueryKey({sessionId})})` to refresh badge
- **Why:** Mismatch between context key and mutation invalidation key meant badge never updated after add-to-cart

## Payment Gateways at Checkout
- Checkout fetches `GET /api/payments/status` → `{razorpay: bool, phonepe: bool}`
- **DEFAULT_ENABLED in payments.ts is now `{razorpay:false, phonepe:false, upi:true}`** — gateways with env keys present do NOT show at checkout unless the admin explicitly enables them via the settings toggles. **Why:** VPS had Razorpay keys in .env, so Razorpay appeared at checkout even though the store only uses UPI; opt-in is the safe default.
- Razorpay/PhonePe shown only when keys configured AND admin-enabled; COD always shown
- UPI shown only when `upiId` is saved in admin settings (`GET /api/payments/upi/settings`)
- Default paymentMethod starts null; `effectiveMethod = paymentMethod ?? PAYMENT_OPTIONS[0]?.id`

## Product Image Upload — VPS Fallback
- VPS has no Replit Object Storage — `DEFAULT_OBJECT_STORAGE_BUCKET_ID` not set → presigned URL fails
- `POST /api/storage/uploads/direct` — multer endpoint, saves to `uploads/` dir in process.cwd()
- `GET /api/storage/local-files/:filename` — serves those files
- Product form tries object storage first, falls back to direct upload on failure
- **Why:** Replit Object Storage is platform-specific; VPS needs a local filesystem fallback

## Editor Role (Second Admin)
- `requireEditor.ts` middleware — allows ADMIN_EMAILS **or** EDITOR_EMAILS (env var) or role=editor
- Products and CMS (blog) routes use `requireEditor` instead of `requireAdmin`
- Admin layout: `VITE_EDITOR_EMAILS` env var — editors see only Products, Categories, CMS nav
- VPS setup: add `EDITOR_EMAILS=email@example.com` and `VITE_EDITOR_EMAILS=email@example.com` to .env

## Deployment
- VPS: Hostinger, PM2 process: sriswa-api, nginx → port 8080
- Deploy frontend: build in Replit → tar.gz → user wget to VPS
- Build command: set `VITE_CLERK_PUBLISHABLE_KEY` to the live pk_live_ key from Clerk dashboard, then run `pnpm --filter @workspace/store run build`
- Package: `tar -czf public/store-dist.tar.gz -C dist/public .`
