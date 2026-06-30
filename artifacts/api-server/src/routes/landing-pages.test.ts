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

  it("public GET /landing-pages/nav does NOT include draft pages", async () => {
    // The draft page has isInNav=false by default; force it to true to make
    // it a candidate — but it is still a draft, so it must stay hidden.
    await db
      .update(landingPagesTable)
      .set({ isInNav: true })
      .where(eq(landingPagesTable.id, pageId));

    const res = await request(app).get("/api/landing-pages/nav");
    expect(res.status).toBe(200);
    const ids = (res.body as { id: number }[]).map((p) => p.id);
    expect(ids).not.toContain(pageId);
  });

  it("public GET /landing-pages returns isPublished on every entry so the frontend can filter correctly", async () => {
    const res = await request(app).get("/api/landing-pages");
    expect(res.status).toBe(200);
    const pages = res.body as Record<string, unknown>[];
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      expect(page).toHaveProperty("isPublished");
    }
    // The draft we inserted must appear in the list with isPublished=false.
    const draft = pages.find((p) => p.id === pageId);
    expect(draft).toBeDefined();
    expect(draft!.isPublished).toBe(false);
  });
});

// ── Helper: compute nav position map the same way MyPagesList does ──────────
function computeNavPositions(
  pages: { id: number; isInNav: boolean; sortOrder: number }[],
): Map<number, number> {
  const sorted = [...pages].sort((a, b) => a.sortOrder - b.sortOrder);
  const map = new Map<number, number>();
  let counter = 0;
  for (const p of sorted) {
    if (p.isInNav) {
      counter += 1;
      map.set(p.id, counter);
    }
  }
  return map;
}

describe("Nav position renumbering after unpublish", () => {
  let app: ReturnType<typeof buildApp>;
  const createdIds: number[] = [];
  const ts = Date.now();

  beforeEach(async () => {
    mockRequireAdmin.mockImplementation((_req, _res, next) => next());
    app = buildApp();
  });

  afterEach(async () => {
    for (const id of createdIds) {
      await db.delete(landingPagesTable).where(eq(landingPagesTable.id, id));
    }
    createdIds.length = 0;
    vi.clearAllMocks();
  });

  it("unpublishing a nav page clears isInNav in the server response", async () => {
    const [page] = await db
      .insert(landingPagesTable)
      .values({ title: "Nav Page", slug: `nav-unp-single-${ts}`, sections: [], isPublished: true, isInNav: true, sortOrder: 0 })
      .returning();
    createdIds.push(page.id);

    const res = await request(app)
      .patch(`/api/admin/landing-pages/${page.id}`)
      .send({ isPublished: false });

    expect(res.status).toBe(200);
    expect(res.body.isPublished).toBe(false);
    expect(res.body.isInNav).toBe(false);
  });

  it("GET /landing-pages reflects isInNav=false for an unpublished page", async () => {
    const [page] = await db
      .insert(landingPagesTable)
      .values({ title: "Nav Page 2", slug: `nav-unp-list-${ts}`, sections: [], isPublished: true, isInNav: true, sortOrder: 0 })
      .returning();
    createdIds.push(page.id);

    await request(app)
      .patch(`/api/admin/landing-pages/${page.id}`)
      .send({ isPublished: false });

    const listRes = await request(app).get("/api/landing-pages");
    expect(listRes.status).toBe(200);
    const entry = (listRes.body as { id: number; isInNav: boolean }[]).find((p) => p.id === page.id);
    expect(entry).toBeDefined();
    expect(entry!.isInNav).toBe(false);
  });

  it("remaining nav pages renumber with no gaps after the middle page is unpublished", async () => {
    const rows = await db
      .insert(landingPagesTable)
      .values([
        { title: "Nav A", slug: `nav-pos-a-${ts}`, sections: [], isPublished: true, isInNav: true, sortOrder: 0 },
        { title: "Nav B", slug: `nav-pos-b-${ts}`, sections: [], isPublished: true, isInNav: true, sortOrder: 1 },
        { title: "Nav C", slug: `nav-pos-c-${ts}`, sections: [], isPublished: true, isInNav: true, sortOrder: 2 },
      ])
      .returning();
    for (const r of rows) createdIds.push(r.id);
    const [pageA, pageB, pageC] = rows;

    const listBefore = await request(app).get("/api/landing-pages");
    const beforeAll = (listBefore.body as { id: number; isInNav: boolean; sortOrder: number }[])
      .filter((p) => createdIds.includes(p.id));
    const posBefore = computeNavPositions(beforeAll);
    expect(posBefore.get(pageA.id)).toBe(1);
    expect(posBefore.get(pageB.id)).toBe(2);
    expect(posBefore.get(pageC.id)).toBe(3);

    await request(app)
      .patch(`/api/admin/landing-pages/${pageB.id}`)
      .send({ isPublished: false });

    const listAfter = await request(app).get("/api/landing-pages");
    const afterAll = (listAfter.body as { id: number; isInNav: boolean; sortOrder: number }[])
      .filter((p) => createdIds.includes(p.id));
    const posAfter = computeNavPositions(afterAll);

    expect(posAfter.get(pageB.id)).toBeUndefined();
    expect(posAfter.get(pageA.id)).toBe(1);
    expect(posAfter.get(pageC.id)).toBe(2);

    const positions = [...posAfter.values()].sort((a, b) => a - b);
    expect(positions).toEqual([1, 2]);
  });

  it("GET /landing-pages/nav does not include the unpublished page", async () => {
    const [page] = await db
      .insert(landingPagesTable)
      .values({ title: "Nav D", slug: `nav-pos-d-${ts}`, sections: [], isPublished: true, isInNav: true, sortOrder: 0 })
      .returning();
    createdIds.push(page.id);

    await request(app)
      .patch(`/api/admin/landing-pages/${page.id}`)
      .send({ isPublished: false });

    const navRes = await request(app).get("/api/landing-pages/nav");
    expect(navRes.status).toBe(200);
    const navIds = (navRes.body as { id: number }[]).map((p) => p.id);
    expect(navIds).not.toContain(page.id);
  });
});
