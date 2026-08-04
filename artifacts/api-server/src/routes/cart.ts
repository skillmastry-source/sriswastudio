import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable, productImagesTable, productVariantsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

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
        variantId: item.variantId ?? null,
        variantLabel,
        quantity: item.quantity,
        stockQuantity: product.stockQuantity,
        price: Number(product.price) + priceModifier,
        productName: product.name,
        slug: product.slug,
        imageUrl: img?.url ?? null,
      };
    })
  );

  const cartItems = enriched.filter(Boolean) as NonNullable<typeof enriched[0]>[];

  // Build a map of total quantity per productId so we can derive per-line maxQuantity
  const totalPerProduct = new Map<number, number>();
  for (const item of cartItems) {
    totalPerProduct.set(item.productId, (totalPerProduct.get(item.productId) ?? 0) + item.quantity);
  }

  const itemsWithMax = cartItems.map((item) => {
    const totalForProduct = totalPerProduct.get(item.productId) ?? item.quantity;
    const otherVariantQty = totalForProduct - item.quantity;
    const maxQuantity = Math.max(1, item.stockQuantity - otherVariantQty);
    return { ...item, maxQuantity };
  });

  const total = itemsWithMax.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = itemsWithMax.reduce((sum, i) => sum + i.quantity, 0);
  return { sessionId, items: itemsWithMax, total, itemCount };
}

router.get("/cart", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  return res.json(await buildCart(String(sessionId)));
});

router.post("/cart/items", async (req, res) => {
  const { sessionId, productId, quantity = 1, variantId } = req.body;
  if (!sessionId || !productId) return res.status(400).json({ error: "sessionId and productId required" });

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product || !product.isActive) return res.status(400).json({ error: "Product is not available" });
  if (product.stockQuantity <= 0) return res.status(400).json({ error: "Product is out of stock" });

  // Enforce stock atomically, summing ALL variants of this product already in the session's cart.
  // SELECT ... FOR UPDATE on the product row serializes concurrent adds: the second transaction
  // waits for the first to commit before reading cart state, preventing both from seeing the
  // same total and independently exceeding stock.
  const accepted = await db.transaction(async (tx) => {
    // Lock the product row — concurrent adds for the same product queue here
    const [lockedProduct] = await tx
      .select({ stockQuantity: productsTable.stockQuantity })
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .for("update");
    if (!lockedProduct) return 0;

    // Sum all existing cart lines across every variant for this session + product
    const allLines = await tx
      .select({ qty: cartItemsTable.quantity })
      .from(cartItemsTable)
      .where(and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId)));
    const totalInCart = allLines.reduce((s, r) => s + r.qty, 0);

    const canAdd = Math.max(0, lockedProduct.stockQuantity - totalInCart);
    if (canAdd <= 0) return 0;

    const safeQty = Math.min(quantity, canAdd);

    const matchCondition = variantId != null
      ? and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId), eq(cartItemsTable.variantId, variantId))
      : and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId), isNull(cartItemsTable.variantId));

    const [existing] = await tx.select().from(cartItemsTable).where(matchCondition);

    if (existing) {
      await tx.update(cartItemsTable)
        .set({ quantity: existing.quantity + safeQty, updatedAt: new Date() })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      await tx.insert(cartItemsTable).values({ sessionId, productId, quantity: safeQty, variantId: variantId ?? null });
    }
    return safeQty;
  });

  if (accepted === 0) {
    return res.status(400).json({ error: "Product is out of stock" });
  }

  return res.json(await buildCart(sessionId));
});

router.patch("/cart/items/:itemId", async (req, res) => {
  const itemId = Number(req.params.itemId);
  const { quantity, sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  if (!item) return res.status(404).json({ error: "Item not found" });
  if (item.sessionId !== sessionId) return res.status(403).json({ error: "Forbidden" });

  if (quantity <= 0) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  } else {
    // Aggregate-aware stock cap: lock product row, sum ALL other variant lines for
    // this session+product, then cap the updated line at stock - otherVariantTotal.
    const safeQty = await db.transaction(async (tx) => {
      const [lockedProduct] = await tx
        .select({ stockQuantity: productsTable.stockQuantity })
        .from(productsTable)
        .where(eq(productsTable.id, item.productId))
        .for("update");
      if (!lockedProduct) return 0;

      // Sum quantities of every OTHER line for this product in this session
      const otherLines = await tx
        .select({ qty: cartItemsTable.quantity })
        .from(cartItemsTable)
        .where(
          and(
            eq(cartItemsTable.sessionId, sessionId),
            eq(cartItemsTable.productId, item.productId),
          )
        );
      const otherVariantTotal = otherLines
        .filter((l) => l !== null)
        .reduce((s, r) => s + r.qty, 0) - item.quantity; // subtract current line's qty

      const maxForThisLine = Math.max(0, lockedProduct.stockQuantity - otherVariantTotal);
      return Math.min(quantity, maxForThisLine);
    });

    if (safeQty <= 0) {
      return res.status(400).json({ error: "Product is out of stock" });
    }
    await db.update(cartItemsTable).set({ quantity: safeQty, updatedAt: new Date() }).where(eq(cartItemsTable.id, itemId));
  }
  return res.json(await buildCart(sessionId));
});

router.delete("/cart/items/:itemId", async (req, res) => {
  const itemId = Number(req.params.itemId);
  const sessionId = String(req.query.sessionId ?? "");
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  if (!item) return res.status(404).json({ error: "Item not found" });
  if (item.sessionId !== sessionId) return res.status(403).json({ error: "Forbidden" });

  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  return res.json(await buildCart(sessionId));
});

router.delete("/cart/clear", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, String(sessionId)));
  return res.json({ success: true });
});

export default router;
