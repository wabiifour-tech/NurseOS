#!/bin/bash
# NurseOS - Deploy to Vercel via GitHub
# Run this script after setting up your GitHub and Vercel accounts

set -e

echo "========================================="
echo "  NurseOS - Vercel Deployment Script"
echo "========================================="
echo ""

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."
command -v git >/dev/null 2>&1 || { echo "ERROR: git is not installed"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: node is not installed"; exit 1; }
echo "✓ Prerequisites met"
echo ""

# Step 2: Create GitHub repository
echo "Step 2: Creating GitHub repository..."
echo "  If you haven't already, create a new repository on GitHub:"
echo "  https://github.com/new"
echo ""
echo "  Repository name: nurseos"
echo "  Description: NurseOS - The Operating System for Global Nursing Care"
echo "  Visibility: Public (required for free Vercel deployment)"
echo ""
read -p "  Enter your GitHub username: " GITHUB_USERNAME
read -p "  Enter your repository name (default: nurseos): " REPO_NAME
REPO_NAME=${REPO_NAME:-nurseos}

# Step 3: Add remote and push
echo ""
echo "Step 3: Pushing to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
echo "  Remote set to: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
echo ""
echo "  Pushing code..."
git push -u origin main
echo "✓ Code pushed to GitHub"
echo ""

# Step 4: Vercel deployment instructions
echo "Step 4: Deploy to Vercel"
echo "  1. Go to https://vercel.com/new"
echo "  2. Import your GitHub repository: ${GITHUB_USERNAME}/${REPO_NAME}"
echo "  3. Configure the following settings:"
echo ""
echo "     Framework Preset: Next.js"
echo "     Build Command: prisma generate && next build"
echo "     Output Directory: .next"
echo "     Install Command: npm install"
echo ""
echo "  4. Add the following Environment Variables:"
echo ""
echo "     DATABASE_URL     = <your-postgresql-connection-string>"
echo "     DIRECT_URL       = <your-postgresql-direct-connection-string>"
echo "     NEXTAUTH_SECRET  = <generate-with-openssl-rand-base64-32>"
echo "     NEXTAUTH_URL     = https://your-app.vercel.app"
echo ""
echo "  5. Click 'Deploy'"
echo ""

# Step 5: Set up Vercel Postgres
echo "Step 5: Set up Database (Vercel Postgres / Neon)"
echo "  Option A: Vercel Postgres (Recommended)"
echo "    1. Go to your project in Vercel Dashboard"
echo "    2. Go to Storage tab"
echo "    3. Create a new Postgres database"
echo "    4. It will auto-set DATABASE_URL and DIRECT_URL env vars"
echo ""
echo "  Option B: Neon (External)"
echo "    1. Go to https://neon.tech and create a free database"
echo "    2. Copy the connection string"
echo "    3. Add as DATABASE_URL in Vercel Environment Variables"
echo ""

# Step 6: Run migrations
echo "Step 6: Push Database Schema"
echo "  After setting up the database, run:"
echo "    npx prisma db push"
echo ""
echo "  Or use Vercel CLI:"
echo "    vercel env pull .env.local"
echo "    npx prisma db push"
echo ""

echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  Your NurseOS app will be available at:"
echo "  https://your-project.vercel.app"
echo ""
