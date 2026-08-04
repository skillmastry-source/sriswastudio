---
name: Clerk token getter can block all storefront fetches
description: Why some customers saw permanent skeleton loaders on the live store, and the fail-open rule
---

The generated API client awaits the registered auth-token getter before EVERY fetch. The store wired Clerk's `getToken()` as that getter; on devices/networks where `clerk.sriswastudio.com` is slow or unreachable, `getToken()` hangs → every API query stalls → customers see permanent skeletons and "No products in this category yet" (error state renders same as empty).

**Rule:** any auth-token getter used by the shared client must fail open — try/catch + short timeout (currently 3s Promise.race in the store's `AuthTokenSync`) returning `null`.

**Why:** public storefront endpoints need no token, and `customFetch` already sends cookies (`credentials: "include"`), so admin routes still authenticate via session cookie.

**How to apply:** if reworking auth, consider removing the web token getter entirely (client docs say web apps shouldn't use it) after confirming admin requests succeed with cookies alone in production. Diagnosing "blank site" reports: server was healthy the whole time — verify with `curl https://sriswastudio.com/api/products` before touching the VPS.
