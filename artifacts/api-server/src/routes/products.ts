import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  productImagesTable,
  productVariantsTable,
  categoriesTable,
} from "@workspace/db";
import { eq, ilike, and, gte, lte, desc, asc, sql } from "drizzle-orm";

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

router.get("/products", async (req, res) => {
  const { categoryId, search, minPrice, maxPrice, sortBy, featured, limit = 20, offset = 0 } = req.query;
  const conditions: ReturnType<typeof eq>[] = [eq(productsTable.isActive, true)];
  const catId = categoryId ? Number(categoryId) : null;
  if (catId && !isNaN(catId)) conditions.push(eq(productsTable.categoryId, catId));
  if (featured === "true") conditions.push(eq(productsTable.isFeatured, true));
  if (minPrice) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice) conditions.push(lte(productsTable.price, String(maxPrice)));

  let query = db.select().from(productsTable).where(and(...conditions));
  if (search) {
    query = db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.isActive, true), ilike(productsTable.name, `%${search}%`)));
  }

  const orderMap: Record<string, ReturnType<typeof asc>> = {
    price_asc: asc(productsTable.price),
    price_desc: desc(productsTable.price),
    newest: desc(productsTable.createdAt),
    name: asc(productsTable.name),
  };
  const order = sortBy ? orderMap[String(sortBy)] : desc(productsTable.createdAt);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(and(...conditions));

  const products = await db
    .select()
    .from(productsTable)
    .where(and(...conditions))
    .orderBy(order ?? desc(productsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  const full = await Promise.all(products.map(buildProductResponse));
  res.json({ products: full, total: count });
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
  res.json(full);
});

router.get("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(await buildProductResponse(product));
});

router.post("/products", async (req, res) => {
  const {
    name, slug, description, price, compareAtPrice, categoryId,
    isFeatured = false, isActive = true, stockQuantity = 0, lowStockThreshold = 5,
  } = req.body;
  if (!name || !slug || price == null) return res.status(400).json({ error: "name, slug, price required" });
  const [product] = await db
    .insert(productsTable)
    .values({ name, slug, description: description ?? "", price: String(price), compareAtPrice: compareAtPrice ? String(compareAtPrice) : null, categoryId: categoryId ?? null, isFeatured, isActive, stockQuantity, lowStockThreshold })
    .returning();
  res.status(201).json(await buildProductResponse(product));
});

router.patch("/products/:id", async (req, res) => {
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
  res.json(await buildProductResponse(product));
});

router.delete("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

router.post("/products/:id/images", async (req, res) => {
  const productId = Number(req.params.id);
  const { url, isPrimary = false, displayOrder = 0 } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });
  if (isPrimary) {
    await db.update(productImagesTable).set({ isPrimary: false }).where(eq(productImagesTable.productId, productId));
  }
  const [img] = await db.insert(productImagesTable).values({ productId, url, isPrimary, displayOrder }).returning();
  res.status(201).json(img);
});

router.get("/products/:id/inventory", async (req, res) => {
  const id = Number(req.params.id);
  const [product] = await db.select({ stockQuantity: productsTable.stockQuantity, lowStockThreshold: productsTable.lowStockThreshold }).from(productsTable).where(eq(productsTable.id, id));
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json({ productId: id, ...product });
});

router.patch("/products/:id/inventory", async (req, res) => {
  const id = Number(req.params.id);
  const { stockQuantity, lowStockThreshold } = req.body;
  const updates: Record<string, unknown> = {};
  if (stockQuantity !== undefined) updates.stockQuantity = stockQuantity;
  if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;
  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json({ productId: id, stockQuantity: product.stockQuantity, lowStockThreshold: product.lowStockThreshold });
});

export default router;
