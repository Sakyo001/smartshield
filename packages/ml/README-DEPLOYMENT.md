# SmartShield WHOIS/DNS API - Render Deployment Guide

## Overview
This API provides WHOIS, DNS, and SSL certificate information for domain analysis, with historical tracking stored in Supabase.

## Deployment Steps on Render

### 1. Prerequisites
- GitHub account with your code pushed
- Render account (free tier available)
- Supabase project with the following tables:
  - `domain_whois_history`
  - `domain_dns_history`
  - `domain_ssl_history`

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the `smartshield` repository
5. Render will automatically detect the `render.yaml` file
6. Set the root directory to `packages/ml`
7. Click "Apply"

#### Option B: Manual Setup
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `smartshield-whois-api`
   - **Region**: Oregon (or closest to your users)
   - **Branch**: `user-dashboard` (or your main branch)
   - **Root Directory**: `packages/ml`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:app`
   - **Plan**: Free

### 3. Environment Variables
Add these environment variables in Render dashboard (Environment tab):

```
SUPABASE_URL=https://jlgktijajxapqclgjyjx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**Important**: Use your Supabase **Service Role Key** (not the anon key) from:
- Supabase Dashboard → Project Settings → API → Service Role Key

### 4. Verify Deployment
Once deployed, your API will be available at:
```
https://smartshield-whois-api.onrender.com
```

Test the health endpoint:
```bash
curl https://smartshield-whois-api.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "whois-dns-api"
}
```

### 5. Update Frontend Configuration
Update the API URLs in your Next.js app:

**File**: `apps/web/src/app/dashboard/[userId]/page.tsx`

Replace:
```javascript
// OLD - Local development
const response = await fetch("http://localhost:5001/api/domain-info", {
```

With:
```javascript
// NEW - Production
const apiUrl = process.env.NEXT_PUBLIC_WHOIS_API_URL || "https://smartshield-whois-api.onrender.com";
const response = await fetch(`${apiUrl}/api/domain-info`, {
```

Add environment variable to `.env.local`:
```
NEXT_PUBLIC_WHOIS_API_URL=https://smartshield-whois-api.onrender.com
```

### 6. API Endpoints

#### Health Check
```
GET /health
```

#### Domain Information
```
POST /api/domain-info
Content-Type: application/json

{
  "url": "https://example.com"
}
```

Response:
```json
{
  "domain": "example.com",
  "whois": { ... },
  "dns": { ... },
  "ssl": { ... },
  "timestamp": "2025-11-25T12:00:00Z"
}
```

#### Domain History
```
POST /api/domain-history
Content-Type: application/json

{
  "url": "https://example.com"
}
```

Response:
```json
{
  "whois_history": [ ... ],
  "dns_history": [ ... ],
  "ssl_history": [ ... ],
  "whois_changes": [ ... ],
  "dns_changes": [ ... ]
}
```

## Performance Considerations

### Free Tier Limitations
- Render free tier spins down after 15 minutes of inactivity
- First request after sleep takes ~30-60 seconds (cold start)
- 750 hours/month free (enough for one service running 24/7)

### Optimization Tips
1. **Keep Warm**: Set up a cron job to ping `/health` every 10 minutes
2. **Upgrade Plan**: Consider Render's paid plan ($7/month) for:
   - No cold starts
   - Always-on service
   - More resources

### Example Keep-Warm Setup (Optional)
Use a service like [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com):
- URL: `https://smartshield-whois-api.onrender.com/health`
- Interval: Every 10 minutes
- Method: GET

## Monitoring & Debugging

### View Logs
1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Monitor real-time logs for requests and errors

### Common Issues

#### 1. Cold Start Timeouts
**Symptom**: 504 Gateway Timeout on first request
**Solution**: Wait 30-60 seconds and retry, or implement keep-warm ping

#### 2. WHOIS Lookup Failures
**Symptom**: Some domains return "WHOIS data not available"
**Cause**: Rate limiting or unsupported TLDs
**Solution**: Already handled with try/catch, returns partial data

#### 3. SSL Certificate Errors
**Symptom**: SSL errors for certain domains
**Solution**: Already handled with error catching, continues without SSL data

#### 4. Database Connection Errors
**Symptom**: Supabase API errors in logs
**Solution**: 
- Verify `SUPABASE_URL` is correct
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
- Check RLS policies allow service role access

## Security Notes

1. **Never commit** `.env` file with actual keys
2. **Use Service Role Key** for database operations (bypasses RLS)
3. **CORS** is enabled for all origins - restrict in production if needed:
   ```python
   CORS(app, origins=["https://your-domain.com"])
   ```

## Cost Estimate
- **Free Plan**: $0/month (with limitations)
- **Starter Plan**: $7/month (recommended for production)
  - No cold starts
  - Always-on
  - 512 MB RAM
  - Shared CPU

## Support
For issues related to:
- **Render Platform**: [Render Support](https://render.com/docs)
- **API Functionality**: Check application logs in Render dashboard
- **Database**: Verify Supabase connection and RLS policies
