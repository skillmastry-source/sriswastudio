import type { RequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const EDITOR_EMAILS = (process.env.EDITOR_EMAILS ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const requireEditor: RequestHandler = async (req, res, next) => {
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
    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";

    const allAllowed = [...ADMIN_EMAILS, ...EDITOR_EMAILS];
    if (allAllowed.length > 0) {
      if (!allAllowed.includes(userEmail)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
      return;
    }

    const role = (user.publicMetadata as { role?: string })?.role;
    if (role !== "admin" && role !== "editor") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(403).json({ error: "Forbidden" });
  }
};
