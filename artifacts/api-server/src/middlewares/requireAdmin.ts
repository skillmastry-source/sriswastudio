import type { RequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

// Accept both ADMIN_EMAILS and VITE_ADMIN_EMAILS so the VPS .env works
// regardless of which prefix was used when setting up the server.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.VITE_ADMIN_EMAILS ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

interface CachedUser { email: string; role: string; expiresAt: number }
const userCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function resolveUser(userId: string): Promise<CachedUser> {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > now) return cached;

  const user = await clerkClient.users.getUser(userId);
  const entry: CachedUser = {
    email: user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "",
    role: (user.publicMetadata as { role?: string })?.role ?? "",
    expiresAt: now + CACHE_TTL_MS,
  };
  userCache.set(userId, entry);
  return entry;
}

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
