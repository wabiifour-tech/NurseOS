#!/bin/bash
# ==============================================================
# NurseOS — One-Command Deploy to GitHub + Vercel
# ==============================================================
# PREREQUISITES:
#   1. GitHub account with a Personal Access Token (PAT)
#      Create one at: https://github.com/settings/tokens
#      Required scopes: repo, workflow
#
#   2. Vercel account (free tier works)
#      Sign up at: https://vercel.com/signup
#
# USAGE:
#   chmod +x deploy-vercel.sh
#   ./deploy-vercel.sh
# ==============================================================

set -e

echo ""
echo "🏥  NurseOS — Deploy to GitHub & Vercel"
echo "=========================================="
echo ""

# ---- GitHub Setup ----
echo "📦 STEP 1: GitHub Repository Setup"
echo "-----------------------------------"
read -p "  GitHub username: " GH_USER
read -p "  Repository name [nurseos]: " GH_REPO
GH_REPO=${GH_REPO:-nurseos}
read -p "  GitHub Personal Access Token: " GH_TOKEN

echo ""
echo "  Creating repository on GitHub..."

# Create GitHub repo via API
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$GH_REPO\",\"description\":\"NurseOS — The Operating System for Global Nursing Care\",\"public\":true,\"auto_init\":false}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "  ✅ Repository created: https://github.com/$GH_USER/$GH_REPO"
elif [ "$HTTP_CODE" = "422" ]; then
  echo "  ⚠️  Repository already exists — continuing with existing repo"
else
  echo "  ❌ Failed to create repository (HTTP $HTTP_CODE)"
  echo "  $BODY"
  exit 1
fi

# Set remote and push
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$GH_REPO.git"
echo "  🚀 Pushing code to GitHub..."
git push -u origin main --force
echo "  ✅ Code pushed to GitHub!"

# Remove token from remote URL for security
git remote set-url origin "https://github.com/$GH_USER/$GH_REPO.git"

echo ""
echo "🌐 STEP 2: Vercel Deployment"
echo "-----------------------------"
echo ""
echo "  Option A: Deploy via Vercel Dashboard (Recommended)"
echo "  ---------------------------------------------------"
echo "  1. Go to: https://vercel.com/new"
echo "  2. Click 'Import Git Repository'"
echo "  3. Select: $GH_USER/$GH_REPO"
echo "  4. Configure these settings:"
echo ""
echo "     Framework Preset:  Next.js"
echo "     Root Directory:    ./"
echo "     Build Command:     npx prisma generate && next build"
echo "     Output Directory:  .next"
echo "     Install Command:   npm install"
echo ""
echo "  5. Add Environment Variables (click 'Environment Variables'):"
echo ""
echo "     Key: DATABASE_URL"
echo "     Value: (from Vercel Postgres — see Step 3)"
echo ""
echo "     Key: DIRECT_URL"
echo "     Value: (from Vercel Postgres — see Step 3)"
echo ""
echo "  6. Click 'Deploy'"
echo ""

# ---- Vercel CLI option ----
read -p "  Do you want to try Vercel CLI deploy? (y/n) [n]: " USE_VERCEL_CLI
if [ "$USE_VERCEL_CLI" = "y" ]; then
  echo ""
  echo "  Starting Vercel CLI deployment..."
  vercel --yes --prod
fi

echo ""
echo "🗄️  STEP 3: Database Setup (Vercel Postgres)"
echo "----------------------------------------------"
echo ""
echo "  Option A: Vercel Postgres (Easiest)"
echo "  1. Go to your project in Vercel Dashboard"
echo "  2. Click 'Storage' tab"
echo "  3. Click 'Create Database' → 'Postgres'"
echo "  4. Select the Free plan"
echo "  5. Vercel will automatically set DATABASE_URL and DIRECT_URL"
echo ""
echo "  Option B: Neon (External PostgreSQL)"
echo "  1. Go to https://neon.tech → Create Free Database"
echo "  2. Copy the connection string"
echo "  3. Add DATABASE_URL and DIRECT_URL in Vercel Environment Variables"
echo ""

echo "📊  STEP 4: Push Database Schema"
echo "----------------------------------"
echo ""
echo "  After the database is set up, push the schema:"
echo ""
echo "  Option A: Using Vercel CLI"
echo "    vercel env pull .env.local"
echo "    npx prisma db push"
echo ""
echo "  Option B: Manual"
echo "    1. Copy DATABASE_URL from Vercel Dashboard"
echo "    2. Run: DATABASE_URL='your-url' npx prisma db push"
echo ""

echo "=========================================="
echo "🎉  Deployment Complete!"
echo "=========================================="
echo ""
echo "  GitHub:  https://github.com/$GH_USER/$GH_REPO"
echo "  Vercel:  Check your Vercel Dashboard for the deployment URL"
echo ""
echo "  Next Steps:"
echo "  1. Set up Vercel Postgres database"
echo "  2. Push schema with prisma db push"
echo "  3. Visit your app and create an account!"
echo ""
