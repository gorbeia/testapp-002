# Deploying Txosnabai to Vercel (Free Tier)

This guide walks through deploying the app to Vercel's Hobby plan (free) with a free-tier PostgreSQL database.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (Hobby plan — free)
- A [Neon account](https://neon.tech) — free serverless Postgres (or Supabase, also free)
- Your code pushed to a GitHub repository

---

## Step 1 — Set Up a Free PostgreSQL Database

Vercel's Hobby plan does not include built-in Postgres. Use **Neon** (recommended) or **Supabase** instead.

### Neon (recommended)

1. Sign up at <https://neon.tech> and create a new project.
2. Choose a region close to your users.
3. From the dashboard, open **Connection Details** and copy the **connection string**. It looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this string — you will paste it as `DATABASE_URL` in Vercel later.

### Supabase (alternative)

1. Sign up at <https://supabase.com> and create a new project.
2. Go to **Project Settings → Database → Connection string → URI**.
3. Copy the connection string (replace `[YOUR-PASSWORD]` with your project password).

---

## Step 2 — Prepare the Repository

### 2a. Verify the build passes locally

```bash
pnpm build
```

Fix any TypeScript or lint errors before deploying.

### 2b. Run the database migration against the remote DB

Replace `<YOUR_CONNECTION_STRING>` with the Neon/Supabase URL:

```bash
DATABASE_URL="<YOUR_CONNECTION_STRING>" pnpm prisma migrate deploy
```

`migrate deploy` applies existing migrations without interactive prompts — safe for CI and production.

---

## Step 3 — Import the Project into Vercel

1. Go to <https://vercel.com/new> and click **Import Git Repository**.
2. Select your GitHub repo (grant access if prompted).
3. Vercel will auto-detect **Next.js** — no framework override needed.
4. Leave the **Build Command** and **Output Directory** as the defaults.
5. Set the **Install Command** to:
   ```
   pnpm install --frozen-lockfile
   ```
6. Click **Deploy** — the first build will fail because environment variables are missing. That is expected; continue to Step 4.

---

## Step 4 — Configure Environment Variables

In your Vercel project go to **Settings → Environment Variables** and add the following.

### Required

| Variable               | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`         | Your Neon/Supabase connection string                           |
| `STORAGE_MODE`         | `orm`                                                          |
| `NEXTAUTH_SECRET`      | Run `openssl rand -base64 32` locally and paste the output     |
| `NEXTAUTH_URL`         | Your Vercel deployment URL, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL`  | Same as `NEXTAUTH_URL`                                         |
| `NEXT_PUBLIC_BASE_URL` | Same as `NEXTAUTH_URL`                                         |

### Optional — payments

Only required if you use payment features:

| Variable                  | Value                                                  |
| ------------------------- | ------------------------------------------------------ |
| `PAYMENT_CREDENTIALS_KEY` | 64-character hex key (see `.env.example`)              |
| `STRIPE_SECRET_KEY`       | From the Stripe dashboard (`sk_live_…` or `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET`   | From the Stripe webhook endpoint (`whsec_…`)           |

### Leave out in production

Do **not** set `PROTO_MODE` or `DEMO_RESET_SECRET` in production — they bypass authentication and expose reset endpoints.

---

## Step 5 — Redeploy

After saving the environment variables, trigger a new deployment:

- **Vercel dashboard → Deployments → ⋮ → Redeploy**, or
- Push a new commit to your main branch.

Watch the build log. A successful build ends with:

```
✓ Compiled successfully
✓ Generating static pages
```

---

## Step 6 — Configure the Stripe Webhook (if using Stripe)

Vercel deployments get a stable URL, which you can register as a Stripe webhook endpoint.

1. In the Stripe dashboard go to **Developers → Webhooks → Add endpoint**.
2. Set the URL to `https://your-app.vercel.app/api/webhooks/stripe`.
3. Select the events your app handles (e.g. `checkout.session.completed`, `payment_intent.succeeded`).
4. Copy the **Signing secret** (`whsec_…`) and paste it as `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy.

---

## Free-Tier Limits to Know

| Service       | Free limit                                | What happens when exceeded             |
| ------------- | ----------------------------------------- | -------------------------------------- |
| Vercel Hobby  | 100 GB bandwidth / month                  | Deployments paused                     |
| Vercel Hobby  | 100 GB-hours serverless execution / month | Functions throttled                    |
| Vercel Hobby  | 1 concurrent build                        | Builds queue                           |
| Neon Free     | 0.5 GB storage, 190 compute hours / month | Compute suspended                      |
| Supabase Free | 500 MB storage, 2 projects                | Project paused after 7 days inactivity |

For a low-traffic festival app these limits are more than enough.

---

## Troubleshooting

### Build fails: `Cannot find module '@prisma/client'`

Prisma's post-install script is sandboxed by pnpm. Add a `postinstall` script to `package.json`:

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

Then redeploy.

### `NEXTAUTH_URL` mismatch errors

Make sure `NEXTAUTH_URL` matches the exact URL Vercel assigned (including `https://` and no trailing slash).

### Database connection timeouts on Neon

Add `?sslmode=require&connect_timeout=10` to the end of your `DATABASE_URL` if you see timeouts on cold starts.

### Prisma migrations not applied

Run `migrate deploy` manually from your local machine pointed at the production `DATABASE_URL` before redeploying:

```bash
DATABASE_URL="<production-url>" pnpm prisma migrate deploy
```

---

## Post-Deployment Checklist

- [ ] App loads at the Vercel URL
- [ ] Sign-in flow works end-to-end
- [ ] At least one order can be created and confirmed
- [ ] Stripe test payment succeeds (if enabled)
- [ ] No `PROTO_MODE` or `DEMO_RESET_SECRET` set in production environment variables
