#!/bin/bash
# Run this ONCE on the VPS to fix "413 Request Entity Too Large" on image uploads.
# It adds client_max_body_size 20M to the nginx site config and reloads nginx.

set -e

NGINX_CONF="/etc/nginx/sites-available/sriswastudio"

if [ ! -f "$NGINX_CONF" ]; then
  echo "❌ Could not find $NGINX_CONF"
  echo "   Try: ls /etc/nginx/sites-available/ to find the correct config name."
  exit 1
fi

if grep -q "client_max_body_size" "$NGINX_CONF"; then
  echo "✅ client_max_body_size already set in $NGINX_CONF — updating to 20M..."
  sudo sed -i 's/client_max_body_size[^;]*;/client_max_body_size 20M;/g' "$NGINX_CONF"
else
  echo "➕ Adding client_max_body_size 20M to $NGINX_CONF..."
  # Insert after the first 'server_name' line inside the server block
  sudo sed -i '/server_name /a\\    client_max_body_size 20M;' "$NGINX_CONF"
fi

echo "🔍 Testing nginx config..."
sudo nginx -t

echo "🔁 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Done! Image uploads up to 20 MB are now allowed."
