# Railway Deployment Guide for SmartShield ML API

## Quick Deploy

1. **Connect Repository to Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository
   - Choose the `packages/ml` directory as root

2. **Set Environment Variables**
   In Railway dashboard, add these variables:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   DB_HOST=aws-0-region.pooler.supabase.com
   DB_NAME=postgres
   DB_USER=postgres.your-project-ref
   DB_PASSWORD=your_database_password
   DB_PORT=6543
   PORT=8000
   ```

3. **Deploy**
   Railway will automatically detect Python and deploy using the configuration files:
   - `runtime.txt` - Specifies Python 3.10.14
   - `Procfile` - Defines the start command
   - `nixpacks.toml` - Build configuration
   - `requirements.txt` - Python dependencies

## Configuration Files

### Procfile
Tells Railway how to start the application:
```
web: gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:app
```

### nixpacks.toml
Nixpacks build configuration for Python environment:
- Installs Python 3.10 and pip
- Upgrades pip
- Installs requirements

### railway.json
Railway platform-specific settings:
- Uses Nixpacks builder
- Auto-restart on failure
- Custom start command

## API Endpoints

Once deployed, your API will be available at: `https://your-app.railway.app`

### `/api/scan` (POST)
Scan a URL for phishing indicators
```json
{
  "url": "https://example.com"
}
```

### `/api/domain-info` (POST)
Get detailed WHOIS, DNS, and SSL information
```json
{
  "url": "https://example.com"
}
```

## Troubleshooting

### Build fails with "pip: not found"
- Verify `runtime.txt` exists with `python-3.10.14`
- Check `nixpacks.toml` includes pip in nixPkgs
- Ensure Railway is set to use Nixpacks builder

### Application crashes on startup
- Check Railway logs for Python errors
- Verify all environment variables are set
- Ensure Supabase credentials are correct

### Database connection errors
- Verify DB_HOST uses the pooler URL (ends with `pooler.supabase.com`)
- Check DB_PASSWORD is correct
- Ensure DB_PORT is 6543 for pooler or 5432 for direct connection

## Monitoring

View logs in Railway dashboard:
```bash
railway logs
```

## Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your credentials

4. Run locally:
   ```bash
   python whois_dns_api.py
   ```
   Or with Gunicorn:
   ```bash
   gunicorn --bind 0.0.0.0:8000 --workers 2 wsgi:app
   ```

## Support

For Railway-specific issues, check:
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
