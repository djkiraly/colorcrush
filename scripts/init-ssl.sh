#!/bin/bash
# First-time SSL certificate setup with Let's Encrypt
# Usage: ./scripts/init-ssl.sh yourdomain.com your@email.com

set -e

DOMAIN=${1:?Usage: ./scripts/init-ssl.sh <domain> <email>}
EMAIL=${2:?Usage: ./scripts/init-ssl.sh <domain> <email>}
CONF_DIR="$(cd "$(dirname "$0")/../nginx/conf.d" && pwd)"

echo "==> Swapping to HTTP-only nginx config for ACME challenge"
cp "$CONF_DIR/default.conf.template" "$CONF_DIR/default.conf.template.ssl-backup"
cp "$CONF_DIR/default.conf.nossl" "$CONF_DIR/default.conf.template"

echo "==> Starting nginx (HTTP only)"
docker compose -f docker-compose.prod.yml up -d nginx app

echo "==> Requesting SSL certificate for $DOMAIN"
docker compose -f docker-compose.prod.yml run --rm certbot \
  certbot certonly --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email

echo "==> Restoring HTTPS nginx config"
cp "$CONF_DIR/default.conf.template.ssl-backup" "$CONF_DIR/default.conf.template"
rm "$CONF_DIR/default.conf.template.ssl-backup"

echo "==> Restarting full stack with SSL"
docker compose -f docker-compose.prod.yml up -d

echo "==> Done. Site is live at https://$DOMAIN"
