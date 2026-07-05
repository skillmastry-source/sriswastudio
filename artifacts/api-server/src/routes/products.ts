import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  productImagesTable,
  productVariantsTable,
  categoriesTable,
} from "@workspace/db";
import { eq, ilike, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireEditor } from "../middlewares/requireEditor";
import { getAuth } from "@clerk/express";

const router = Router();

async function buildProductResponse(product: typeof productsTable.$inferSelect) {
  const images = await db
    .select()
    .from(productImagesTable)
    .where(eq(productImagesTable.productId, product.id))
    .orderBy(asc(productImagesTable.displayOrder));
  const variants = await db
    .select()
    .from(productVariantsTable)
    .where(eq(productVariantsTable.productId, product.id));
  let categoryName: string | null = null;
  if (product.categoryId) {
    const [cat] = await db
      .select({ name: categoriesTable.name })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, product.categoryId));
    categoryName = cat?.name ?? null;
  }
  return {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    categoryName,
    images: images.map((i) => ({ ...i })),
    variants: variants.map((v) => ({ ...v, priceModifier: Number(v.priceModifier) })),
  };
}

function qval(v: unknown): string | null {
  if (v === undefined || v === null || v === "null" || v === "") return null;
  return String(v);
}

router.get("/products", async (req, res) => {
  const { categoryId, search: rawSearch, minPrice: rawMin, maxPrice: rawMax, sortBy, featured, limit = 20, offset = 0 } = req.query;

  const search = qval(rawSearch);
  const minPrice = qval(rawMin);
  const maxPrice = qval(rawMax);

  const conditions: ReturnType<typeof eq>[] = [eq(productsTable.isActive, true)];
  const catId = categoryId ? Number(categoryId) : null;
  if (catId && !isNaN(catId)) conditions.push(eq(productsTable.categoryId, catId));
  if (featured === "true") conditions.push(eq(productsTable.isFeatured, true));
  if (minPrice) conditions.push(gte(productsTable.price, minPrice));
  if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

  const orderMap: Record<string, ReturnType<typeof asc>> = {
    price_asc: asc(productsTable.price),
    price_desc: desc(productsTable.price),
    newest: desc(productsTable.createdAt),
    name: asc(productsTable.name),
  };
  const order = sortBy ? orderMap[String(sortBy)] : desc(productsTable.createdAt);

  const whereClause = and(...conditions);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(whereClause);

  const products = await db
    .select()
    .from(productsTable)
    .where(whereClause)
    .orderBy(order ?? desc(productsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  const full = await Promise.all(products.map(buildProductResponse));
  return res.json({ products: full, total: count });
});

router.get("/products/featured", async (req, res) => {
  const limit = Number(req.query.limit ?? 8);
  const products = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.isActive, true), eq(productsTable.isFeatured, true)))
    .orderBy(desc(productsTable.createdAt))
    .limit(limit);
  const full = await Promise.all(products.map(buildProductResponse));
  return res.json(full);
});

router.get("/admin/products", requireEditor, async (req, res) => {
  const { search: rawSearch, limit = 100, offset = 0 } = req.query;
  const search = qval(rawSearch);
  const conditions = search ? [ilike(productsTable.name, `%${search}%`)] : [];
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const products = await db
    .select()
    .from(productsTable)
    .where(whereClause)
    .orderBy(desc(productsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(whereClause);
  const full = await Promise.all(products.map(buildProductResponse));
  return res.json({ products: full, total: count });
});

async function checkIsAdmin(userId: string): Promise<boolean> {
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (adminIds.length > 0) return adminIds.includes(userId);
  try {
    const { clerkClient } = await import("@clerk/express");
    const user = await clerkClient.users.getUser(userId);
    return (user.publicMetadata as { role?: string })?.role === "admin";
  } catch {
    return false;
  }
}

router.get("/products/slug/:slug", async (req, res) => {
  const slug = req.params.slug;
  const auth = getAuth(req);
  const isAdmin = auth.userId ? await checkIsAdmin(auth.userId) : false;
  const whereClause = isAdmin
    ? eq(productsTable.slug, slug)
    : and(eq(productsTable.slug, slug), eq(productsTable.isActive, true));
  const [product] = await db.select().from(productsTable).where(whereClause);
  if (!product) return res.status(404).json({ error: "Not found" });
  return res.json(await buildProductResponse(product));
});

router.get("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const auth = getAuth(req);
  const isAdmin = auth.userId ? await checkIsAdmin(auth.userId) : false;
  const whereClause = isAdmin
    ? eq(productsTable.id, id)
    : and(eq(productsTable.id, id), eq(productsTable.isActive, true));
  const [product] = await db.select().from(productsTable).where(whereClause);
  if (!product) return res.status(404).json({ error: "Not found" });
  return res.json(await buildProductResponse(product));
});

router.post("/products", requireEditor, async (req, res) => {
  const {
    name, slug, description, price, compareAtPrice, categoryId,
    isFeatured = false, isActive = true, stockQuantity = 0, lowStockThreshold = 5,
  } = req.body;
  if (!name || !slug || price == null) return res.status(400).json({ error: "name, slug, price required" });
  const [product] = await db
    .insert(productsTable)
    .values({
      name, slug, description: description ?? "", price: String(price),
      compareAtPrice: compareAtPrice ? String(compareAtPrice) : null,
      categoryId: categoryId ?? null, isFeatured, isActive, stockQuantity, lowStockThreshold,
    })
    .returning();
  return res.status(201).json(await buildProductResponse(product));
});

router.patch("/products/:id", requireEditor, async (req, res) => {
  const id = Number(req.params.id);
  const { name, slug, description, price, compareAtPrice, categoryId, isFeatured, isActive, stockQuantity, lowStockThreshold } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (slug !== undefined) updates.slug = slug;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = String(price);
  if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice ? String(compareAtPrice) : null;
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (isFeatured !== undefined) updates.isFeatured = isFeatured;
  if (isActive !== undefined) updates.isActive = isActive;
  if (stockQuantity !== undefined) updates.stockQuantity = stockQuantity;
  if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;
  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!product) return res.status(404).json({ error: "Not found" });
  return res.json(await buildProductResponse(product));
});

