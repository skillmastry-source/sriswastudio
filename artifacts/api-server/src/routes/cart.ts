import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable, productImagesTable, productVariantsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function buildCart(sessionId: string) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, sessionId));

  const enriched = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (!product) return null;
      const [img] = await db
        .select()
        .from(productImagesTable)
        .where(and(eq(productImagesTable.productId, item.productId), eq(productImagesTable.isPrimary, true)));
      let variantLabel: string | null = null;
      let priceModifier = 0;
      if (item.variantId) {
        const [variant] = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, item.variantId));
        if (variant) {
          variantLabel = `${variant.name}: ${variant.value}`;
          priceModifier = Number(variant.priceModifier);
        }
      }
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(product.price) + priceModifier,
        name: product.name,
        slug: product.slug,
        imageUrl: img?.url ?? null,
        variantId: item.variantId ?? null,
        variantLabel,
      };
    })
  );

  const cartItems = enriched.filter(Boolean) as NonNullable<typeof enriched[0]>[];
  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  return { sessionId, items: cartItems, total, itemCount };
}

router.get("/cart", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  return res.json(await buildCart(String(sessionId)));
});

router.post("/cart/items", async (req, res) => {
  const { sessionId, productId, quantity = 1, variantId } = req.body;
  if (!sessionId || !productId) return res.status(400).json({ error: "sessionId and productId required" });

  const existing = await db
    .select()
    .from(cartItemsTable)
    .where(and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId)));

  if (existing.length > 0) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing[0].quantity + quantity, updatedAt: new Date() })
      .where(eq(cartItemsTable.id, existing[0].id));
  } else {
    await db.insert(cartItemsTable).values({ sessionId, productId, quantity, variantId: variantId ?? null });
  }

  return res.json(await buildCart(sessionId));
});

router.patch("/cart/items/:itemId", async (req, res) => {
  const itemId = Number(req.params.itemId);
  const { quantity } = req.body;
  if (quantity <= 0) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  } else {
    await db.update(cartItemsTable).set({ quantity, updatedAt: new Date() }).where(eq(cartItemsTable.id, itemId));
  }
  const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  const sessionId = item?.sessionId;
  if (!sessionId) return res.json({ sessionId: "", items: [], total: 0, itemCount: 0 });
  return res.json(await buildCart(sessionId));
});

router.delete("/cart/items/:itemId", async (req, res) => {
  const itemId = Number(req.params.itemId);
  const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  const sessionId = item?.sessionId ?? "";
  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  return res.json(await buildCart(sessionId));
});

export default router;
