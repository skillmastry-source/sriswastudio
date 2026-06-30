import { Router } from "express";
import { db, landingPagesTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

async function ensureTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS landing_pages (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        sections JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_published BOOLEAN NOT NULL DEFAULT false,
        is_in_nav BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`
      ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS is_in_nav BOOLEAN NOT NULL DEFAULT false
    `);
    await db.execute(sql`
      ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS meta_title TEXT
    `);
    await db.execute(sql`
      ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS meta_description TEXT
    `);
    await db.execute(sql`
      ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0
    `);
  } catch {
    // already exists
  }
}

ensureTable();

// Public: list pages
router.get("/landing-pages", async (_req, res) => {
  try {
    const pages = await db
      .select({ id: landingPagesTable.id, title: landingPagesTable.title, slug: landingPagesTable.slug, isPublished: landingPagesTable.isPublished, isInNav: landingPagesTable.isInNav, sortOrder: landingPagesTable.sortOrder, updatedAt: landingPagesTable.updatedAt })
      .from(landingPagesTable)
      .orderBy(landingPagesTable.sortOrder, landingPagesTable.title);
    return res.json(pages);
  } catch (e) {
    console.error("[landing-pages] list error:", e);
    return res.status(500).json({ error: "Failed to list landing pages" });
  }
});

// Public: list nav-visible pages
router.get("/landing-pages/nav", async (_req, res) => {
  try {
    const pages = await db
      .select({ id: landingPagesTable.id, title: landingPagesTable.title, slug: landingPagesTable.slug, sortOrder: landingPagesTable.sortOrder })
      .from(landingPagesTable)
      .where(sql`is_published = true AND is_in_nav = true`)
      .orderBy(landingPagesTable.sortOrder, landingPagesTable.title);
    return res.json(pages);
  } catch (e) {
    console.error("[landing-pages] nav list error:", e);
    return res.status(500).json({ error: "Failed to list nav pages" });
  }
});

// Public: get page by slug (returns sections for SectionRenderer)
// Only returns published pages — drafts get a 404.
router.get("/landing-pages/:slug", async (req, res) => {
  try {
    const [page] = await db
      .select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.slug, req.params.slug));
    if (!page) return res.status(404).json({ error: "Page not found" });
    if (!page.isPublished) return res.status(404).json({ error: "Page not found" });
    return res.json(page);
  } catch (e) {
    console.error("[landing-pages] get error:", e);
    return res.status(500).json({ error: "Failed to get page" });
  }
});

// Admin: get page by ID (works for drafts — used by the builder)
router.get("/admin/landing-pages/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [page] = await db
      .select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.id, id));
    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(page);
  } catch (e) {
    console.error("[landing-pages] admin get error:", e);
    return res.status(500).json({ error: "Failed to get page" });
  }
});

// Admin: get page by slug (works for drafts — used by storefront preview mode)
router.get("/admin/landing-pages/slug/:slug", requireAdmin, async (req, res) => {
  try {
    const [page] = await db
      .select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.slug, req.params.slug));
    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(page);
  } catch (e) {
    console.error("[landing-pages] admin slug get error:", e);
    return res.status(500).json({ error: "Failed to get page" });
  }
});

// Admin: create page
router.post("/admin/landing-pages", requireAdmin, async (req, res) => {
  try {
    const { title, slug, sections, isPublished, isInNav, metaTitle, metaDescription } = req.body as {
      title: string; slug: string; sections?: unknown[]; isPublished?: boolean; isInNav?: boolean;
      metaTitle?: string; metaDescription?: string;
    };
    if (!title || !slug) return res.status(400).json({ error: "title and slug are required" });

    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");

    const [page] = await db
      .insert(landingPagesTable)
      .values({ title, slug: safeSlug, sections: sections ?? [], isPublished: isPublished ?? false, isInNav: isInNav ?? false, metaTitle: metaTitle ?? null, metaDescription: metaDescription ?? null })
      .returning();
    return res.status(201).json(page);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return res.status(409).json({ error: "A page with this slug already exists" });
    console.error(e);
    return res.status(500).json({ error: "Failed to create page" });
  }
});

// Admin: bulk reorder pages
router.patch("/admin/landing-pages/reorder", requireAdmin, async (req, res) => {
  try {
    const items = req.body as { id: number; sortOrder: number }[];
    if (!Array.isArray(items)) return res.status(400).json({ error: "Expected array of { id, sortOrder }" });
    await db.transaction(async (tx) => {
      for (const { id, sortOrder } of items) {
        await tx.update(landingPagesTable).set({ sortOrder }).where(eq(landingPagesTable.id, id));
      }
    });
    return res.json({ ok: true });
  } catch (e) {
    console.error("[landing-pages] reorder error:", e);
    return res.status(500).json({ error: "Failed to reorder pages" });
  }
});

// Admin: update page
router.patch("/admin/landing-pages/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, slug, sections, isPublished, isInNav, sortOrder, metaTitle, metaDescription } = req.body as {
      title?: string; slug?: string; sections?: unknown[]; isPublished?: boolean; isInNav?: boolean;
      sortOrder?: number; metaTitle?: string | null; metaDescription?: string | null;
    };

    const updates: Partial<{ title: string; slug: string; sections: unknown[]; isPublished: boolean; isInNav: boolean; sortOrder: number; metaTitle: string | null; metaDescription: string | null; updatedAt: Date }> = {};
    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
    if (sections !== undefined) updates.sections = sections;
    if (isPublished !== undefined) updates.isPublished = isPublished;
    if (isInNav !== undefined) updates.isInNav = isInNav;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (metaTitle !== undefined) updates.metaTitle = metaTitle ?? null;
    if (metaDescription !== undefined) updates.metaDescription = metaDescription ?? null;
    updates.updatedAt = new Date();

    const [page] = await db
      .update(landingPagesTable)
      .set(updates)
      .where(eq(landingPagesTable.id, id))
      .returning();

    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(page);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return res.status(409).json({ error: "A page with this slug already exists" });
    console.error(e);
    return res.status(500).json({ error: "Failed to update page" });
  }
});

// Admin: delete page
router.delete("/admin/landing-pages/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(landingPagesTable).where(eq(landingPagesTable.id, id));
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to delete page" });
  }
});

export default router;
