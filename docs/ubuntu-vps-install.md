# Txosnabai — Ubuntu VPS Installation Guide

The application is built entirely in GitHub Actions and published as a
self-contained tarball. The VPS never needs the source code, Node.js
build tools, or heavy `node_modules` — it only runs the pre-built bundle.

---

## Table of Contents

1. [How the build pipeline works](#1-how-the-build-pipeline-works)
2. [Prerequisites](#2-prerequisites)
3. [System preparation](#3-system-preparation)
4. [Install Node.js runtime and tools](#4-install-nodejs-runtime-and-tools)
5. [Install and configure PostgreSQL](#5-install-and-configure-postgresql)
6. [Install nginx](#6-install-nginx)
7. [Initial deploy](#7-initial-deploy)
8. [Configure environment variables](#8-configure-environment-variables)
9. [Run database migrations](#9-run-database-migrations)
10. [Start with PM2](#10-start-with-pm2)
11. [Configure nginx reverse proxy](#11-configure-nginx-reverse-proxy)
12. [TLS with Let's Encrypt](#12-tls-with-lets-encrypt)
13. [Upgrading with minimum downtime](#13-upgrading-with-minimum-downtime)
14. [GitHub Actions setup](#14-github-actions-setup)
15. [Environment variable reference](#15-environment-variable-reference)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. How the build pipeline works

Every push to `main` (and every `v*` tag) triggers `.github/workflows/release.yml`:

```
GitHub Actions
  └─ pnpm install --frozen-lockfile
  └─ pnpm prisma generate          ← no DB needed
  └─ pnpm build                    ← Next.js standalone output
  └─ assemble tarball
       .next/standalone/            ← runnable Node.js app
       .next/standalone/.next/static/  ← pre-built JS/CSS chunks
       .next/standalone/public/    ← static assets
       .next/standalone/prisma/    ← schema + migration files
  └─ upload artifact               ← available for 30 days
  └─ create GitHub Release         ← only on v* tags
```

The tarball is a complete, runnable application. The VPS only needs:

- Node.js 24 (to run `server.js`)
- PostgreSQL 16 (the database)
- `prisma` CLI (to apply migrations — installed once, globally)
- `pm2` (process manager)
- `nginx` (reverse proxy)
- `gh` CLI (to download bundles from GitHub)

---

## 2. Prerequisites

**Minimum server specs:**

| Resource | Minimum          | Recommended      |
| -------- | ---------------- | ---------------- |
| CPU      | 1 vCPU           | 2+ vCPUs         |
| RAM      | 1 GB             | 2 GB             |
| Disk     | 10 GB            | 20 GB SSD        |
| OS       | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

> RAM requirement is much lower than a build-on-server approach because
> `next build` never runs on the VPS.

**Required before you start:**

- A domain name pointing at the server IP (e.g. `txosnabai.example.com`)
- A GitHub fine-grained PAT with **read** access to the repository
  (needed so the server can download artifacts — see [Section 14](#14-github-actions-setup))
- Stripe account credentials (if online payments are used)
- The value of `NEXT_PUBLIC_BASE_URL` added to GitHub repository secrets
  (see [Section 14](#14-github-actions-setup))

---

## 3. System preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget unzip build-essential ca-certificates gnupg lsb-release
```

Create a dedicated OS user that owns the app process:

```bash
sudo useradd -m -s /bin/bash txosnabai
# Add your SSH public key if preferred over password login:
sudo mkdir -p /home/txosnabai/.ssh
sudo cp ~/.ssh/authorized_keys /home/txosnabai/.ssh/
sudo chown -R txosnabai:txosnabai /home/txosnabai/.ssh
sudo chmod 700 /home/txosnabai/.ssh
```

---

## 4. Install Node.js runtime and tools

The VPS only runs the app, so only the Node.js **runtime** is needed —
not the full build toolchain. `pnpm` is not required on the server.

```bash
# Node.js 24 (runtime only)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # must be v24.x

# PM2 — process manager
sudo npm install -g pm2

# Prisma CLI — used only to apply database migrations
sudo npm install -g prisma@7.7.0

# gh CLI — used to download build artifacts from GitHub
sudo apt install -y gh
# or via the official repo:
# curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
#   | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
# echo "deb [arch=$(dpkg --print-architecture) \
#   signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
#   https://cli.github.com/packages stable main" \
#   | sudo tee /etc/apt/sources.list.d/github-cli.list
# sudo apt update && sudo apt install -y gh
```

Authenticate `gh` as the `txosnabai` user using the fine-grained PAT:

```bash
sudo -i -u txosnabai bash
gh auth login --with-token <<< "github_pat_YOUR_TOKEN_HERE"
gh auth status   # should show: Logged in to github.com
exit
```

---

## 5. Install and configure PostgreSQL

```bash
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

> Generate a strong password with `openssl rand -base64 24` and store it
> in a password manager — you will need it for `DATABASE_URL`.

---

## 6. Install nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 7. Initial deploy

All deployment steps run as the `txosnabai` user.

```bash
sudo -i -u txosnabai bash
mkdir -p /home/txosnabai/{releases,logs}
```

### Download the bundle

**Option A — from a tagged release (recommended for production):**

```bash
cd /home/txosnabai/releases
gh release download v1.0.0 \
  --repo gorbeia/testapp-002 \
  --pattern '*.tar.gz'
```

**Option B — latest artifact from the `main` branch (pre-release / staging):**

```bash
cd /home/txosnabai/releases
gh run download \
  --repo gorbeia/testapp-002 \
  --name txosnabai-bundle
```

### Extract

```bash
cd /home/txosnabai/releases
VERSION="v1.0.0"   # match the downloaded filename

mkdir "$VERSION"
tar -xzf "txosnabai-${VERSION}.tar.gz" -C "$VERSION"

# Point the 'current' symlink at the new release
ln -sfn "/home/txosnabai/releases/$VERSION" /home/txosnabai/current
```

The live app will always be at `/home/txosnabai/current`.

---

## 8. Configure environment variables

Create `.env.production` once. It is **not** bundled in the artifact —
it stays on the server and is reused across every upgrade.

```bash
nano /home/txosnabai/.env.production
```

```dotenv
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://txosnabai:change_me_strong_password@localhost:5432/txosnabai"

# ── Auth ──────────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET="<output of: openssl rand -base64 32>"
NEXTAUTH_URL="https://txosnabai.example.com"

# ── Public URL (must match the value used at build time) ──────────────────────
NEXT_PUBLIC_BASE_URL="https://txosnabai.example.com"

# ── Payments ──────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYMENT_CREDENTIALS_KEY="<output of: openssl rand -hex 32>"

# ── Runtime ───────────────────────────────────────────────────────────────────
NODE_ENV="production"
PORT=3000

# ── Never set in production ───────────────────────────────────────────────────
# DEMO_RESET_SECRET=
# PROTO_MODE=
```

```bash
chmod 600 /home/txosnabai/.env.production
```

> `NEXT_PUBLIC_BASE_URL` is baked into the client bundle at build time via
> the `NEXT_PUBLIC_BASE_URL` GitHub repository secret. The value here must
> be identical to that secret, or payment redirects will break.

---

## 9. Run database migrations

```bash
prisma migrate deploy \
  --schema /home/txosnabai/current/prisma/schema.prisma
```

> `migrate deploy` applies versioned migration files and is safe for
> production. It is idempotent — running it again applies only pending
> migrations.

For the very first install you can optionally seed demo data:

```bash
# Seed requires source code + pnpm; skip if not needed
# pnpm prisma db seed
```

---

## 10. Start with PM2

Create the PM2 ecosystem file (one-time, lives outside the release directory):

```bash
cat > /home/txosnabai/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'txosnabai',
      script: '/home/txosnabai/current/server.js',
      cwd: '/home/txosnabai/current',
      instances: 'max',       // one worker per CPU core
      exec_mode: 'cluster',   // enables zero-downtime rolling reload
      env_file: '/home/txosnabai/.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      error_file: '/home/txosnabai/logs/err.log',
      out_file:   '/home/txosnabai/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
EOF
```

Start and persist:

```bash
pm2 start /home/txosnabai/ecosystem.config.cjs
pm2 save
```

Configure PM2 to start on boot (run as `txosnabai`, then paste and run the
printed `sudo ...` command as root):

```bash
pm2 startup
```

Verify:

```bash
pm2 status
pm2 logs txosnabai --lines 50
```

---

## 11. Configure nginx reverse proxy

Exit the `txosnabai` shell (`exit`), then as your sudo user:

```bash
sudo nano /etc/nginx/sites-available/txosnabai
```

```nginx
upstream txosnabai_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name txosnabai.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name txosnabai.example.com;

    ssl_certificate     /etc/letsencrypt/live/txosnabai.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/txosnabai.example.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header X-Frame-Options        SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy        strict-origin-when-cross-origin;

    # SSE connections must not time out — default is 60 s
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;

    location / {
        proxy_pass         http://txosnabai_app;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Required for SSE — disable response buffering
        proxy_set_header   Connection '';
        proxy_buffering    off;
        proxy_cache        off;
    }

    # Content-hashed chunks — cache forever
    location /_next/static/ {
        proxy_pass   http://txosnabai_app;
        add_header   Cache-Control "public, max-age=31536000, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/txosnabai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 12. TLS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d txosnabai.example.com
sudo systemctl status certbot.timer   # verify auto-renewal
sudo certbot renew --dry-run
sudo systemctl reload nginx
```

---

## 13. Upgrading with minimum downtime

The strategy is: **build new bundle in CI → download to a new directory →
apply migrations → repoint symlink → PM2 rolling reload**.

PM2 cluster mode replaces workers one at a time. nginx keeps routing to
whichever workers are alive, so users experience no dropped connections.

```
Old workers: [W1] [W2] [W3] [W4]
                 ↓ rolling reload ↓
Step 1:      [W1*]  [W2]  [W3]  [W4]   ← W1 replaced
Step 2:      [W1*] [W2*]  [W3]  [W4]   ← W2 replaced
...
Done:        [W1*] [W2*] [W3*] [W4*]   ← all workers on new code
```

### Upgrade procedure

Run as the `txosnabai` user (`sudo -i -u txosnabai`):

```bash
# 1. Download new bundle
cd /home/txosnabai/releases
NEW="v1.1.0"   # the new version tag
gh release download "$NEW" \
  --repo gorbeia/testapp-002 \
  --pattern '*.tar.gz'

# 2. Extract into a versioned directory
mkdir "$NEW"
tar -xzf "txosnabai-${NEW}.tar.gz" -C "$NEW"

# 3. Apply database migrations against the live DB
#    Migrations are backwards-compatible with the running code,
#    so it is safe to run this before the reload.
prisma migrate deploy --schema "/home/txosnabai/releases/${NEW}/prisma/schema.prisma"

# 4. Repoint the symlink atomically
ln -sfn "/home/txosnabai/releases/$NEW" /home/txosnabai/current

# 5. Rolling reload — workers restart one by one, site stays up
pm2 reload txosnabai --update-env

# 6. Verify
pm2 status
pm2 logs txosnabai --lines 30

# 7. Remove old releases (keep one previous for fast rollback)
ls -dt /home/txosnabai/releases/v* | tail -n +3 | xargs rm -rf
```

### Rolling back

```bash
# Point current at the previous release
PREV="v1.0.0"
ln -sfn "/home/txosnabai/releases/$PREV" /home/txosnabai/current
pm2 reload txosnabai --update-env
```

> **Database rollback:** Prisma does not generate down-migrations
> automatically. If the upgrade included a destructive schema change,
> restore from a pre-upgrade `pg_dump` snapshot. Always snapshot before
> step 3 when migrations are involved:
>
> ```bash
> pg_dump -Fc txosnabai > ~/backup-$(date +%Y%m%d-%H%M%S).dump
> ```

---

## 14. GitHub Actions setup

### Repository secret

The workflow bakes `NEXT_PUBLIC_BASE_URL` into the client bundle at build
time. Add it as a repository secret:

1. Go to **Settings → Secrets and variables → Actions → New repository secret**
2. Name: `NEXT_PUBLIC_BASE_URL`
3. Value: `https://txosnabai.example.com`

### Fine-grained PAT for the server

The server needs read-only access to download artifacts and releases.

1. Go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. Resource owner: the account that owns the repo
3. Repository access: **Only select repositories** → pick `testapp-002`
4. Permissions:
   - **Contents**: Read-only (for releases)
   - **Actions**: Read-only (for workflow artifacts)
5. Copy the token and use it in [Section 4](#4-install-nodejs-runtime-and-tools) (`gh auth login`)

### Triggering a release

Tag a commit to produce a GitHub Release with a downloadable asset:

```bash
git tag v1.1.0
git push origin v1.1.0
```

The workflow builds and attaches `txosnabai-v1.1.0.tar.gz` to the release.
Every push to `main` also produces a workflow artifact for staging deploys.

---

## 15. Environment variable reference

| Variable                  | Required | Set in                                  | Description                                       |
| ------------------------- | -------- | --------------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`            | Yes      | `.env.production`                       | PostgreSQL connection string                      |
| `NEXTAUTH_SECRET`         | Yes      | `.env.production`                       | Random ≥32-char string. `openssl rand -base64 32` |
| `NEXTAUTH_URL`            | Yes      | `.env.production`                       | Full public URL: `https://txosnabai.example.com`  |
| `NEXT_PUBLIC_BASE_URL`    | Yes      | GitHub secret **and** `.env.production` | Must match in both places                         |
| `STRIPE_SECRET_KEY`       | Yes\*    | `.env.production`                       | `sk_live_…` — required if Stripe is enabled       |
| `STRIPE_WEBHOOK_SECRET`   | Yes\*    | `.env.production`                       | `whsec_…` — required if Stripe is enabled         |
| `PAYMENT_CREDENTIALS_KEY` | Yes      | `.env.production`                       | 64-char hex. `openssl rand -hex 32`               |
| `NODE_ENV`                | Yes      | `.env.production`                       | Always `production`                               |
| `PORT`                    | No       | `.env.production`                       | Default `3000`                                    |
| `DEMO_RESET_SECRET`       | No       | —                                       | Leave unset in production                         |
| `PROTO_MODE`              | No       | —                                       | **Never set in production**                       |

---

## 16. Troubleshooting

### App not starting

```bash
pm2 logs txosnabai --lines 100
# Common causes: missing env var, wrong PORT, DB unreachable
```

Check database connectivity:

```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

### nginx returns 502 Bad Gateway

```bash
pm2 status                       # are workers running?
sudo ss -tlnp | grep 3000        # is something bound to port 3000?
```

### SSE connections drop after 60 seconds

Confirm the nginx site config contains `proxy_read_timeout 3600s` and
reload nginx: `sudo systemctl reload nginx`.

### `gh release download` fails

```bash
gh auth status                   # confirm token is valid
gh release list --repo gorbeia/testapp-002   # confirm release exists
```

### `prisma migrate deploy` errors

```bash
prisma migrate status --schema /home/txosnabai/current/prisma/schema.prisma
```

Never run `migrate reset` on production. Fix the specific failed migration
manually via `psql` then mark it as applied.

### High memory usage

Lower the number of PM2 workers in `ecosystem.config.cjs`:

```js
instances: 2,            // fixed count instead of 'max'
max_memory_restart: '384M',
```

Then reload: `pm2 reload txosnabai --update-env && pm2 save`.
