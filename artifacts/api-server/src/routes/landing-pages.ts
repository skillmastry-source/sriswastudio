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
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
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
      .select({ id: landingPagesTable.id, title: landingPagesTable.title, slug: landingPagesTable.slug, isPublished: landingPagesTable.isPublished, updatedAt: landingPagesTable.updatedAt })
      .from(landingPagesTable)
      .orderBy(landingPagesTable.createdAt);
    return res.json(pages);
  } catch (e) {
    console.error("[landing-pages] list error:", e);
    return res.status(500).json({ error: "Failed to list landing pages" });
  }
});

// Public: get page by slug (returns sections for SectionRenderer)
router.get("/landing-pages/:slug", async (req, res) => {
  try {
    const [page] = await db
      .select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.slug, req.params.slug));
    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(page);
  } catch (e) {
    console.error("[landing-pages] get error:", e);
    return res.status(500).json({ error: "Failed to get page" });
  }
});

// Admin: create page
router.post("/admin/landing-pages", requireAdmin, async (req, res) => {
  try {
    const { title, slug, sections, isPublished } = req.body as {
      title: string; slug: string; sections?: unknown[]; isPublished?: boolean;
    };
    if (!title || !slug) return res.status(400).json({ error: "title and slug are required" });

    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");

    const [page] = await db
      .insert(landingPagesTable)
      .values({ title, slug: safeSlug, sections: sections ?? [], isPublished: isPublished ?? false })
      .returning();
    return res.status(201).json(page);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return res.status(409).json({ error: "A page with this slug already exists" });
    console.error(e);
    return res.status(500).json({ error: "Failed to create page" });
  }
});

// Admin: update page
router.patch("/admin/landing-pages/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, slug, sections, isPublished } = req.body as {
      title?: string; slug?: string; sections?: unknown[]; isPublished?: boolean;
    };

    const updates: Partial<{ title: string; slug: string; sections: unknown[]; isPublished: boolean; updatedAt: Date }> = {};
    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
    if (sections !== undefined) updates.sections = sections;
    if (isPublished !== undefined) updates.isPublished = isPublished;
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
