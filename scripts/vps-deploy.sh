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

echo "🗄️  Applying database migrations..."
set -a; source "$ENV_FILE"; set +a
for sql_file in "$REPO_DIR"/lib/db/drizzle/*.sql; do
  psql "$DATABASE_URL" -f "$sql_file" 2>/dev/null || true
done

echo "🔁 Restarting API server..."
pm2 restart sriswa-api

echo ""
echo "✅ Deploy complete! sriswastudio.com is live."
