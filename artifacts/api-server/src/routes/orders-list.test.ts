import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { RequestHandler } from "express";

const mockRequireAdmin = vi.fn<RequestHandler>();

vi.mock("../middlewares/requireAdmin.js", () => ({
  requireAdmin: (...args: Parameters<RequestHandler>) =>
    mockRequireAdmin(...args),
}));

import request from "supertest";
import express from "express";
import ordersRouter from "./orders.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", ordersRouter);
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(500).json({ error: "Internal server error" });
    },
  );
  return app;
}

describe("GET /api/orders query param handling", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    mockRequireAdmin.mockImplementation((_req, _res, next) => next());
    app = buildApp();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 when dateFrom/dateTo are the literal string 'null'", async () => {
    const res = await request(app).get("/api/orders?dateFrom=null&dateTo=null&limit=5");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it("returns 200 when status is the literal string 'null'", async () => {
    const res = await request(app).get("/api/orders?status=null&limit=5");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it("returns 200 with garbage date input", async () => {
    const res = await request(app).get("/api/orders?dateFrom=not-a-date&limit=5");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it("returns 200 with no filters", async () => {
    const res = await request(app).get("/api/orders?limit=5");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(typeof res.body.total).toBe("number");
  });
});
