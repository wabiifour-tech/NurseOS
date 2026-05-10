# NurseOS — Deploy to Vercel Guide

## Quick Deploy (5 minutes)

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named **nurseos**
3. Make it **Public** (required for Vercel free tier)
4. **Don't** initialize with README (we already have code)

### Step 2: Push Code to GitHub

```bash
cd /home/z/my-project

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/nurseos.git

# Push the code
git push -u origin main
```

If you need to authenticate, use a Personal Access Token:
- Create one at: https://github.com/settings/tokens
- Required scopes: `repo`, `workflow`
- Use as password when prompted

### Step 3: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `nurseos` repository
4. Configure these settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npx prisma generate && next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

5. **Don't deploy yet** — we need to set up the database first

### Step 4: Set Up Database (Vercel Postgres)

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** → **Postgres** (Neon)
3. Select the **Free** plan
4. Vercel automatically adds these environment variables:
   - `DATABASE_URL` — for connection pooling (used by app at runtime)
   - `DIRECT_URL` — direct connection (used by Prisma migrations)
   - `POSTGRES_URL` — raw connection string

### Step 5: Push Database Schema

After the database is created, push the Prisma schema:

```bash
# Pull Vercel environment variables locally
vercel env pull .env.local

# Push schema to database
npx prisma db push
```

Or manually:
```bash
DATABASE_URL="your-connection-string" npx prisma db push
```

### Step 6: Deploy!

1. Go back to Vercel Dashboard → Settings → Environment Variables
2. Verify `DATABASE_URL` and `DIRECT_URL` are set
3. Click **Deployments** → **Redeploy**

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooled, for runtime) |
| `DIRECT_URL` | ✅ | PostgreSQL direct connection (for Prisma migrations) |

These are automatically set when you add Vercel Postgres to your project.

---

## Alternative: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from project directory
cd /home/z/my-project
vercel --yes --prod
```

Then add Vercel Postgres via the dashboard and run `prisma db push`.

---

## Troubleshooting

### Build Fails with "Can't reach database server"
- Make sure `DATABASE_URL` is set in Vercel Environment Variables
- The connection string should end with `?sslmode=require`

### Hydration Mismatch Errors
- All `Math.random()` calls have been replaced with deterministic values
- If you see hydration errors, clear browser cache and try again

### Auth Not Working (Login → Redirect to Landing)
- Make sure cookies are working on HTTPS
- The `Secure` flag is automatically added for HTTPS deployments
- Check that `DATABASE_URL` is correct and the database is accessible

### 404 on API Routes
- All API routes are under `/api/` prefix
- Make sure the Vercel deployment detected Next.js correctly
