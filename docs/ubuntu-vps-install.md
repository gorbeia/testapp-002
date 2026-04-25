# Txosnabai — Ubuntu VPS Installation Guide

This guide covers a fresh installation of the Txosnabai app on an Ubuntu 22.04 LTS (or 24.04 LTS) VPS, including a zero-downtime upgrade strategy using PM2 cluster mode.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [System Preparation](#2-system-preparation)
3. [Install Node.js and pnpm](#3-install-nodejs-and-pnpm)
4. [Install and Configure PostgreSQL](#4-install-and-configure-postgresql)
5. [Install nginx](#5-install-nginx)
6. [Deploy the Application](#6-deploy-the-application)
7. [Configure Environment Variables](#7-configure-environment-variables)
8. [Run Database Migrations and Seed](#8-run-database-migrations-and-seed)
9. [Build and Start with PM2](#9-build-and-start-with-pm2)
10. [Configure nginx Reverse Proxy](#10-configure-nginx-reverse-proxy)
11. [TLS with Let's Encrypt](#11-tls-with-lets-encrypt)
12. [Upgrading with Minimum Downtime](#12-upgrading-with-minimum-downtime)
13. [Environment Variable Reference](#13-environment-variable-reference)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

**Minimum server specs:**

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 1 vCPU  | 2+ vCPUs    |
| RAM      | 2 GB    | 4 GB        |
| Disk     | 20 GB   | 40 GB SSD   |
| OS       | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

**Required external services:**

- A domain name pointed at the server's IP (e.g. `txosnabai.example.com`)
- A Stripe account (for online payments) — or skip if using cash-only mode
- Outbound SMTP or a transactional mail service (optional, for notifications)

---

## 2. System Preparation

Log in as root or a user with `sudo` privileges, then:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget unzip build-essential ca-certificates gnupg lsb-release
```

Create a dedicated system user that will own the app process. Running as a non-root user limits blast radius if the process is ever compromised.

```bash
sudo useradd -m -s /bin/bash txosnabai
sudo passwd txosnabai   # set a strong password, or use SSH key only
```

Add your SSH public key to the new user if you prefer key-based access:

```bash
sudo mkdir -p /home/txosnabai/.ssh
sudo cp ~/.ssh/authorized_keys /home/txosnabai/.ssh/
sudo chown -R txosnabai:txosnabai /home/txosnabai/.ssh
sudo chmod 700 /home/txosnabai/.ssh
```

---

## 3. Install Node.js and pnpm

The app requires **Node.js 24.x** and **pnpm 10.22.0**. Use the NodeSource repository for the correct version.

```bash
# Add NodeSource repository for Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # must be v24.x
npm --version
```

Install pnpm via npm (runs globally for all users):

```bash
sudo npm install -g pnpm@10.22.0

# Verify
pnpm --version   # must be 10.22.0
```

Install PM2 globally — this is the process manager used to keep the app running and enable zero-downtime restarts:

```bash
sudo npm install -g pm2
```

---

## 4. Install and Configure PostgreSQL

The app requires **PostgreSQL 16**.

```bash
# Add official PostgreSQL repo
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
sudo apt install -y postgresql-16

sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create the database user and database:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER txosnabai WITH PASSWORD 'change_me_strong_password';
CREATE DATABASE txosnabai OWNER txosnabai;
GRANT ALL PRIVILEGES ON DATABASE txosnabai TO txosnabai;
SQL
```

> **Security note:** Replace `change_me_strong_password` with a randomly generated password (e.g. `openssl rand -base64 24`). Store it in a password manager — you will need it for the `DATABASE_URL` environment variable.

Restrict PostgreSQL to localhost (it does so by default, but verify):

```bash
sudo grep "listen_addresses" /etc/postgresql/16/main/postgresql.conf
# Should show: listen_addresses = 'localhost'
```

---

## 5. Install nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Open the firewall for HTTP and HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 6. Deploy the Application

Switch to the app user, clone the repo, and install dependencies:

```bash
sudo -i -u txosnabai bash
cd ~

git clone https://github.com/gorbeia/testapp-002.git txosnabai
cd txosnabai

# Install production dependencies (frozen lockfile ensures reproducible installs)
pnpm install --frozen-lockfile
```

The app directory will be `/home/txosnabai/txosnabai/`. All subsequent commands in this guide assume this working directory unless noted.

---

## 7. Configure Environment Variables

Create an `.env.production` file. This file is read by Next.js when `NODE_ENV=production`.

```bash
nano /home/txosnabai/txosnabai/.env.production
```

Paste and fill in the values (see [Section 13](#13-environment-variable-reference) for details):

```dotenv
# ── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://txosnabai:change_me_strong_password@localhost:5432/txosnabai"

# ── Auth ─────────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET="<output of: openssl rand -base64 32>"
NEXTAUTH_URL="https://txosnabai.example.com"

# ── Public URL (used in client-side code and payment redirects) ───────────────
NEXT_PUBLIC_BASE_URL="https://txosnabai.example.com"

# ── Payments ─────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYMENT_CREDENTIALS_KEY="<output of: openssl rand -hex 32>"

# ── Runtime ──────────────────────────────────────────────────────────────────
NODE_ENV="production"

# ── Optional ─────────────────────────────────────────────────────────────────
# DEMO_RESET_SECRET=""   # leave unset in production
# PROTO_MODE=""          # NEVER set to true in production
```

Set strict permissions so only the app user can read it:

```bash
chmod 600 /home/txosnabai/txosnabai/.env.production
```

---

## 8. Run Database Migrations and Seed

Generate the Prisma client and apply migrations:

```bash
cd /home/txosnabai/txosnabai

# Generate Prisma client
pnpm prisma generate

# Apply schema to database (first install)
pnpm prisma migrate deploy
```

> **`migrate deploy` vs `db push`:** `migrate deploy` applies versioned SQL migration files and is safe for production. Use `db push` only in development — it can cause data loss on schema conflicts.

Optionally seed the database with demo data (useful for first-time setup):

```bash
pnpm prisma db seed
```

---

## 9. Build and Start with PM2

Build the production bundle:

```bash
cd /home/txosnabai/txosnabai
pnpm build
```

Create a PM2 ecosystem file. This file drives both the normal start and zero-downtime upgrades later:

```bash
cat > /home/txosnabai/txosnabai/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'txosnabai',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/txosnabai/txosnabai',
      instances: 'max',          // one worker per CPU core
      exec_mode: 'cluster',      // enables zero-downtime reload
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      error_file: '/home/txosnabai/logs/err.log',
      out_file: '/home/txosnabai/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
EOF

mkdir -p /home/txosnabai/logs
```

Start the app:

```bash
pm2 start ecosystem.config.cjs
pm2 save   # persist process list so it survives reboots
```

Configure PM2 to start on system boot (run this as the `txosnabai` user, then follow the printed instructions as root):

```bash
pm2 startup
# Copy and run the command it prints — it typically looks like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u txosnabai --hp /home/txosnabai
```

Check that the app is running:

```bash
pm2 status
pm2 logs txosnabai --lines 50
```

---

## 10. Configure nginx Reverse Proxy

Create an nginx site config. Exit the `txosnabai` user session first (`exit`), then:

```bash
sudo nano /etc/nginx/sites-available/txosnabai
```

```nginx
upstream txosnabai_app {
    # All PM2 cluster workers bind to the same port
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name txosnabai.example.com;

    # Redirect all HTTP to HTTPS (fill in after TLS setup)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name txosnabai.example.com;

    # TLS — filled in by certbot in Section 11
    ssl_certificate     /etc/letsencrypt/live/txosnabai.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/txosnabai.example.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options           SAMEORIGIN;
    add_header X-Content-Type-Options    nosniff;
    add_header Referrer-Policy           strict-origin-when-cross-origin;
    add_header Permissions-Policy        "geolocation=(), camera=(), microphone=()";

    # Increase timeout for SSE (Server-Sent Events) connections
    proxy_read_timeout  3600s;
    proxy_send_timeout  3600s;

    location / {
        proxy_pass         http://txosnabai_app;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Required for SSE — disable response buffering
        proxy_set_header Connection        '';
        proxy_buffering                    off;
        proxy_cache                        off;
    }

    # Cache static Next.js assets aggressively — they are content-hashed
    location /_next/static/ {
        proxy_pass       http://txosnabai_app;
        proxy_cache_valid 200 365d;
        add_header       Cache-Control "public, max-age=31536000, immutable";
    }

    # Serve public/ files directly (avoids a round-trip to Node)
    location /public/ {
        root    /home/txosnabai/txosnabai;
        expires 7d;
    }
}
```

Enable the site and reload nginx:

```bash
sudo ln -s /etc/nginx/sites-available/txosnabai /etc/nginx/sites-enabled/
sudo nginx -t          # must print: syntax is ok / test is successful
sudo systemctl reload nginx
```

---

## 11. TLS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (temporarily stops nginx to answer the ACME challenge)
sudo certbot --nginx -d txosnabai.example.com

# Verify auto-renewal
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

After certbot completes it patches the nginx config automatically. Reload nginx one more time:

```bash
sudo systemctl reload nginx
```

---

## 12. Upgrading with Minimum Downtime

The strategy uses **PM2 cluster mode + rolling reload**: new Node.js workers are started before old ones are killed. Combined with an atomic build directory swap, this keeps the site serving traffic throughout the upgrade.

### How it works

PM2 cluster mode runs multiple worker processes. During `pm2 reload`:

1. PM2 starts a new worker with the updated code.
2. Waits until the new worker is listening (ready signal).
3. Sends the old worker a `SIGINT` to drain its connections.
4. Repeats until all workers have been replaced.

nginx continues proxying to whichever workers are alive, so users experience no downtime — at most a single in-flight request is retried.

### Upgrade procedure

Run the following steps as the `txosnabai` user (`sudo -i -u txosnabai`):

```bash
cd /home/txosnabai

# 1. Clone or update the codebase into a NEW directory (never build in-place)
git clone https://github.com/gorbeia/testapp-002.git txosnabai-next
cd txosnabai-next

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Copy the production env file from the current release
cp ../txosnabai/.env.production .

# 4. Generate Prisma client against the new schema
pnpm prisma generate

# 5. Build the production bundle
pnpm build

# 6. Apply any new database migrations
#    This runs against the live database — migrations are designed to be
#    backwards-compatible with the current code, so the running app keeps working.
pnpm prisma migrate deploy

# 7. Atomic swap: rename directories
cd /home/txosnabai
mv txosnabai txosnabai-old
mv txosnabai-next txosnabai

# 8. Tell PM2 to perform a rolling reload
#    Workers restart one-by-one; the app stays online throughout.
pm2 reload txosnabai --update-env

# 9. Verify all workers came up healthy
pm2 status
pm2 logs txosnabai --lines 30

# 10. Remove the previous release once satisfied
rm -rf txosnabai-old
```

### Rolling back

If the new version has a critical bug, roll back in seconds:

```bash
cd /home/txosnabai

# Swap back
mv txosnabai txosnabai-bad
mv txosnabai-old txosnabai

# Reload PM2 with the old code
pm2 reload txosnabai --update-env
```

> **Database rollback:** Prisma does not auto-generate down-migrations. If the upgrade included a destructive schema change you need to roll back, restore from a pre-upgrade database snapshot. Always take a `pg_dump` before step 6 when schema changes are involved.

### Pre-upgrade checklist

- [ ] Take a database backup: `pg_dump -Fc txosnabai > backup-$(date +%Y%m%d-%H%M%S).dump`
- [ ] Read the changelog for breaking schema changes or required env var additions
- [ ] Add any new env vars to `.env.production` before the reload
- [ ] Run `pnpm lint && pnpm typecheck` locally before pushing

---

## 13. Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string: `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Yes | Random 32+ byte string. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full public URL, e.g. `https://txosnabai.example.com` |
| `NEXT_PUBLIC_BASE_URL` | Yes | Same as `NEXTAUTH_URL` — sent to the browser for payment redirects |
| `STRIPE_SECRET_KEY` | Yes* | Stripe secret key (`sk_live_…`). *Required only if Stripe is enabled. |
| `STRIPE_WEBHOOK_SECRET` | Yes* | Stripe webhook signing secret (`whsec_…`). *Required only if Stripe is enabled. |
| `PAYMENT_CREDENTIALS_KEY` | Yes | 64-char hex key for encrypting stored payment credentials. Generate: `openssl rand -hex 32` |
| `NODE_ENV` | Yes | Always `production` in production |
| `PORT` | No | Port for Next.js to listen on (default: `3000`) |
| `DEMO_RESET_SECRET` | No | Leave unset in production. Enables a demo-reset API endpoint. |
| `PROTO_MODE` | No | **Never set in production.** Bypasses authentication for integration tests. |

---

## 14. Troubleshooting

### App is not starting

```bash
pm2 logs txosnabai --lines 100
# Look for: missing env vars, Prisma connection errors, port conflicts
```

Check whether PostgreSQL is reachable:

```bash
sudo -u txosnabai psql "$DATABASE_URL" -c "SELECT 1;"
```

### nginx returns 502 Bad Gateway

The Node.js process is not listening. Check:

```bash
pm2 status
sudo ss -tlnp | grep 3000   # confirm something is bound to port 3000
```

### SSE connections drop after 60 seconds

nginx's default `proxy_read_timeout` is 60 s. Confirm the site config has `proxy_read_timeout 3600s` as shown in Section 10, then reload nginx.

### Prisma migration fails during upgrade

Run the migration manually to see the full error:

```bash
cd /home/txosnabai/txosnabai-next
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d= -f2-)" pnpm prisma migrate status
```

If migrations are in a dirty state: never run `migrate reset` on production. Investigate the specific failed migration and fix it manually via `psql`.

### High memory usage

Next.js with many cluster workers can be memory-intensive. Tune `instances` in `ecosystem.config.cjs`:

```js
instances: 2,   // fixed number instead of 'max'
```

Or lower the restart threshold:

```js
max_memory_restart: '384M',
```
