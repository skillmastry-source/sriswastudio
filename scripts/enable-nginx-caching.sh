#!/bin/bash
# Run this ONCE on the VPS to enable browser caching + gzip compression.
# - Static assets (JS/CSS/fonts/images in the web root) cached for 30 days
# - Gzip compression for text-based files (HTML/JS/CSS) — big mobile speed win
# It writes a snippet file and includes it in the nginx site config, then reloads nginx.

set -e

NGINX_CONF="/etc/nginx/sites-available/sriswastudio"
SNIPPET="/etc/nginx/snippets/sriswa-cache.conf"

if [ ! -f "$NGINX_CONF" ]; then
  echo "❌ Could not find $NGINX_CONF"
  echo "   Try: ls /etc/nginx/sites-available/ to find the correct config name."
  exit 1
fi

echo "📝 Writing cache/gzip snippet to $SNIPPET..."
sudo mkdir -p /etc/nginx/snippets
sudo tee "$SNIPPET" > /dev/null <<'EOF'
# --- Sriswa Studio: browser caching + gzip (added by enable-nginx-caching.sh) ---

# Gzip compression for text assets
gzip on;
gzip_comp_level 6;
gzip_min_length 1024;
gzip_vary on;
gzip_proxied any;
gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss image/svg+xml;

# Long-lived caching for static assets served from the web root.
# The negative lookahead (?!api/) makes sure /api/... requests still go to the API,
# because nginx regex locations would otherwise take priority over the /api proxy.
location ~* ^/(?!api/).+\.(js|css|woff2?|ttf|otf|svg|ico|png|jpe?g|webp|avif|gif)$ {
  expires 30d;
  add_header Cache-Control "public, max-age=2592000, immutable";
  try_files $uri =404;
}

# index.html must NEVER be cached long-term — it points to the latest JS/CSS.
location = /index.html {
  add_header Cache-Control "no-cache";
  try_files $uri =404;
}
EOF

if grep -q "sriswa-cache.conf" "$NGINX_CONF"; then
  echo "✅ Snippet already included in $NGINX_CONF"
else
  echo "➕ Including snippet in $NGINX_CONF..."
  sudo sed -i '/server_name /a\    include snippets/sriswa-cache.conf;' "$NGINX_CONF"
fi

echo "🔍 Testing nginx config..."
sudo nginx -t

echo "🔁 Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Done! Browser caching + gzip compression are now active."
echo "   Repeat visitors will load the site dramatically faster."
