import { Router } from "express";
import { db } from "@workspace/db";
import { cmsPagesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

/* ── Public routes ── */

router.get("/cms/pages", async (_req, res) => {
  try {
    const pages = await db
      .select()
      .from(cmsPagesTable)
      .where(eq(cmsPagesTable.isPublished, true))
      .orderBy(cmsPagesTable.createdAt);
    return res.json(pages);
  } catch (err) {
    console.error("cms list error", err);
    return res.status(500).json({ error: "Failed to fetch pages" });
  }
});

router.get("/cms/pages/:slug", async (req, res) => {
  try {
    const [page] = await db
      .select()
      .from(cmsPagesTable)
      .where(
        and(
          eq(cmsPagesTable.slug, req.params.slug),
          eq(cmsPagesTable.isPublished, true)
        )
      )
      .limit(1);
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }
    return res.json(page);
  } catch (err) {
    console.error("cms page error", err);
    return res.status(500).json({ error: "Failed to fetch page" });
  }
});

/* ── Admin routes ── */

router.get("/admin/cms/pages", requireAdmin, async (_req, res) => {
  try {
    const pages = await db
      .select()
      .from(cmsPagesTable)
      .orderBy(cmsPagesTable.createdAt);
    return res.json(pages);
  } catch (err) {
    console.error("admin cms list error", err);
    return res.status(500).json({ error: "Failed to fetch pages" });
  }
});

router.post("/admin/cms/pages", requireAdmin, async (req, res) => {
  try {
    const { type, slug, title, content, metaTitle, metaDescription, isPublished } = req.body;
    if (!type || !slug || !title) {
      return res.status(400).json({ error: "type, slug, and title are required" });
    }
    const now = new Date();
    const [page] = await db
      .insert(cmsPagesTable)
      .values({
        type: String(type),
        slug: String(slug),
        title: String(title),
        content: content ? String(content) : "",
        metaTitle: metaTitle ? String(metaTitle) : null,
        metaDescription: metaDescription ? String(metaDescription) : null,
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? now : null,
        updatedAt: now,
      })
      .returning();
    return res.json(page);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "A page with this slug already exists" });
    }
    console.error("cms create error", err);
    return res.status(500).json({ error: "Failed to create page" });
  }
});

router.patch("/admin/cms/pages/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const { type, slug, title, content, metaTitle, metaDescription, isPublished } = req.body;
    const now = new Date();

    const existing = await db.select().from(cmsPagesTable).where(eq(cmsPagesTable.id, id)).limit(1);
    if (!existing.length) return res.status(404).json({ error: "Page not found" });

    const wasPublished = existing[0].isPublished;
    const willPublish  = Boolean(isPublished);

    const [page] = await db
      .update(cmsPagesTable)
      .set({
        ...(type !== undefined         ? { type: String(type) }                         : {}),
        ...(slug !== undefined         ? { slug: String(slug) }                         : {}),
        ...(title !== undefined        ? { title: String(title) }                       : {}),
        ...(content !== undefined      ? { content: String(content) }                   : {}),
        ...(metaTitle !== undefined    ? { metaTitle: metaTitle ? String(metaTitle) : null } : {}),
        ...(metaDescription !== undefined ? { metaDescription: metaDescription ? String(metaDescription) : null } : {}),
        isPublished: willPublish,
        publishedAt: willPublish && !wasPublished ? now : (willPublish ? existing[0].publishedAt : null),
        updatedAt: now,
      })
      .where(eq(cmsPagesTable.id, id))
      .returning();
    return res.json(page);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "A page with this slug already exists" });
    }
    console.error("cms update error", err);
    return res.status(500).json({ error: "Failed to update page" });
  }
});

router.delete("/admin/cms/pages/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await db.delete(cmsPagesTable).where(eq(cmsPagesTable.id, id));
    return res.json({ ok: true });
  } catch (err) {
    console.error("cms delete error", err);
    return res.status(500).json({ error: "Failed to delete page" });
  }
});

export default router;
