import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable, orderItemsTable, cartItemsTable,
  productsTable, productImagesTable, productVariantsTable, storeSettingsTable,
} from "@workspace/db";
import { eq, and, gte, lte, desc, sql, ilike } from "drizzle-orm";
import { sendWhatsApp, renderTemplate } from "../lib/whatsapp";
import { requireAdmin } from "../middlewares/requireAdmin";
import { clerkClient } from "@clerk/express";

const router = Router();

function generateOrderNumber(): string {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SS${now}${rand}`;
}

async function buildOrderResponse(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    items: items.map((i) => ({ ...i, price: Number(i.price) })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.post("/orders", async (req, res) => {
  const {
    sessionId, customerName, customerPhone, customerEmail,
    shippingAddress, city, state, pincode, notes, paymentMethod = "cod",
  } = req.body;

  if (!sessionId || !customerName || !customerPhone || !customerEmail || !shippingAddress || !city || !state || !pincode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
  if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

  // Resolve all order items and validate stock before touching anything
  const itemsToInsert = await Promise.all(
    cartItems.map(async (ci) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, ci.productId));
      if (!product || !product.isActive) return null;
      const [img] = await db.select().from(productImagesTable).where(and(eq(productImagesTable.productId, ci.productId), eq(productImagesTable.isPrimary, true)));
      let variantLabel: string | null = null;
      let unitPrice = Number(product.price);
      if (ci.variantId) {
        const [variant] = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, ci.variantId));
        if (variant) {
          variantLabel = `${variant.name}: ${variant.value}`;
          unitPrice = Number(product.price) + Number(variant.priceModifier);
        }
      }
      return {
        productId: ci.productId,
        productName: product.name,
        stockQuantity: product.stockQuantity,
        quantity: ci.quantity,
        price: String(unitPrice),
        imageUrl: img?.url ?? null,
        variantLabel,
      };
    })
  );

  const validItems = itemsToInsert.filter(Boolean) as NonNullable<typeof itemsToInsert[0]>[];
  if (validItems.length === 0) return res.status(400).json({ error: "No active products in cart" });

  // Server-side stock check before committing the order
  const insufficientStock = validItems.filter((i) => i.quantity > i.stockQuantity);
  if (insufficientStock.length > 0) {
    return res.status(400).json({
      error: "Insufficient stock",
      items: insufficientStock.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        requested: i.quantity,
        available: i.stockQuantity,
      })),
    });
  }

  const subtotal = validItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const total = subtotal;
  const orderNumber = generateOrderNumber();

  // Execute order creation, stock decrement, and cart clear in a single transaction
  // with row-level locks to prevent race-condition oversell
  const order = await db.transaction(async (tx) => {
    // Lock the product rows for update to serialise concurrent orders
    for (const i of validItems) {
      const result = await tx.execute(
        sql`SELECT stock_quantity FROM products WHERE id = ${i.productId} FOR UPDATE`
      );
      const locked = result.rows[0] as { stock_quantity: number } | undefined;
      const available = locked?.stock_quantity ?? 0;
      if (i.quantity > available) {
        throw new Error(`INSUFFICIENT_STOCK:${i.productName}`);
      }
    }

    const [newOrder] = await tx
      .insert(ordersTable)
      .values({
        orderNumber, status: "pending", customerName, customerPhone, customerEmail,
        shippingAddress, city, state, pincode, notes: notes ?? null,
        subtotal: String(subtotal), shippingCost: "0", total: String(total), paymentMethod,
      })
      .returning();

    await tx.insert(orderItemsTable).values(
      validItems.map(({ stockQuantity: _s, ...i }) => ({ orderId: newOrder.id, ...i }))
    );

    for (const i of validItems) {
      await tx.execute(
        sql`UPDATE products SET stock_quantity = stock_quantity - ${i.quantity} WHERE id = ${i.productId}`
      );
    }

    await tx.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

    return newOrder;
  });

  const [settings] = await db.select().from(storeSettingsTable);
  if (settings?.adminWhatsapp) {
    const msg = renderTemplate(settings.newOrderTemplate, {
      orderNumber, customerName, total: total.toFixed(2), phone: customerPhone,
    });
    await sendWhatsApp(settings.adminWhatsapp, msg);
  }

  return res.status(201).json(await buildOrderResponse(order));
});

router.get("/orders/my", async (req, res) => {
  const auth = (req as unknown as { auth?: { userId?: string } }).auth;
  if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

  let email: string;
  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
    email = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
    if (!email) return res.status(400).json({ error: "No email on account" });
  } catch {
    return res.status(500).json({ error: "Failed to resolve user" });
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(ilike(ordersTable.customerEmail, email))
    .orderBy(desc(ordersTable.createdAt))
    .limit(50);

  const full = await Promise.all(orders.map(buildOrderResponse));
  return res.json({ orders: full, total: full.length });
});

router.get("/orders/track", async (req, res) => {
  const { orderNumber, email } = req.query;
  if (!orderNumber || !email) return res.status(400).json({ error: "orderNumber and email required" });
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.orderNumber, String(orderNumber)),
        ilike(ordersTable.customerEmail, String(email))
      )
    );
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(await buildOrderResponse(order));
});

router.get("/orders", requireAdmin, async (req, res) => {
  const { status, dateFrom, dateTo, limit = 20, offset = 0 } = req.query;
  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(ordersTable.status, String(status)));
  if (dateFrom) conditions.push(gte(ordersTable.createdAt, new Date(String(dateFrom))));
  if (dateTo) conditions.push(lte(ordersTable.createdAt, new Date(String(dateTo))));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(whereClause);

  const orders = await db
    .select()
    .from(ordersTable)
    .where(whereClause)
    .orderBy(desc(ordersTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  const full = await Promise.all(orders.map(buildOrderResponse));
  return res.json({ orders: full, total: count });
});

router.get("/orders/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) return res.status(404).json({ error: "Not found" });
  return res.json(await buildOrderResponse(order));
});

router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const valid = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const [order] = await db
    .update(ordersTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(ordersTable.id, id))
    .returning();

  if (!order) return res.status(404).json({ error: "Not found" });

  const [settings] = await db.select().from(storeSettingsTable);
  if (settings?.statusUpdateTemplate) {
    const msg = renderTemplate(settings.statusUpdateTemplate, {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      status,
    });
    await sendWhatsApp(order.customerPhone, msg);
  }

  return res.json(await buildOrderResponse(order));
});

export default router;
