import { Router } from "express";
import { db } from "@workspace/db";
import { storeSettingsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

export const DEFAULT_SITE_DESIGN = {
  header: {
    logoSize: 48,
    announcementText: "✦ Anti-Tarnish  |  Waterproof  |  Skin-Friendly  |  Free Shipping above ₹999",
    announcementBgColor: "#9B0F5F",
    showAnnouncement: true,
  },
  hero: {
    badge: "New Arrivals · 2025",
    title: "Jewellery That",
    titleGold: "Lasts Forever",
    subtitle: "Anti-tarnish · Waterproof · Skin-friendly · Starting ₹399",
    shopButtonText: "Shop Now",
    viewAllText: "View All →",
  },
  colors: {
    brand: "#9B0F5F",
    gold: "#D4AF37",
    dark: "#1a0a0f",
  },
  usp: [
    { text: "Anti-Tarnish" },
    { text: "Waterproof" },
    { text: "Skin-Friendly" },
    { text: "Free Shipping ₹999+" },
  ],
  collection: {
    label: "Shop All Jewellery",
    title: "Our Collection",
  },
  tabs: {
    newArrivalsLabel: "New Arrivals",
    bestSellersLabel: "Best Sellers",
    shopAllText: "Shop All →",
  },
  testimonials: [
    { name: "Priya S.", city: "Mumbai", rating: 5, text: "I've been wearing my anklet for 3 months, even in the shower — not a single tarnish! Absolutely love it." },
    { name: "Riya M.", city: "Bangalore", rating: 5, text: "The necklace looks so premium and it's so affordable. Sriswa Studio is my go-to now!" },
    { name: "Ananya K.", city: "Chennai", rating: 5, text: "Super fast delivery and beautiful packaging. The earrings are lightweight and perfect for sensitive ears!" },
    { name: "Divya R.", city: "Hyderabad", rating: 5, text: "Was skeptical at first but the quality is amazing. 100% worth every rupee!" },
  ],
  footer: {
    logoSize: 60,
    tagline: "Timeless Beauty, Everyday Shine.\nPremium anti-tarnish jewellery\ncrafted for the modern woman.",
    instagramUrl: "https://instagram.com/sriswastudio",
    facebookUrl: "https://facebook.com/sriswastudio",
  },
};

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  if (!override || typeof override !== "object") return base;
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const bVal = base[key];
    const oVal = override[key];
    if (
      oVal !== null &&
      typeof oVal === "object" &&
      !Array.isArray(oVal) &&
      typeof bVal === "object" &&
      bVal !== null &&
      !Array.isArray(bVal)
    ) {
      result[key] = deepMerge(bVal as Record<string, unknown>, oVal as Record<string, unknown>);
    } else {
      result[key] = oVal;
    }
  }
  return result;
}

async function ensureColumn() {
  try {
    await db.execute(sql`ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS site_design jsonb DEFAULT '{}'::jsonb`);
  } catch {
    // column may already exist — ignore
  }
}

ensureColumn();

router.get("/site-design", async (_req, res) => {
  try {
    let [settings] = await db.select().from(storeSettingsTable);
    if (!settings) {
      [settings] = await db.insert(storeSettingsTable).values({}).returning();
    }
    const stored = (settings.siteDesign ?? {}) as Record<string, unknown>;
    return res.json(deepMerge(DEFAULT_SITE_DESIGN as unknown as Record<string, unknown>, stored));
  } catch {
    return res.json(DEFAULT_SITE_DESIGN);
  }
});

router.patch("/admin/site-design", requireAdmin, async (req, res) => {
  try {
    let [settings] = await db.select().from(storeSettingsTable);
    if (!settings) {
      [settings] = await db.insert(storeSettingsTable).values({}).returning();
    }
    const existing = (settings.siteDesign ?? {}) as Record<string, unknown>;
    const merged = deepMerge(deepMerge(DEFAULT_SITE_DESIGN as unknown as Record<string, unknown>, existing), req.body as Record<string, unknown>);
    await db.update(storeSettingsTable).set({ siteDesign: merged }).where(eq(storeSettingsTable.id, settings.id));
    return res.json(merged);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to save design settings" });
  }
});

export default router;
