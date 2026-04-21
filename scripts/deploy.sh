#!/usr/bin/env bash
# Production deploy script for Color Crush.
# Run from the project root on the production host:
#   ./scripts/deploy.sh
# Idempotent and safe to re-run. Exits non-zero on any step failure.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "▶ Deploying from $APP_DIR"

echo "▶ Pulling latest code…"
git pull --ff-only origin main

echo "▶ Installing dependencies…"
npm ci --production=false

echo "▶ Stopping app…"
pm2 stop candy || true

echo "▶ Clearing previous build…"
rm -rf .next

echo "▶ Building (webpack — turbopack standalone has a chunk-emit bug in Next 16)…"
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "▶ Copying static assets into standalone output…"
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

echo "▶ Running database migrations…"
npm run migrate

echo "▶ Restarting app…"
pm2 restart candy --update-env

echo "✅ Deploy complete."
pm2 status candy
