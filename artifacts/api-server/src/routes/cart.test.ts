import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import cartRouter from "./cart.js";
import { db, productsTable, cartItemsTable, productVariantsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", cartRouter);
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    },
  );
  return app;
}

const SESSION = `test-cart-stock-${Date.now()}`;

describe("POST /api/cart/items — stock enforcement", () => {
  let app: ReturnType<typeof buildApp>;
  let productId: number;
  let variantAId: number;
  let variantBId: number;

  beforeEach(async () => {
    app = buildApp();

    // Insert a product with stock = 5
    const [product] = await db
      .insert(productsTable)
      .values({
        name: "Stock Test Product",
        slug: `stock-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        price: "100",
        stockQuantity: 5,
        isActive: true,
      })
      .returning();
    productId = product.id;

    // Insert two variants
    const [vA] = await db
      .insert(productVariantsTable)
      .values({ productId, name: "Color", value: "Red", priceModifier: "0" })
      .returning();
    variantAId = vA.id;

    const [vB] = await db
      .insert(productVariantsTable)
      .values({ productId, name: "Color", value: "Blue", priceModifier: "0" })
      .returning();
    variantBId = vB.id;
  });

  afterEach(async () => {
    // Clean up in reverse-dependency order
    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, SESSION));
    await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, productId));
    await db.delete(productsTable).where(eq(productsTable.id, productId));
  });

  it("adds quantity up to the product stock limit for a new cart line", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .send({ sessionId: SESSION, productId, quantity: 10 }); // request 10, stock is 5

    expect(res.status).toBe(200);
    const item = res.body.items.find((i: { productId: number }) => i.productId === productId);
    expect(item).toBeDefined();
    expect(item.quantity).toBe(5); // clamped to stock
  });

  it("returns 400 when product stock is already fully in cart", async () => {
    // Fill the cart to the stock limit
    await db.insert(cartItemsTable).values({
      sessionId: SESSION,
      productId,
      quantity: 5,
      variantId: null,
    });

    const res = await request(app)
      .post("/api/cart/items")
      .send({ sessionId: SESSION, productId, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/out of stock/i);
  });

  it("caps increment so existing + new cannot exceed stock", async () => {
    // Pre-load 3 of 5 into cart
    await db.insert(cartItemsTable).values({
      sessionId: SESSION,
      productId,
      variantId: null,
      quantity: 3,
    });

    const res = await request(app)
      .post("/api/cart/items")
      .send({ sessionId: SESSION, productId, quantity: 5 }); // wants 5 more but only 2 remain

    expect(res.status).toBe(200);
    const item = res.body.items.find((i: { productId: number }) => i.productId === productId);
    expect(item.quantity).toBe(5); // 3 existing + 2 added = 5 (stock limit)
  });

  it("enforces aggregate stock across two different variants of the same product", async () => {
    // Add variant A first (3 units — leaves 2 remaining)
    const resA = await request(app)
      .post("/api/cart/items")
      .send({ sessionId: SESSION, productId, quantity: 3, variantId: variantAId });
    expect(resA.status).toBe(200);

    // Now add variant B — only 2 slots remain, but we request 5
    const resB = await request(app)
      .post("/api/cart/items")
      .send({ sessionId: SESSION, productId, quantity: 5, variantId: variantBId });
    expect(resB.status).toBe(200);

    const totalQty = resB.body.items
      .filter((i: { productId: number }) => i.productId === productId)
      .reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);

    // Combined quantity across both variants must not exceed stock (5)
    expect(totalQty).toBe(5);
  });

  it("returns 400 when variant B tries to add to a cart already at product stock limit", async () => {
    // Fill all 5 units with variant A
    await db.insert(cartItemsTable).values({
      sessionId: SESSION,
      productId,
      variantId: variantAId,
      quantity: 5,
    });

    // Attempt to add variant B — no capacity left
    const res = await request(app)
      .post("/api/cart/items")
      .send({ sessionId: SESSION, productId, quantity: 1, variantId: variantBId });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/out of stock/i);
  });

  it("rejects adding any quantity when the product itself has zero stock", async () => {
    await db.update(productsTable).set({ stockQuantity: 0 }).where(eq(productsTable.id, productId));

    const res = await request(app)
      .post("/api/cart/items")
      .send({ sessionId: SESSION, productId, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/out of stock/i);
  });

  it("concurrent adds for the same product never exceed stock in aggregate", async () => {
    // Fire two parallel requests, each asking for stock (5) units.
    // The FOR UPDATE lock on the product row serialises them; the second
    // should only be able to add whatever remains after the first commits.
    const [resA, resB] = await Promise.all([
      request(app)
        .post("/api/cart/items")
        .send({ sessionId: SESSION, productId, quantity: 5, variantId: variantAId }),
      request(app)
        .post("/api/cart/items")
        .send({ sessionId: SESSION, productId, quantity: 5, variantId: variantBId }),
    ]);

    // At least one must have succeeded
    const successes = [resA, resB].filter((r) => r.status === 200);
    expect(successes.length).toBeGreaterThan(0);

    // Final aggregate must not exceed product stock
    const finalCart = await request(app).get(`/api/cart?sessionId=${SESSION}`);
    const totalQty = finalCart.body.items
      .filter((i: { productId: number }) => i.productId === productId)
      .reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);

    expect(totalQty).toBeLessThanOrEqual(5);
  });
});
