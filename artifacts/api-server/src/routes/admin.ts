import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, storeSettingsTable } from "@workspace/db";
import { eq, gte, sql, lte, and, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
import { sendWhatsApp } from "../lib/whatsapp";
import nodemailer from "nodemailer";

const router = Router();

router.use(requireAdmin);

router.get("/admin/dashboard", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayStats] = await db
    .select({
      todayOrders: sql<number>`count(*)::int`,
      todayRevenue: sql<number>`coalesce(sum(total::numeric), 0)::float`,
    })
    .from(ordersTable)
    .where(and(gte(ordersTable.createdAt, today), lte(ordersTable.createdAt, tomorrow)));

  const [allStats] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`coalesce(sum(total::numeric), 0)::float`,
    })
    .from(ordersTable);

  const [lowStockResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(sql`stock_quantity <= low_stock_threshold AND is_active = true`);

  const recentOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(sql`created_at desc`)
    .limit(5);

  const statusCounts = await db
    .select({ status: ordersTable.status, count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  const recentFull = await Promise.all(
    recentOrders.map(async (order) => {
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
    })
  );

  return res.json({
    todayOrders: todayStats.todayOrders,
    todayRevenue: todayStats.todayRevenue,
    totalOrders: allStats.totalOrders,
    totalRevenue: allStats.totalRevenue,
    lowStockCount: lowStockResult.count,
    recentOrders: recentFull,
    ordersByStatus: statusCounts,
  });
});

router.get("/admin/inventory/low-stock", async (req, res) => {
  const items = await db
    .select({
      productId: productsTable.id,
      productName: productsTable.name,
      stockQuantity: productsTable.stockQuantity,
      lowStockThreshold: productsTable.lowStockThreshold,
    })
    .from(productsTable)
    .where(sql`stock_quantity <= low_stock_threshold AND is_active = true`);
  return res.json(items);
});

router.get("/admin/inventory", async (req, res) => {
  const items = await db
    .select({
      productId: productsTable.id,
      productName: productsTable.name,
      stockQuantity: productsTable.stockQuantity,
      lowStockThreshold: productsTable.lowStockThreshold,
    })
    .from(productsTable)
    .where(eq(productsTable.isActive, true));
  return res.json(
    items.map((i) => ({ ...i, isLowStock: i.stockQuantity <= i.lowStockThreshold }))
  );
});

router.get("/admin/settings", async (req, res) => {
  let [settings] = await db.select().from(storeSettingsTable);
  if (!settings) {
    [settings] = await db.insert(storeSettingsTable).values({}).returning();
  }
  return res.json(settings);
});

router.patch("/admin/settings", async (req, res) => {
  const { storeName, adminWhatsapp, newOrderTemplate, statusUpdateTemplate } = req.body;
  let [settings] = await db.select().from(storeSettingsTable);
  if (!settings) {
    [settings] = await db.insert(storeSettingsTable).values({}).returning();
  }
  const updates: Record<string, string> = {};
  if (storeName !== undefined) updates.storeName = storeName;
  if (adminWhatsapp !== undefined) updates.adminWhatsapp = adminWhatsapp;
  if (newOrderTemplate !== undefined) updates.newOrderTemplate = newOrderTemplate;
  if (statusUpdateTemplate !== undefined) updates.statusUpdateTemplate = statusUpdateTemplate;
  const [updated] = await db.update(storeSettingsTable).set(updates).where(eq(storeSettingsTable.id, settings.id)).returning();
  return res.json(updated);
});

router.get("/admin/analytics/overview", async (_req, res) => {
  const [avg] = await db
    .select({ avgOrderValue: sql<number>`coalesce(avg(total::numeric), 0)::float` })
    .from(ordersTable);

  const [customers] = await db
    .select({ totalCustomers: sql<number>`count(distinct customer_email)::int` })
    .from(ordersTable);

  return res.json({
    avgOrderValue: avg.avgOrderValue,
    totalCustomers: customers.totalCustomers,
  });
});

router.get("/admin/analytics/revenue", async (req, res) => {
  const period = String(req.query.period ?? "monthly");

  let truncUnit: string;
  let labelFormat: string;
  let from: Date;

  if (period === "daily") {
    truncUnit = "day";
    labelFormat = "DD Mon";
    from = new Date();
    from.setDate(from.getDate() - 30);
  } else if (period === "weekly") {
    truncUnit = "week";
    labelFormat = "DD Mon";
    from = new Date();
    from.setDate(from.getDate() - 84);
  } else {
    truncUnit = "month";
    labelFormat = "Mon YYYY";
    from = new Date();
    from.setMonth(from.getMonth() - 12);
  }
  from.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc(${truncUnit}, created_at), ${labelFormat})`,
      revenue: sql<number>`coalesce(sum(total::numeric), 0)::float`,
      orders: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, from))
    .groupBy(sql`date_trunc(${truncUnit}, created_at)`)
    .orderBy(sql`date_trunc(${truncUnit}, created_at)`);

  return res.json(rows);
});

router.get("/admin/analytics/top-products", async (req, res) => {
  const sortBy = String(req.query.sortBy ?? "revenue");
  const orderExpr = sortBy === "units"
    ? desc(sql`sum(quantity)`)
    : desc(sql`sum(price::numeric * quantity)`);

  const rows = await db
    .select({
      productId: orderItemsTable.productId,
      productName: orderItemsTable.productName,
      revenue: sql<number>`sum(price::numeric * quantity)::float`,
      unitsSold: sql<number>`sum(quantity)::int`,
    })
    .from(orderItemsTable)
    .groupBy(orderItemsTable.productId, orderItemsTable.productName)
    .orderBy(orderExpr)
    .limit(5);

  return res.json(rows);
});

router.get("/admin/marketing/broadcast/stats", async (_req, res) => {
  const [phones] = await db
    .select({ count: sql<number>`count(distinct customer_phone)::int` })
    .from(ordersTable)
    .where(sql`customer_phone IS NOT NULL AND customer_phone != ''`);

  const [emails] = await db
    .select({ count: sql<number>`count(distinct customer_email)::int` })
    .from(ordersTable)
    .where(sql`customer_email IS NOT NULL AND customer_email != ''`);

  return res.json({ whatsappRecipients: phones.count, emailRecipients: emails.count });
});

router.post("/admin/marketing/broadcast/whatsapp", async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

  const rows = await db
    .selectDistinct({ phone: ordersTable.customerPhone })
    .from(ordersTable)
    .where(sql`customer_phone IS NOT NULL AND customer_phone != ''`);

  let sent = 0, failed = 0;
  for (const { phone } of rows) {
    if (!phone) continue;
    const ok = await sendWhatsApp(phone, message);
    if (ok) sent++; else failed++;
  }

  return res.json({ sent, failed, total: rows.length });
});

router.post("/admin/marketing/broadcast/email", async (req, res) => {
  const { subject, html } = req.body;
  if (!subject?.trim() || !html?.trim()) return res.status(400).json({ error: "Subject and body are required" });

  let [settings] = await db.select().from(storeSettingsTable);
  const smtp = (settings?.siteDesign as Record<string, unknown> | null)?.smtpConfig as Record<string, unknown> | undefined;

  if (!smtp?.host || !smtp?.user || !smtp?.pass) {
    return res.status(400).json({ error: "SMTP not configured. Go to Marketing → Email Settings." });
  }

  const transporter = nodemailer.createTransport({
    host: String(smtp.host),
    port: Number(smtp.port ?? 587),
    secure: Boolean(smtp.secure ?? false),
    auth: { user: String(smtp.user), pass: String(smtp.pass) },
  });

  const rows = await db
    .selectDistinct({ email: ordersTable.customerEmail })
    .from(ordersTable)
    .where(sql`customer_email IS NOT NULL AND customer_email != ''`);

  const storeName = settings?.storeName ?? "Sriswa Studio";
  const fromAddr = smtp.from ? String(smtp.from) : `${storeName} <${smtp.user}>`;

  let sent = 0, failed = 0;
  for (const { email } of rows) {
    if (!email) continue;
    try {
      await transporter.sendMail({ from: fromAddr, to: email, subject, html });
      sent++;
    } catch {
      failed++;
    }
  }

  return res.json({ sent, failed, total: rows.length });
});

export default router;
