---
name: Page Builder Architecture
description: How the homepage page builder works — data model, section types, renderer, and admin builder UI
---

## Data model
`homepageSections` is a JSON array stored in the `site_design` JSONB column of `store_settings`. Each section:
```typescript
{ id: string; type: SectionType; isVisible: boolean; order: number; config: Record<string, unknown> }
```

## Default sections
Defined identically in two places (must stay in sync):
- `artifacts/store/src/hooks/use-site-settings.tsx` — `DEFAULT_HOMEPAGE_SECTIONS`
- `artifacts/api-server/src/routes/site-design.ts` — `DEFAULT_HOMEPAGE_SECTIONS`

The API's `deepMerge(DEFAULT, stored)` auto-populates sections for existing stores that don't have them yet. The frontend hook has a defensive `data.homepageSections ?? DEFAULT_SITE_DESIGN.homepageSections` fallback.

## Section types
`strip`, `hero`, `product_grid`, `category_grid`, `testimonials`, `text_image`, `whatsapp_cta`, `custom_html`

## Key files
- `artifacts/store/src/components/section-renderer.tsx` — all 8 section components + `SectionRenderer`; exports `HomepageSection` type (re-exported from use-site-settings)
- `artifacts/store/src/hooks/use-site-settings.tsx` — canonical `HomepageSection` type definition + `DEFAULT_HOMEPAGE_SECTIONS`
- `artifacts/store/src/pages/admin/builder/index.tsx` — builder UI at `/admin/builder`
- `artifacts/store/src/pages/home.tsx` — simplified to ~15 lines using SectionRenderer

**Why:** `export type { HomepageSection }` in section-renderer.tsx requires a matching `import type` in the same file — re-export alone doesn't bring the name into local scope.
