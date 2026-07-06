import { clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export interface CachedUser { email: string; role: string; expiresAt: number }

const memCache = new Map<string, CachedUser>();
const MEM_TTL_MS = 5 * 60 * 1000;
const DB_TTL_HOURS = 24;

const pendingLookups = new Map<string, Promise<CachedUser>>();

const dbReady: Promise<void> = db.execute(sql`
  CREATE TABLE IF NOT EXISTS _clerk_user_cache (
    user_id text PRIMARY KEY,
    email   text NOT NULL,
    role    text NOT NULL DEFAULT '',
    expires_at timestamptz NOT NULL
  )
`).then(() => {}).catch(() => {});

async function fetchFromDb(userId: string): Promise<CachedUser | null> {
  await dbReady;
  try {
    const res = await db.execute(
      sql`SELECT email, role FROM _clerk_user_cache WHERE user_id = ${userId} AND expires_at > NOW()`
    );
    if (res.rows.length > 0) {
      const row = res.rows[0] as { email: string; role: string };
      return { email: row.email, role: row.role, expiresAt: Date.now() + MEM_TTL_MS };
    }
  } catch {}
  return null;
}

async function storeInDb(userId: string, entry: CachedUser): Promise<void> {
  await dbReady;
  try {
    await db.execute(sql`
      INSERT INTO _clerk_user_cache (user_id, email, role, expires_at)
      VALUES (${userId}, ${entry.email}, ${entry.role}, NOW() + ${`${DB_TTL_HOURS} hours`}::interval)
      ON CONFLICT (user_id) DO UPDATE
        SET email = EXCLUDED.email, role = EXCLUDED.role, expires_at = EXCLUDED.expires_at
    `);
  } catch {}
}

export async function resolveUser(userId: string): Promise<CachedUser> {
  const now = Date.now();

  const mem = memCache.get(userId);
  if (mem && mem.expiresAt > now) return mem;

  if (pendingLookups.has(userId)) return pendingLookups.get(userId)!;

  const promise = (async (): Promise<CachedUser> => {
    const dbHit = await fetchFromDb(userId);
    if (dbHit) {
      memCache.set(userId, dbHit);
      return dbHit;
    }

    const user = await clerkClient.users.getUser(userId);
    const entry: CachedUser = {
      email: user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "",
      role: (user.publicMetadata as { role?: string })?.role ?? "",
      expiresAt: now + MEM_TTL_MS,
    };

    memCache.set(userId, entry);
    void storeInDb(userId, entry);
    return entry;
  })().finally(() => pendingLookups.delete(userId));

  pendingLookups.set(userId, promise);
  return promise;
}
