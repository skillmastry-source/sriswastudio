import { Router } from "express";
import { db } from "@workspace/db";
import { mediaFilesTable } from "@workspace/db";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

function serializeFile(f: typeof mediaFilesTable.$inferSelect) {
  return { ...f, uploadedAt: f.uploadedAt ? new Date(f.uploadedAt).toISOString() : null };
}

// ── List media (with optional folder + search filters) ─────────────────────
router.get("/admin/media", requireAdmin, async (req, res) => {
  const { folder, search } = req.query;
  const conditions: ReturnType<typeof eq>[] = [];
  if (folder && String(folder) !== "All") {
    conditions.push(eq(mediaFilesTable.folder, String(folder)));
  }
  if (search && String(search).trim()) {
    conditions.push(ilike(mediaFilesTable.filename, `%${String(search).trim()}%`));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const files = await db
    .select()
    .from(mediaFilesTable)
    .where(whereClause)
    .orderBy(desc(mediaFilesTable.uploadedAt));
  return res.json(files.map(serializeFile));
});

// ── Folder list (derived from media records) ──────────────────────────────
router.get("/admin/media/folders", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      folder: mediaFilesTable.folder,
      count: sql<number>`count(*)::int`,
    })
    .from(mediaFilesTable)
    .groupBy(mediaFilesTable.folder)
    .orderBy(mediaFilesTable.folder);
  return res.json(rows);
});

// ── Record metadata after client-side upload ──────────────────────────────
router.post("/admin/media", requireAdmin, async (req, res) => {
  const { filename, url, folder, mimeType, sizeBytes } = req.body as {
    filename?: string;
    url?: string;
    folder?: string;
    mimeType?: string;
    sizeBytes?: number;
  };
  if (!filename || !url || !mimeType || sizeBytes === undefined) {
    return res.status(400).json({ error: "filename, url, mimeType, and sizeBytes are required" });
  }
  const [file] = await db
    .insert(mediaFilesTable)
    .values({
      filename,
      url,
      folder: (folder && folder.trim()) ? folder.trim() : "Uncategorized",
      mimeType,
      sizeBytes: Math.round(sizeBytes),
    })
    .returning();
  return res.status(201).json(serializeFile(file));
});

// ── Delete ────────────────────────────────────────────────────────────────
router.delete("/admin/media/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [file] = await db
    .delete(mediaFilesTable)
    .where(eq(mediaFilesTable.id, id))
    .returning();
  if (!file) return res.status(404).json({ error: "File not found" });
  return res.json({ success: true });
});

export default router;
