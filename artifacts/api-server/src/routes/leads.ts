import { Router } from "express";
import { db } from "@workspace/db";
import { leads } from "@workspace/db/schema";

const router = Router();

router.post("/api/leads", async (req, res) => {
  try {
    const { name, mobile, product, qty, city, pin } = req.body;
    if (!name || !mobile) {
      res.status(400).json({ error: "name and mobile are required" });
      return;
    }
    const [lead] = await db.insert(leads).values({
      name: String(name),
      mobile: String(mobile),
      product: product ? String(product) : null,
      qty: qty ? String(qty) : null,
      city: city ? String(city) : null,
      pin: pin ? String(pin) : null,
    }).returning();
    res.json({ ok: true, lead });
  } catch (err) {
    console.error("leads insert error", err);
    res.status(500).json({ error: "Failed to save lead" });
  }
});

router.get("/api/leads", async (_req, res) => {
  try {
    const all = await db.select().from(leads).orderBy(leads.createdAt);
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

export default router;
