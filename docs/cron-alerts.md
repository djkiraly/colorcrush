# Scheduled Alerts Cron

The endpoint `POST /api/cron/alerts` (GET also works) scans all unacknowledged
scheduled alerts, sends an email for any that have just started firing, and
marks them so they don't re-notify. Intended to be called on a cron on the
production host.

## One-time setup

### 1. Set the shared secret

Add a random secret to `.env.local` on the production host:

```bash
# Anything long and unguessable
CRON_SECRET=$(openssl rand -hex 32)
echo "CRON_SECRET=$CRON_SECRET" >> .env.local
```

Restart the Next.js process so it picks up the new env var.

Without `CRON_SECRET` the endpoint refuses to run (returns 500).

### 2. Apply the migration

```bash
npm run migrate
```

That runs `scripts/migrate.ts`, which uses the Neon HTTP migrator to apply
every pending SQL file under `src/lib/db/migrations/` and records each in the
`drizzle.__drizzle_migrations` tracking table. Safe to re-run — already-applied
migrations are skipped.

### 3. Install the cron

Edit the crontab:

```bash
crontab -e
```

Example — run every 15 minutes:

```cron
*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer YOUR_SECRET_HERE" https://your-domain.example.com/api/cron/alerts >/var/log/colorcrush-alerts.log 2>&1
```

Replace `YOUR_SECRET_HERE` with the value you put in `CRON_SECRET`, and swap
the URL for your actual domain. Use `localhost:3000` (or whatever port Next is
on) if the cron runs on the same box and you want to avoid a round-trip through
the CDN.

A daily run is fine if you only use date-based alerts; every 15 min is better
if you have inventory alerts and want timely stock warnings.

## What the endpoint does

- Date alerts: notifies when `trigger_at <= now()`.
- Inventory alerts: notifies when the linked product's current stock is at or
  below `threshold_quantity`.
- Recipients: all users with role `admin` or `super_admin`, joined with a
  comma. Falls back to `siteConfig.contact.email` if no admin users exist.
- Each alert notifies **once**. Un-acknowledging an alert in the admin clears
  `notified_at` so the next cron run will re-notify.

## Response shape

```json
{ "checked": 12, "firing": 2, "notified": 2, "errors": [] }
```

`checked` is every unacknowledged, unnotified alert examined. `firing` is how
many met their condition. `notified` is how many emails actually sent. `errors`
lists any per-alert failures (email send threw, etc.); the cron keeps going.

## Manual trigger (for testing)

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/alerts
```
