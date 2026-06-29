import { Router } from "express";
import { db } from "@workspace/db";
import { couponsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

function calcDiscount(type: string, value: number, orderTotal: number): number {
  if (type === "percent") return Math.round((orderTotal * value) / 100 * 100) / 100;
  if (type === "flat") return Math.min(value, orderTotal);
  if (type === "free-shipping") return 0; // shipping is always free for now; handled as label
  return 0;
}

function serializeCoupon(c: typeof couponsTable.$inferSelect) {
  return {
    ...c,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : 0,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  };
}

// ── Public: validate coupon ───────────────────────────────────────────────────
router.post("/coupons/validate", async (req, res) => {
  const { code, orderTotal } = req.body as { code?: string; orderTotal?: number };
  if (!code || typeof orderTotal !== "number") {
    return res.status(400).json({ error: "code and orderTotal are required" });
  }

  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(eq(couponsTable.code, code.toUpperCase().trim()));

  if (!coupon) return res.status(404).json({ error: "Invalid coupon code" });
  if (!coupon.isActive) return res.status(400).json({ error: "This coupon is no longer active" });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return res.status(400).json({ error: "This coupon has expired" });
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return res.status(400).json({ error: "This coupon has reached its usage limit" });
  }
  const minOrder = Number(coupon.minOrderAmount ?? 0);
  if (orderTotal < minOrder) {
    return res.status(400).json({
      error: `Minimum order amount of ₹${minOrder} required for this coupon`,
    });
  }

  const discount = calcDiscount(coupon.type, Number(coupon.value), orderTotal);

  return res.json({
    valid: true,
    discount,
    type: coupon.type,
    value: Number(coupon.value),
    code: coupon.code,
  });
});

// ── Admin: list coupons ───────────────────────────────────────────────────────
router.get("/admin/coupons", requireAdmin, async (_req, res) => {
  const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
  return res.json(coupons.map(serializeCoupon));
});

// ── Admin: create coupon ──────────────────────────────────────────────────────
router.post("/admin/coupons", requireAdmin, async (req, res) => {
  const { code, type, value, minOrderAmount, maxUses, expiresAt, isActive } = req.body as {
    code?: string;
    type?: string;
    value?: number;
    minOrderAmount?: number;
    maxUses?: number | null;
    expiresAt?: string | null;
    isActive?: boolean;
  };

  if (!code || !type || value === undefined) {
    return res.status(400).json({ error: "code, type, and value are required" });
  }
  const validTypes = ["percent", "flat", "free-shipping"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "type must be percent, flat, or free-shipping" });
  }
  if (type === "percent" && (value < 0 || value > 100)) {
    return res.status(400).json({ error: "Percentage value must be between 0 and 100" });
  }

  const [coupon] = await db
    .insert(couponsTable)
    .values({
      code: code.toUpperCase().trim(),
      type,
      value: String(value),
      minOrderAmount: minOrderAmount !== undefined ? String(minOrderAmount) : "0",
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== false,
    })
    .returning();

  return res.status(201).json(serializeCoupon(coupon));
});

// ── Admin: update coupon ──────────────────────────────────────────────────────
router.patch("/admin/coupons/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { code, type, value, minOrderAmount, maxUses, expiresAt, isActive } = req.body as {
    code?: string;
    type?: string;
    value?: number;
    minOrderAmount?: number;
    maxUses?: number | null;
    expiresAt?: string | null;
    isActive?: boolean;
  };

  const updates: Partial<typeof couponsTable.$inferInsert> = {};
  if (code !== undefined) updates.code = code.toUpperCase().trim();
  if (type !== undefined) updates.type = type;
  if (value !== undefined) updates.value = String(value);
  if (minOrderAmount !== undefined) updates.minOrderAmount = String(minOrderAmount);
  if (maxUses !== undefined) updates.maxUses = maxUses;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (isActive !== undefined) updates.isActive = isActive;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const [coupon] = await db
    .update(couponsTable)
    .set(updates)
    .where(eq(couponsTable.id, id))
    .returning();

  if (!coupon) return res.status(404).json({ error: "Coupon not found" });
  return res.json(serializeCoupon(coupon));
});

// ── Admin: delete coupon ──────────────────────────────────────────────────────
router.delete("/admin/coupons/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [coupon] = await db.delete(couponsTable).where(eq(couponsTable.id, id)).returning();
  if (!coupon) return res.status(404).json({ error: "Coupon not found" });
  return res.json({ success: true });
});

export default router;
