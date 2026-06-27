import { db } from "./index";
import {
  categoriesTable, productsTable, productImagesTable,
  storeSettingsTable,
} from "./schema";

async function seed() {
  console.log("Seeding database…");

  // Store settings
  await db.insert(storeSettingsTable).values({
    storeName: "Sriswa Studio",
    adminWhatsapp: "",
    newOrderTemplate: "New order {{orderNumber}} from {{customerName}}. Total: ₹{{total}}. Phone: {{phone}}",
    statusUpdateTemplate: "Hi {{customerName}}, your order {{orderNumber}} is now {{status}}. Thank you for shopping at Sriswa Studio!",
  }).onConflictDoNothing();

  // Categories
  await db.insert(categoriesTable).values([
    { name: "Earrings", slug: "earrings", description: "Statement earrings that never tarnish" },
    { name: "Necklaces", slug: "necklaces", description: "Everyday necklaces and pendants" },
    { name: "Rings", slug: "rings", description: "Stackable and statement rings" },
    { name: "Bracelets", slug: "bracelets", description: "Dainty bracelets and bangles" },
    { name: "Anklets", slug: "anklets", description: "Delicate anklets for every occasion" },
    { name: "Sets", slug: "sets", description: "Coordinated jewellery sets" },
  ]).onConflictDoNothing();

  const allCats = await db.select().from(categoriesTable);
  const catMap = Object.fromEntries(allCats.map((c) => [c.slug, c]));
  const { earrings, necklaces, rings, bracelets, anklets, sets } = {
    earrings: catMap["earrings"],
    necklaces: catMap["necklaces"],
    rings: catMap["rings"],
    bracelets: catMap["bracelets"],
    anklets: catMap["anklets"],
    sets: catMap["sets"],
  };

  console.log("Categories seeded");

  // Products
  const productData = [
    {
      name: "Floral Stud Earrings",
      slug: "floral-stud-earrings",
      description: "Delicate flower-shaped studs with micro-pave detailing. Anti-tarnish plated, safe for sensitive skin.",
      price: "499",
      compareAtPrice: "799",
      categoryId: earrings.id,
      isFeatured: true,
      stockQuantity: 50,
      imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    },
    {
      name: "Gold Chain Necklace",
      slug: "gold-chain-necklace",
      description: "Minimalist 18-inch gold chain necklace. Everyday staple that goes with everything.",
      price: "799",
      compareAtPrice: "1199",
      categoryId: necklaces.id,
      isFeatured: true,
      stockQuantity: 35,
      imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    },
    {
      name: "Bar Pendant Necklace",
      slug: "bar-pendant-necklace",
      description: "Sleek horizontal bar pendant on a delicate chain. Perfect for layering.",
      price: "649",
      compareAtPrice: "999",
      categoryId: necklaces.id,
      isFeatured: true,
      stockQuantity: 40,
      imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80",
    },
    {
      name: "Twisted Band Ring",
      slug: "twisted-band-ring",
      description: "Elegant twisted gold band. Stacks beautifully with other rings.",
      price: "449",
      compareAtPrice: "699",
      categoryId: rings.id,
      isFeatured: true,
      stockQuantity: 60,
      imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80",
    },
    {
      name: "Dainty Bracelet",
      slug: "dainty-bracelet",
      description: "Thin adjustable bracelet with a tiny heart charm. Anti-tarnish coated.",
      price: "399",
      compareAtPrice: "599",
      categoryId: bracelets.id,
      isFeatured: true,
      stockQuantity: 45,
      imageUrl: "https://images.unsplash.com/photo-1573408301185-9519f94f48b2?w=600&q=80",
    },
    {
      name: "Hoop Earrings Classic",
      slug: "hoop-earrings-classic",
      description: "Classic medium-size hoops. Lightweight and comfortable for all-day wear.",
      price: "549",
      compareAtPrice: "849",
      categoryId: earrings.id,
      isFeatured: false,
      stockQuantity: 55,
      imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    },
    {
      name: "Ankle Chain",
      slug: "ankle-chain",
      description: "Delicate single-strand ankle chain with a subtle star charm. Adjustable length.",
      price: "349",
      compareAtPrice: "549",
      categoryId: anklets.id,
      isFeatured: false,
      stockQuantity: 30,
      imageUrl: "https://images.unsplash.com/photo-1573408301185-9519f94f48b2?w=600&q=80",
    },
    {
      name: "Necklace & Earring Set",
      slug: "necklace-earring-set",
      description: "Matching pendant necklace and drop earring set. Perfect gift idea.",
      price: "1299",
      compareAtPrice: "1999",
      categoryId: sets.id,
      isFeatured: true,
      stockQuantity: 20,
      imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    },
  ];

  for (const p of productData) {
    const { imageUrl, ...rest } = p;
    const rows = await db.insert(productsTable).values({
      ...rest,
      price: rest.price,
      compareAtPrice: rest.compareAtPrice ?? null,
      isActive: true,
      lowStockThreshold: 5,
    }).onConflictDoNothing().returning();

    if (rows.length > 0) {
      await db.insert(productImagesTable).values({
        productId: rows[0].id,
        url: imageUrl,
        isPrimary: true,
        displayOrder: 0,
      }).onConflictDoNothing();
    }
  }

  console.log("Products seeded");
  console.log("Database seeded successfully!");
}

seed().catch((e) => { console.error(e); process.exit(1); });
