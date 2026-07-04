#!/bin/bash
set -e
VPS_DIR="/var/www/sriswastudio"
BASE_URL="$1"

echo "=== Downloading updated files ==="
cd $VPS_DIR

# Download and extract new frontend dist
wget -q "$BASE_URL/store-dist.tar.gz" -O /tmp/store-dist.tar.gz
rm -rf artifacts/store/dist
tar xzf /tmp/store-dist.tar.gz -C artifacts/store/
echo "✓ Frontend dist updated"

# Download updated API routes
wget -q "$BASE_URL/vps-admin.ts" -O artifacts/api-server/src/routes/admin.ts
wget -q "$BASE_URL/vps-payments.ts" -O artifacts/api-server/src/routes/payments.ts
echo "✓ API routes updated"

# Reload nginx
systemctl reload nginx
echo "✓ Nginx reloaded"

# Restart API server
systemctl restart sriswa-api 2>/dev/null || pm2 restart all 2>/dev/null || echo "(restart API manually if needed)"
echo "=== Done! Hard refresh sriswastudio.com/admin/settings ==="
