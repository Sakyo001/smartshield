# 🚀 Railway Deployment - Environment Variables & Health Check

## ✅ Health Check Path

Your API health check endpoint is:

```
/health
```

**Full URL after deployment:**
```
https://your-app-name.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "whois-dns-api"
}
```

---

## 🔧 Environment Variables for Railway

### Required Variables

Copy and paste these into Railway Dashboard → Variables tab:

```bash
# Supabase Configuration
SUPABASE_URL=https://jlgktijajxapqclgjyjx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZ2t0aWphanhhcHFjbGdqeWp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAzNzk5MywiZXhwIjoyMDc4NjEzOTkzfQ.GEUApKbMLKCfMytNNdDQCJuxdpshNsZqKBZwyd1vZrQ

# Python Configuration
PYTHONUNBUFFERED=1

# PORT is automatically set by Railway - DO NOT ADD THIS MANUALLY
```

---

## 📝 Railway Dashboard Setup Steps

### 1. Add Environment Variables

In Railway Dashboard:

1. Click on your service
2. Go to **Variables** tab
3. Click **+ New Variable**
4. Add each variable above (name and value)
5. Click **Add** for each one

**Quick Copy-Paste Format:**

| Variable Name | Value |
|--------------|-------|
| `SUPABASE_URL` | `https://jlgktijajxapqclgjyjx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZ2t0aWphanhhcHFjbGdqeWp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAzNzk5MywiZXhwIjoyMDc4NjEzOTkzfQ.GEUApKbMLKCfMytNNdDQCJuxdpshNsZqKBZwyd1vZrQ` |
| `PYTHONUNBUFFERED` | `1` |

### 2. Configure Root Directory (IMPORTANT!)

1. Go to **Settings** tab
2. Scroll to **Service Settings**
3. Find **Root Directory** field
4. Enter: `packages/ml`
5. Click **Save**

### 3. Configure Health Check

1. Still in **Settings** tab
2. Find **Health Check** section
3. Set **Health Check Path**: `/health`
4. Set **Health Check Timeout**: `100` seconds
5. Click **Save**

### 4. Deploy

1. Railway will automatically redeploy after settings change
2. Or manually click **Deploy** → **Redeploy**

---

## 🧪 Testing After Deployment

### 1. Check Deployment Logs

In Railway Dashboard → **Deployments** → Click latest deployment → **View Logs**

Look for these success messages:
```
🚀 SmartShield WHOIS API Starting...
[INFO] Listening at: http://0.0.0.0:XXXX
```

### 2. Test Health Check

Replace `your-app-name` with your actual Railway app URL:

```bash
curl https://your-app-name.railway.app/health
```

**Expected:**
```json
{"status":"ok","service":"whois-dns-api"}
```

### 3. Test Scan Endpoint

```bash
curl -X POST https://your-app-name.railway.app/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

**Expected:** JSON response with `decision`, `confidence`, `risk_score`

### 4. Test Domain Info Endpoint

```bash
curl -X POST https://your-app-name.railway.app/api/domain-info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

**Expected:** JSON with `whois`, `dns`, `ssl` data

---

## 🔗 Update Extension After Deployment

Once Railway deployment succeeds, update your extension to use the new URL:

### 1. Get Your Railway URL

In Railway Dashboard, your app URL is shown at the top:
```
https://smartshield-production-xxxx.railway.app
```

### 2. Update Extension Config

Edit `apps/extension/src/config.js`:
```javascript
const CONFIG = {
  WHOIS_API_URL: 'https://your-app.railway.app', // ← Replace this
  // ... rest of config
};
```

### 3. Update Extension Background Script

Edit `apps/extension/src/background.js`:
```javascript
const WHOIS_API_URL = 'https://your-app.railway.app'; // ← Replace this
```

### 4. Rebuild Extension

```bash
cd apps/extension
# Load the extension in Chrome and test
```

---

## 🐛 Troubleshooting

### "$PORT is not a valid port number" Error

✅ **Fixed!** The app now uses `start.py` which properly handles the PORT variable.

If you still see this error:
1. Make sure you've pushed the latest code with `start.py`
2. Redeploy in Railway dashboard
3. Check logs for: "🚀 Starting SmartShield ML API" with proper PORT number

### Health Check Failing?

**Wait 30-60 seconds** - First deployment has cold start delay

**Check logs:**
```bash
# In Railway Dashboard
Deployments → Latest → View Logs
```

**Temporarily disable health check:**
1. Settings → Health Check → Toggle OFF
2. Test manually: `curl https://your-app.railway.app/health`
3. If works, re-enable health check

### 502 Bad Gateway?

- App is still starting (wait)
- Check logs for Python errors
- Verify environment variables are set

### App crashes on startup?

Check logs for:
- Missing environment variables
- Python import errors
- Port binding issues

**Verify all variables:**
```bash
# In Railway logs, you should see:
🚀 SmartShield WHOIS API Starting...
PORT: XXXX
```

If PORT shows "Not set", Railway hasn't injected it yet (refresh deployment).

---

## 📊 Monitoring

### View Live Logs
```
Railway Dashboard → Deployments → View Logs
```

### Check Resource Usage
```
Railway Dashboard → Metrics
```

### View Deployment History
```
Railway Dashboard → Deployments
```

---

## 🎯 Quick Reference

| Item | Value |
|------|-------|
| **Health Check Path** | `/health` |
| **Root Directory** | `packages/ml` |
| **Health Check Timeout** | `100` seconds |
| **Python Version** | `3.10.14` |
| **Port** | Auto-set by Railway |
| **Workers** | 1 (Gunicorn) |

---

## ✅ Checklist

- [ ] Added all environment variables in Railway
- [ ] Set Root Directory to `packages/ml`
- [ ] Configured health check path: `/health`
- [ ] Set health check timeout: 100 seconds
- [ ] Deployment succeeded (check logs)
- [ ] Health check passing (green checkmark)
- [ ] Tested `/health` endpoint manually
- [ ] Tested `/api/scan` endpoint
- [ ] Updated extension config with Railway URL
- [ ] Tested extension with new API URL
