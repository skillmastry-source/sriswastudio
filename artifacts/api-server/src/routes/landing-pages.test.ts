import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { RequestHandler } from "express";

// vi.mock is hoisted — this runs before any real module imports.
// We proxy through a vi.fn() so each test can swap behaviour.
const mockRequireAdmin = vi.fn<Parameters<RequestHandler>>();

vi.mock("../middlewares/requireAdmin.js", () => ({
  requireAdmin: (...args: Parameters<RequestHandler>) =>
    mockRequireAdmin(...(args as Parameters<RequestHandler>)),
}));

import request from "supertest";
import express from "express";
import landingPagesRouter from "./landing-pages.js";
import { db, landingPagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const TEST_SLUG = `test-draft-visibility-${Date.now()}`;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", landingPagesRouter);
  return app;
}

describe("Landing page draft visibility", () => {
  let app: ReturnType<typeof buildApp>;
  let pageId: number;

  beforeEach(async () => {
    // Grant admin access by default for admin-route tests.
    mockRequireAdmin.mockImplementation((_req, _res, next) => next());
    app = buildApp();

    // Insert a fresh draft page for every test.
    const [page] = await db
      .insert(landingPagesTable)
      .values({
        title: "Test Draft Page",
        slug: TEST_SLUG,
        sections: [],
        isPublished: false,
        isInNav: false,
      })
      .returning();
    pageId = page.id;
  });

  afterEach(async () => {
    // Clean up the test row regardless of published state.
    await db
      .delete(landingPagesTable)
      .where(eq(landingPagesTable.id, pageId));
    vi.clearAllMocks();
  });

  it("public GET /landing-pages/:slug returns 404 for a draft page", async () => {
    const res = await request(app).get(`/api/landing-pages/${TEST_SLUG}`);
    expect(res.status).toBe(404);
  });

  it("public GET /landing-pages/:slug returns 200 after the page is published", async () => {
    // Publish the page directly in the DB.
    await db
      .update(landingPagesTable)
      .set({ isPublished: true })
      .where(eq(landingPagesTable.id, pageId));

    const res = await request(app).get(`/api/landing-pages/${TEST_SLUG}`);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(TEST_SLUG);
    expect(res.body.isPublished).toBe(true);
  });

  it("admin GET /admin/landing-pages/:id returns the draft for an authenticated admin", async () => {
    const res = await request(app).get(`/api/admin/landing-pages/${pageId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(pageId);
    expect(res.body.isPublished).toBe(false);
  });

  it("admin GET /admin/landing-pages/slug/:slug returns the draft for preview mode", async () => {
    const res = await request(app).get(
      `/api/admin/landing-pages/slug/${TEST_SLUG}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(TEST_SLUG);
    expect(res.body.isPublished).toBe(false);
  });

  it("admin route returns 401 when the request is unauthenticated", async () => {
    mockRequireAdmin.mockImplementation((_req, res) => {
      res.status(401).json({ error: "Unauthorized" });
    });

    const res = await request(app).get(`/api/admin/landing-pages/${pageId}`);
    expect(res.status).toBe(401);
  });
});
