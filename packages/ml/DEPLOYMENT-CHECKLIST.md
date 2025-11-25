# 🚀 Render Deployment Quick Start

## Step 1: Push Your Code
```bash
git add packages/ml/
git commit -m "Add Render deployment configuration"
git push origin user-dashboard
```

## Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

## Step 3: Deploy Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `Sakyo001/smartshield`
3. Configure:
   - **Name**: `smartshield-whois-api`
   - **Region**: Oregon (US West)
   - **Branch**: `user-dashboard`
   - **Root Directory**: `packages/ml`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:app`
   - **Plan**: Free

## Step 4: Add Environment Variables
In Render Dashboard → Environment:
```
SUPABASE_URL=https://jlgktijajxapqclgjyjx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

Get your Service Role Key from:
Supabase Dashboard → Settings → API → Service Role Key (secret)

## Step 5: Deploy
Click "Create Web Service" and wait 2-3 minutes for deployment.

## Step 6: Get Your API URL
After deployment, your URL will be:
```
https://smartshield-whois-api.onrender.com
```

## Step 7: Update Frontend
Create `apps/web/.env.local`:
```bash
NEXT_PUBLIC_WHOIS_API_URL=https://smartshield-whois-api.onrender.com
```

## Step 8: Test
```bash
# Test health endpoint
curl https://smartshield-whois-api.onrender.com/health

# Test domain info
curl -X POST https://smartshield-whois-api.onrender.com/api/domain-info \
  -H "Content-Type: application/json" \
  -d '{"url": "google.com"}'
```

## ⚠️ Important Notes

### Cold Starts (Free Tier)
- Service sleeps after 15 min of inactivity
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast

### Solutions:
1. **Keep Warm** (Free): Use UptimeRobot or cron-job.org to ping `/health` every 10 minutes
2. **Upgrade** ($7/month): No cold starts, always-on

### For Production
Consider upgrading to Starter plan for:
- ✅ No cold starts
- ✅ Always-on service
- ✅ Better performance
- ✅ 512 MB RAM

## 📊 Monitor Deployment
- **Logs**: Render Dashboard → Your Service → Logs
- **Status**: Dashboard shows deployment status
- **Errors**: Check logs for any issues

## 🔧 Troubleshooting

### "Service Unavailable" on first request
**Solution**: Wait 30-60 seconds for cold start, then retry

### "Internal Server Error"
**Solution**: Check logs in Render dashboard for Python errors

### WHOIS/DNS failures
**Solution**: Normal for some domains, API returns partial data

### Supabase connection errors
**Solution**: Verify Service Role Key is correct (not anon key)

## Next Steps
1. Deploy your Next.js app to Vercel
2. Set `NEXT_PUBLIC_WHOIS_API_URL` in Vercel environment variables
3. Test end-to-end functionality

## Support
- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
