import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { resolveUser } from "../lib/clerkUserCache";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.VITE_ADMIN_EMAILS ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  const userId = auth.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (ADMIN_USER_IDS.length > 0 && ADMIN_USER_IDS.includes(userId)) {
    next();
    return;
  }

  try {
    const user = await resolveUser(userId);

    if (ADMIN_EMAILS.length > 0) {
      if (!ADMIN_EMAILS.includes(user.email)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
      return;
    }

    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(403).json({ error: "Forbidden" });
  }
};
