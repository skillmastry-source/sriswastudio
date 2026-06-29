import type { RequestHandler } from "express";
import { clerkClient } from "@clerk/express";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const auth = (req as unknown as { auth?: { userId?: string } }).auth;
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (ADMIN_USER_IDS.length > 0 && ADMIN_USER_IDS.includes(auth.userId)) {
    next();
    return;
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);

    if (ADMIN_EMAILS.length > 0) {
      const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
      if (!ADMIN_EMAILS.includes(userEmail)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
      return;
    }

    const role = (user.publicMetadata as { role?: string })?.role;
    if (role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(403).json({ error: "Forbidden" });
  }
};
