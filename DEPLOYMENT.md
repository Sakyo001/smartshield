# SmartShield Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Supabase project with environment variables

## Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Setup Vercel deployment"

# Push to GitHub
git push origin user-dashboard
```

## Step 2: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository: `Sakyo001/smartshield`
4. **Framework Preset**: Next.js
5. **Root Directory**: `apps/web`
6. **Build Command**: `npm run build`
7. **Output Directory**: `.next`
8. **Install Command**: `npm install`
9. **Node.js Version**: 20.x

## Step 3: Configure Environment Variables

In Vercel project settings, add these environment variables:

### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://jlgktijajxapqclgjyjx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT:** Copy these values from your `apps/web/.env` file

### How to Add Environment Variables in Vercel:
1. Go to your project → Settings → Environment Variables
2. Add each variable with its value
3. Select all environments (Production, Preview, Development)
4. Click "Save"

## Step 4: Configure Vercel Settings

### Build & Development Settings:
- **Framework**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 20.x

### Advanced Settings (Optional):
```json
{
  "buildCommand": "cd apps/web && npm run build",
  "devCommand": "cd apps/web && npm run dev",
  "installCommand": "npm install"
}
```

### Environment Variables to Set in Vercel:
```bash
# Node.js version
NODE_VERSION=20.x

# Package manager (use npm instead of pnpm for compatibility)
NPM_CONFIG_LEGACY_PEER_DEPS=true
```

## Step 5: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (3-5 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

## Step 6: Update Supabase Auth Settings

After deployment, add your Vercel URL to Supabase:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: 
     - `https://your-project.vercel.app/auth/callback`
     - `https://your-project.vercel.app/**` (wildcard for all auth routes)

## Step 7: Configure Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (can take up to 48 hours)

## Automatic Deployments

Vercel automatically deploys on every push to your GitHub repository:
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches (like `user-dashboard`)

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set correctly
- Ensure Node version is compatible (18+)

### Authentication Issues
- Verify Supabase redirect URLs include your Vercel domain
- Check that environment variables are set in Vercel
- Ensure `NEXT_PUBLIC_` prefix is used for client-side variables

### API Errors
- Check that PhishGuard API endpoint is accessible
## Commands Reference

```bash
# Local development (from root)
pnpm dev

# Local development (from apps/web)
cd apps/web && npm run dev

# Build for production
cd apps/web && npm run build

# Start production server locally
cd apps/web && npm start

# Deploy manually via Vercel CLI
cd apps/web && vercel deploy
cd apps/web && vercel deploy --prod
```

## Fix pnpm Issues Locally (if needed)

If you encounter pnpm errors locally:

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml apps/web/node_modules

# Reinstall with npm instead
cd apps/web
npm install

# Or use npm workspaces
npm install --legacy-peer-deps
```uild for production
pnpm run build

# Start production server locally
pnpm start

# Deploy manually via Vercel CLI
vercel deploy
vercel deploy --prod
```

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
