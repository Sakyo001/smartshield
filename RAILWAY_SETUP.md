# Deploy SmartShield ML API to Railway (Monorepo)

Since this is a monorepo with multiple services, Railway needs to be configured to deploy ONLY the Python API from the `packages/ml` directory.

## Option 1: Set Root Directory in Railway (RECOMMENDED)

This is the simplest approach:

1. **Create a new service in Railway**
   - Go to [Railway](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `smartshield` repository

2. **Configure the service**
   - After Railway creates the service, go to **Settings**
   - Scroll to **Service Settings**
   - Find **Root Directory** field
   - Enter: `packages/ml`
   - Click **Save**

3. **Set Environment Variables**
   Click on "Variables" tab and add:
   ```
   SUPABASE_URL=https://jlgktijajxapqclgjyjx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DB_HOST=your_db_host.pooler.supabase.com
   DB_NAME=postgres
   DB_USER=postgres.your_project_ref
   DB_PASSWORD=your_db_password
   DB_PORT=6543
   PORT=8000
   ```

4. **Redeploy**
   - Railway will now detect the Python app in `packages/ml`
   - It will use the `runtime.txt`, `Procfile`, and `nixpacks.toml` from that directory
   - Build should succeed!

## Option 2: Use Dockerfile (Alternative)

If Option 1 doesn't work, use a Dockerfile at the root:

Create `Dockerfile` in the root directory:

```dockerfile
# Use Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy ML package files
COPY packages/ml /app

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8000

# Start gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "wsgi:app"]
```

Then in Railway:
- Settings → Builder: **Dockerfile**
- It will automatically use the Dockerfile

## Option 3: Separate Repository

Create a separate repository for just the Python API:

1. Create a new repo called `smartshield-api`
2. Copy everything from `packages/ml` to the root
3. Deploy that repository to Railway
4. Update the extension's API URL

## Troubleshooting

### "pip: not found" error
- Railway is detecting this as a Node.js project
- **Solution**: Set Root Directory to `packages/ml` (Option 1)

### Build succeeds but app doesn't start
- Check Railway logs for Python errors
- Verify all environment variables are set
- Ensure `wsgi.py` exists in `packages/ml`

### Port binding error
- Railway automatically sets `PORT` environment variable
- Gunicorn binds to `$PORT` automatically
- Don't hardcode the port

## Verify Deployment

Once deployed, test the API:

```bash
curl https://your-app.railway.app/health
# Should return: {"status":"ok","service":"whois-dns-api"}

curl -X POST https://your-app.railway.app/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

## Update Extension After Deploy

After deploying, update the extension's API URL:

1. Edit `apps/extension/src/config.js`:
   ```javascript
   WHOIS_API_URL: 'https://your-app.railway.app'
   ```

2. Edit `apps/extension/src/background.js`:
   ```javascript
   const WHOIS_API_URL = 'https://your-app.railway.app';
   ```

3. Rebuild the extension
