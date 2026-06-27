import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

router.get("/categories", async (req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const counts = await db
    .select({ categoryId: productsTable.categoryId, count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.isActive, true))
    .groupBy(productsTable.categoryId);
  const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, c.count]));
  return res.json(cats.map((c) => ({ ...c, productCount: countMap[c.id] ?? 0 })));
});

router.get("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
  if (!cat) return res.status(404).json({ error: "Not found" });
  return res.json({ ...cat, productCount: 0 });
});

router.post("/categories", requireAdmin, async (req, res) => {
  const { name, slug, description, imageUrl } = req.body;
  if (!name || !slug) return res.status(400).json({ error: "name and slug required" });
  const [cat] = await db.insert(categoriesTable).values({ name, slug, description, imageUrl }).returning();
  return res.status(201).json({ ...cat, productCount: 0 });
});

router.patch("/categories/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, slug, description, imageUrl } = req.body;
  const [cat] = await db
    .update(categoriesTable)
    .set({ name, slug, description, imageUrl, updatedAt: new Date() })
    .where(eq(categoriesTable.id, id))
    .returning();
  if (!cat) return res.status(404).json({ error: "Not found" });
  return res.json({ ...cat, productCount: 0 });
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  return res.status(204).send();
});

export default router;
