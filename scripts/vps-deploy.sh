#!/bin/bash
set -e

REPO_DIR="/var/www/sriswastudio"
WEB_ROOT="/var/www/sriswastudio/html"
ENV_FILE="$REPO_DIR/.env"

cd "$REPO_DIR"

echo "🔄 Pulling latest from GitHub..."
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
psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS _applied_migrations (filename text PRIMARY KEY, applied_at timestamptz DEFAULT now());" 2>/dev/null || true
for sql_file in "$REPO_DIR"/lib/db/drizzle/[0-9]*.sql; do
  fname=$(basename "$sql_file")
  count=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM _applied_migrations WHERE filename='$fname'" 2>/dev/null || echo "0")
  if [ "$count" = "0" ]; then
    echo "   → Applying $fname"
    if psql "$DATABASE_URL" -f "$sql_file" 2>/dev/null; then
      psql "$DATABASE_URL" -c "INSERT INTO _applied_migrations(filename) VALUES('$fname');" 2>/dev/null || true
    fi
  fi
done

echo "🔁 Restarting API server..."
pm2 restart sriswa-api

echo ""
echo "✅ Deploy complete! sriswastudio.com is live."
