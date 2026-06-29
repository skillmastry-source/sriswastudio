import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, customerNotesTable, leads } from "@workspace/db/schema";
import { eq, ilike, sql, desc, or } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();
router.use(requireAdmin);

/* ── helpers ── */
type Segment = "all" | "vip" | "returning" | "new";

function getSegment(orderCount: number, totalSpend: number): "vip" | "returning" | "new" {
  if (orderCount > 3 || totalSpend > 5000) return "vip";
  if (orderCount === 1) return "new";
  return "returning";
}

/* ── Customer list ── */
router.get("/admin/customers", async (req, res) => {
  try {
    const search  = String(req.query.search  ?? "").trim();
    const segment = String(req.query.segment ?? "all") as Segment;
    const page    = Math.max(1, Number(req.query.page  ?? 1));
    const limit   = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

    const rows = await db
      .select({
        customerEmail: ordersTable.customerEmail,
        customerName:  sql<string>`max(customer_name)`,
        customerPhone: sql<string>`max(customer_phone)`,
        orderCount:    sql<number>`count(*)::int`,
        totalSpend:    sql<number>`coalesce(sum(total::numeric), 0)::float`,
        lastOrderAt:   sql<string>`max(created_at)::text`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.customerEmail)
      .orderBy(desc(sql`max(created_at)`));

    let filtered = rows.map((r) => ({
      ...r,
      segment: getSegment(r.orderCount, r.totalSpend),
    }));

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.customerEmail.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.customerPhone.toLowerCase().includes(q)
      );
    }

    if (segment !== "all") {
      filtered = filtered.filter((c) => c.segment === segment);
    }

    const total  = filtered.length;
    const paged  = filtered.slice((page - 1) * limit, page * limit);

    return res.json({ customers: paged, total, page, limit });
  } catch (err) {
    console.error("customers list error", err);
    return res.status(500).json({ error: "Failed to fetch customers" });
  }
});

/* ── Customer detail ── */
router.get("/admin/customers/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);

    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerEmail, email))
      .orderBy(desc(ordersTable.createdAt));

    if (!orders.length) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const totalSpend  = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const orderCount  = orders.length;
    const seg         = getSegment(orderCount, totalSpend);

    const notes = await db
      .select()
      .from(customerNotesTable)
      .where(eq(customerNotesTable.customerEmail, email))
      .orderBy(desc(customerNotesTable.createdAt));

    return res.json({
      customerEmail: email,
      customerName:  orders[0].customerName,
      customerPhone: orders[0].customerPhone,
      orderCount,
      totalSpend,
      lastOrderAt:   orders[0].createdAt.toISOString(),
      segment:       seg,
      orders:        orders.map((o) => ({
        ...o,
        total:        Number(o.total),
        subtotal:     Number(o.subtotal),
        shippingCost: Number(o.shippingCost),
        createdAt:    o.createdAt.toISOString(),
        updatedAt:    o.updatedAt.toISOString(),
      })),
      notes,
    });
  } catch (err) {
    console.error("customer detail error", err);
    return res.status(500).json({ error: "Failed to fetch customer" });
  }
});

/* ── Notes CRUD ── */
router.post("/admin/customers/:email/notes", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ error: "note is required" });

    const [created] = await db
      .insert(customerNotesTable)
      .values({ customerEmail: email, note: String(note).trim(), createdBy: "admin" })
      .returning();
    return res.json(created);
  } catch (err) {
    console.error("note create error", err);
    return res.status(500).json({ error: "Failed to add note" });
  }
});

router.patch("/admin/customers/:email/notes/:noteId", async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (isNaN(noteId)) return res.status(400).json({ error: "Invalid noteId" });
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ error: "note is required" });

    const [updated] = await db
      .update(customerNotesTable)
      .set({ note: String(note).trim() })
      .where(eq(customerNotesTable.id, noteId))
      .returning();
    if (!updated) return res.status(404).json({ error: "Note not found" });
    return res.json(updated);
  } catch (err) {
    console.error("note update error", err);
    return res.status(500).json({ error: "Failed to update note" });
  }
});

router.delete("/admin/customers/:email/notes/:noteId", async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (isNaN(noteId)) return res.status(400).json({ error: "Invalid noteId" });
    await db.delete(customerNotesTable).where(eq(customerNotesTable.id, noteId));
    return res.json({ ok: true });
  } catch (err) {
    console.error("note delete error", err);
    return res.status(500).json({ error: "Failed to delete note" });
  }
});

/* ── Leads ── */
const VALID_LEAD_STATUSES = ["new", "contacted", "converted"];

router.get("/admin/leads", async (_req, res) => {
  try {
    const all = await db.select().from(leads).orderBy(desc(leads.createdAt));
    return res.json(all);
  } catch (err) {
    console.error("leads list error", err);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

router.patch("/admin/leads/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const { status } = req.body;
    if (!VALID_LEAD_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_LEAD_STATUSES.join(", ")}` });
    }
    const [updated] = await db
      .update(leads)
      .set({ status: String(status) })
      .where(eq(leads.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Lead not found" });
    return res.json(updated);
  } catch (err) {
    console.error("lead update error", err);
    return res.status(500).json({ error: "Failed to update lead" });
  }
});

export default router;
