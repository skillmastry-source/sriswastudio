import type { RequestHandler } from "express";

export const requireAdmin: RequestHandler = (req, res, next) => {
  const auth = (req as unknown as { auth?: { userId?: string } }).auth;
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};
