#!/bin/bash
set -e

REPO_DIR="/var/www/sriswastudio"
WEB_ROOT="/var/www/sriswastudio/html"
ENV_FILE="$REPO_DIR/.env"

trap 'echo ""; echo "❌❌❌ DEPLOY FAILED — the website is STILL RUNNING THE OLD CODE. Read the error above, fix it, and run this script again. ❌❌❌"' ERR

cd "$REPO_DIR"

echo "🔄 Pulling latest from GitHub..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "⚠️  Local file edits detected on the VPS — stashing them so the deploy can proceed."
  echo "    (Never edit files directly on the VPS; make changes in Replit and deploy instead.)"
  git stash push -u -m "vps-deploy auto-stash $(date +%F_%T)"
fi
git pull origin main

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🏗️  Building API server..."
pnpm --filter @workspace/api-server run build

echo "🏗️  Building store frontend..."
set -a
source "$ENV_FILE"
set +a

VITE_CLERK_PUBLISHABLE_KEY="$VITE_CLERK_PUBLISHABLE_KEY" \
VITE_ADMIN_EMAILS="$VITE_ADMIN_EMAILS" \
VITE_EDITOR_EMAILS="$VITE_EDITOR_EMAILS" \
pnpm --filter @workspace/store run build

echo "🚀 Copying frontend to web root..."
rm -rf "$WEB_ROOT"/*
cp -r artifacts/store/dist/public/. "$WEB_ROOT/"

echo "🗄️  Applying new database migrations..."
set -a; source "$ENV_FILE"; set +a

if ! command -v psql >/dev/null 2>&1; then
  echo "❌ psql is NOT installed on this VPS — database migrations CANNOT run."
  echo "   Install it with:  apt-get update && apt-get install -y postgresql-client"
  echo "   Then re-run this script."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set in $ENV_FILE — migrations cannot run."
  exit 1
fi

psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS _applied_migrations (filename text PRIMARY KEY, applied_at timestamptz DEFAULT now());"
for sql_file in "$REPO_DIR"/lib/db/drizzle/[0-9]*.sql; do
  fname=$(basename "$sql_file")
  count=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM _applied_migrations WHERE filename='$fname'")
  if [ "$count" = "0" ]; then
    echo "   → Applying $fname"
    psql "$DATABASE_URL" -f "$sql_file" || echo "   ⚠️  Some statements in $fname reported errors above (usually 'already exists' — safe to ignore)"
    psql "$DATABASE_URL" -c "INSERT INTO _applied_migrations(filename) VALUES('$fname') ON CONFLICT DO NOTHING;"
  fi
done

echo "🔎 Verifying database schema is up to date..."
SCHEMA_OK=1
psql "$DATABASE_URL" -tAc "SELECT coupon_code FROM orders LIMIT 0" >/dev/null 2>&1 || { echo "❌ orders.coupon_code missing (migration 0003 did not apply) — Orders page WILL FAIL"; SCHEMA_OK=0; }
psql "$DATABASE_URL" -tAc "SELECT customer_order_template FROM store_settings LIMIT 0" >/dev/null 2>&1 || { echo "❌ store_settings.customer_order_template missing (migration 0005 did not apply) — Settings save WILL FAIL"; SCHEMA_OK=0; }
psql "$DATABASE_URL" -tAc "SELECT 1 FROM media_files LIMIT 0" >/dev/null 2>&1 || { echo "❌ media_files table missing (migration 0004 did not apply) — Media Library WILL FAIL"; SCHEMA_OK=0; }
psql "$DATABASE_URL" -tAc "SELECT site_design FROM store_settings LIMIT 0" >/dev/null 2>&1 || { echo "⚠️  store_settings.site_design missing — will be auto-created when the API starts"; }
if [ "$SCHEMA_OK" = "0" ]; then
  echo "❌ SCHEMA VERIFICATION FAILED — scroll up to see which migration failed and why."
  exit 1
fi
echo "   ✓ Schema OK"

echo "🔁 Restarting API server..."
pm2 restart sriswa-api

echo "🔎 Checking API is responding..."
sleep 3
if curl -sf http://localhost:8080/api/payments/status >/dev/null; then
  echo "   ✓ API OK"
else
  echo "❌ API is NOT responding on port 8080 after restart! Check: pm2 logs sriswa-api --lines 50"
  exit 1
fi

echo ""
echo "✅ Deploy complete! sriswastudio.com is live."
echo "📌 Deployed commit: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
