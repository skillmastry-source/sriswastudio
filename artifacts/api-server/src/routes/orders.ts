import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable, orderItemsTable, cartItemsTable,
  productsTable, productImagesTable, storeSettingsTable,
} from "@workspace/db";
import { eq, and, gte, lte, desc, sql, or, ilike } from "drizzle-orm";
import { sendWhatsApp, renderTemplate } from "../lib/whatsapp";

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

  // Get cart items
  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
  if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

  // Build order items with product details
  const itemsToInsert = await Promise.all(
    cartItems.map(async (ci) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, ci.productId));
      if (!product) return null;
      const [img] = await db.select().from(productImagesTable).where(and(eq(productImagesTable.productId, ci.productId), eq(productImagesTable.isPrimary, true)));
      return {
        productId: ci.productId,
        productName: product.name,
        quantity: ci.quantity,
        price: String(product.price),
        imageUrl: img?.url ?? null,
        variantLabel: null as string | null,
      };
    })
  );

  const validItems = itemsToInsert.filter(Boolean) as NonNullable<typeof itemsToInsert[0]>[];
  const subtotal = validItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const total = subtotal; // free shipping for now

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber, status: "pending", customerName, customerPhone, customerEmail,
      shippingAddress, city, state, pincode, notes: notes ?? null,
      subtotal: String(subtotal), shippingCost: "0", total: String(total), paymentMethod,
    })
    .returning();

  await db.insert(orderItemsTable).values(validItems.map((i) => ({ orderId: order.id, ...i })));

  // Decrement stock
  await Promise.all(
    validItems.map((i) =>
      db.execute(
        sql`UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ${i.quantity}) WHERE id = ${i.productId}`
      )
    )
  );

  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

  // WhatsApp notification to admin
  const [settings] = await db.select().from(storeSettingsTable);
  if (settings?.adminWhatsapp) {
    const msg = renderTemplate(settings.newOrderTemplate, {
      orderNumber, customerName, total: total.toFixed(2), phone: customerPhone,
    });
    await sendWhatsApp(settings.adminWhatsapp, msg);
  }

  res.status(201).json(await buildOrderResponse(order));
});

router.get("/orders", async (req, res) => {
  const { status, dateFrom, dateTo, limit = 20, offset = 0 } = req.query;
  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(ordersTable.status, String(status)));
  if (dateFrom) conditions.push(gte(ordersTable.createdAt, new Date(String(dateFrom))));
  if (dateTo) conditions.push(lte(ordersTable.createdAt, new Date(String(dateTo))));

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const orders = await db
    .select()
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  const full = await Promise.all(orders.map(buildOrderResponse));
  res.json({ orders: full, total: count });
});

router.get("/orders/track", async (req, res) => {
  const { orderNumber, email } = req.query;
  if (!orderNumber && !email) return res.status(400).json({ error: "orderNumber or email required" });
  const conditions: ReturnType<typeof eq>[] = [];
  if (orderNumber) conditions.push(eq(ordersTable.orderNumber, String(orderNumber)));
  if (email) conditions.push(ilike(ordersTable.customerEmail, String(email)));
  const [order] = await db.select().from(ordersTable).where(and(...conditions));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(await buildOrderResponse(order));
});

router.get("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(await buildOrderResponse(order));
});

router.patch("/orders/:id/status", async (req, res) => {
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

  // WhatsApp notification to customer
  const [settings] = await db.select().from(storeSettingsTable);
  if (settings?.statusUpdateTemplate) {
    const msg = renderTemplate(settings.statusUpdateTemplate, {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      status,
    });
    await sendWhatsApp(order.customerPhone, msg);
  }

  res.json(await buildOrderResponse(order));
});

export default router;
