# VPS Deployment Guide

Step-by-step guide for deploying directly on a VPS with Node.js, nginx, and SSL via Let's Encrypt. No Docker required.

## Prerequisites

- A VPS with SSH access (Ubuntu 22.04+ or Debian 12+ recommended)
- A domain name with DNS A records pointing to your VPS IP:
  - `yourdomain.com` -> `YOUR_VPS_IP`
  - `www.yourdomain.com` -> `YOUR_VPS_IP`
- A Neon Postgres database (or any Postgres with a connection URL)

## 1. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # should print v20.x
```

## 2. Install nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
```

## 3. Install certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## 4. Clone the repository

```bash
sudo mkdir -p /var/www/colorcrush
sudo chown $USER:$USER /var/www/colorcrush
git clone <your-repo-url> /var/www/colorcrush
cd /var/www/colorcrush
```

## 5. Install dependencies and build

```bash
npm ci
npm run build
cp -r .next/static .next/standalone/.next/static
```

## 6. Configure environment variables

```bash
cp .env.example .env.local
nano .env.local
```

Required variables:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

AUTH_SECRET=<run: openssl rand -base64 32>
AUTH_URL=https://yourdomain.com

GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

APP_PORT=3000
```

## 7. Run database migrations

```bash
npx drizzle-kit migrate
```

## 8. Create an admin user

```bash
npx tsx scripts/create-admin.ts admin@yourdomain.com yourpassword "Your Name"
```

Or seed the full demo dataset:

```bash
npx tsx scripts/seed.ts
```

## 9. Install PM2 and start the app

```bash
sudo npm install -g pm2
```

Create the logs directory and start the app using the included config:

```bash
mkdir -p /var/www/colorcrush/logs
cd /var/www/colorcrush
pm2 start ecosystem.config.js
```

Save the process list and set PM2 to start on boot:

```bash
pm2 save
pm2 startup
```

The `pm2 startup` command will print a `sudo` command — copy and run it.

Verify it's running (use the port from your `.env.local`):

```bash
pm2 status
curl -I http://127.0.0.1:YOUR_APP_PORT
```

## 10. Configure nginx

Create the site config:

```bash
sudo nano /etc/nginx/sites-available/candy
```

Paste the following, replacing `yourdomain.com` with your actual domain and `3000` with your `APP_PORT` value:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static assets (long cache)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site and test the config:

```bash
sudo ln -s /etc/nginx/sites-available/candy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Verify HTTP works:

```bash
curl -I http://yourdomain.com
```

## 11. Obtain SSL certificate

```bash
sudo certbot --nginx -d ccc.rocketcore.ai --email david@rocketcore.ai --agree-tos --no-eff-email
```

Certbot will automatically modify your nginx config to add SSL and set up HTTP-to-HTTPS redirects.

Verify HTTPS works:

```bash
curl -I https://yourdomain.com
```

Certbot installs a systemd timer for auto-renewal. Verify it's active:

```bash
sudo systemctl list-timers | grep certbot
```

## 12. Configure Stripe webhook

In the Stripe Dashboard, create a webhook endpoint pointing to:

```
https://yourdomain.com/api/webhooks/stripe
```

Events to subscribe to: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`.

## 13. Verify the deployment

- Visit `https://yourdomain.com` -- storefront should load
- Visit `https://yourdomain.com/login` -- log in with your admin credentials
- Visit `https://yourdomain.com/admin` -- admin dashboard should load
- Visit `https://yourdomain.com/admin/settings` -- test Gmail connection and save a setting

## Ongoing operations

### Deploy updates

```bash
cd /var/www/colorcrush
git pull
npm ci
npm run build
cp -r .next/static .next/standalone/.next/static
pm2 restart candy
```

### Run new migrations after schema changes

```bash
cd /var/www/colorcrush
npx drizzle-kit migrate
pm2 restart candy
```

### View logs

```bash
pm2 logs candy                             # application logs (live)
pm2 logs candy --lines 200                 # last 200 lines
sudo tail -f /var/log/nginx/access.log     # nginx access logs
sudo tail -f /var/log/nginx/error.log      # nginx error logs
```

### Restart the app

```bash
pm2 restart candy
```

### Stop the app

```bash
pm2 stop candy
```

### Manually renew SSL

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Firewall

If UFW is enabled:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
```

## Shared server — port conflicts

If port 80/443 is already used by another web server (e.g., Apache), you have two options:

**Option A**: Disable Apache and use nginx instead:
```bash
sudo systemctl disable --now apache2
```

**Option B**: Run nginx on alternate ports and configure Apache as the front proxy, or run the Node.js app on a different port by changing `PORT` in the service file and adjusting the nginx `proxy_pass` accordingly.