router.delete("/products/:id", requireEditor, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  return res.status(204).send();
});

router.post("/products/:id/variants", requireEditor, async (req, res) => {
  const productId = Number(req.params.id);
  const { name, value, priceModifier = 0 } = req.body;
  if (!name || !value) return res.status(400).json({ error: "name and value required" });
  const [variant] = await db
    .insert(productVariantsTable)
    .values({ productId, name, value, priceModifier: String(priceModifier) })
    .returning();
  return res.status(201).json({ ...variant, priceModifier: Number(variant.priceModifier) });
});

router.post("/products/:id/images", requireEditor, async (req, res) => {
  const productId = Number(req.params.id);
  const { url, isPrimary = false, displayOrder = 0 } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });
  if (isPrimary) {
    await db.update(productImagesTable).set({ isPrimary: false }).where(eq(productImagesTable.productId, productId));
  }
  const [img] = await db.insert(productImagesTable).values({ productId, url, isPrimary, displayOrder }).returning();
  return res.status(201).json(img);
});

router.put("/products/:id/images/sync", requireEditor, async (req, res) => {
  const productId = Number(req.params.id);
  const images: { url: string }[] = Array.isArray(req.body.images) ? req.body.images : [];
  await db.delete(productImagesTable).where(eq(productImagesTable.productId, productId));
  if (images.length > 0) {
    await db.insert(productImagesTable).values(
      images.map((img, i) => ({ productId, url: img.url, isPrimary: i === 0, displayOrder: i }))
    );
  }
  return res.json({ success: true });
});

router.put("/products/:id/variants/sync", requireEditor, async (req, res) => {
  const productId = Number(req.params.id);
  const variants: { name: string; value: string; priceModifier: number }[] = Array.isArray(req.body.variants) ? req.body.variants : [];
  await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, productId));
  if (variants.length > 0) {
    await db.insert(productVariantsTable).values(
      variants.map((v) => ({ productId, name: v.name, value: v.value, priceModifier: String(v.priceModifier ?? 0) }))
    );
  }
  return res.json({ success: true });
});

router.get("/products/:id/inventory", requireEditor, async (req, res) => {
  const id = Number(req.params.id);
  const [product] = await db
    .select({ stockQuantity: productsTable.stockQuantity, lowStockThreshold: productsTable.lowStockThreshold })
    .from(productsTable)
    .where(eq(productsTable.id, id));
  if (!product) return res.status(404).json({ error: "Not found" });
  return res.json({ productId: id, ...product });
});

router.patch("/products/:id/inventory", requireEditor, async (req, res) => {
  const id = Number(req.params.id);
  const { stockQuantity, lowStockThreshold } = req.body;
  const updates: Record<string, unknown> = {};
  if (stockQuantity !== undefined) updates.stockQuantity = stockQuantity;
  if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;
  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!product) return res.status(404).json({ error: "Not found" });
  return res.json({ productId: id, stockQuantity: product.stockQuantity, lowStockThreshold: product.lowStockThreshold });
});

export default router;
