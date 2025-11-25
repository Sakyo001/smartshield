# Historical Data Tracking Setup

This guide explains how to set up the historical tracking feature for the Relations tab.

## What is Historical Tracking?

The Relations tab shows how a domain's information changes over time:
- **WHOIS Changes**: Track registrar changes, expiration date updates, name server modifications
- **DNS Changes**: Monitor when DNS records are added, removed, or modified
- **SSL Certificate History**: Keep records of SSL certificate renewals and changes

## Database Setup

### 1. Run the SQL Migration

Execute the SQL script to create the necessary tables:

```bash
# Using psql
psql -U postgres -d smartshield -f database_setup.sql

# Or connect to your Supabase database and run the SQL directly
```

The script creates three tables:
- `domain_whois_history`: Stores WHOIS snapshots
- `domain_dns_history`: Stores DNS record snapshots
- `domain_ssl_history`: Stores SSL certificate snapshots

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your database credentials:

```env
DB_HOST=db.your-supabase-project.supabase.co
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_PORT=5432
```

For Supabase:
- Go to Project Settings → Database
- Copy the connection string details
- The port is usually `5432` or `6543` (for connection pooling)

## Installation

### 1. Install Python Dependencies

```bash
# Install all required packages
pip install -r requirements-complete.txt

# Or install individually
pip install flask flask-cors dnspython python-whois psycopg2-binary python-dotenv cryptography pyOpenSSL
```

### 2. Start the API Server

```bash
python whois_dns_api.py
```

The server will start on `http://localhost:5001`

## How It Works

### Automatic Data Collection

When a user scans a URL:
1. The frontend calls `/api/domain-info` with the URL
2. The API fetches current WHOIS, DNS, and SSL information
3. The data is **automatically saved** to history tables
4. Current data is returned to display in the Details tab

### Viewing Historical Data

When a user clicks the Relations tab:
1. Click "Load Historical Data" button
2. Frontend calls `/api/domain-history` 
3. API queries history tables and detects changes
4. Returns timeline of all changes with before/after comparisons

### Change Detection

The API automatically detects:
- **WHOIS Changes**: Compares consecutive snapshots for field differences
- **DNS Changes**: Identifies added and removed records by type
- **SSL Changes**: Shows certificate renewals with date ranges

## API Endpoints

### POST /api/domain-info
Get current domain information and save to history.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "domain": "example.com",
  "whois": {...},
  "dns": {...},
  "ssl": {...},
  "timestamp": "2025-11-25T..."
}
```

### POST /api/domain-history
Get historical changes for a domain.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "domain": "example.com",
  "whois_changes": [
    {
      "date": "2025-11-20T...",
      "changes": {
        "registrar": {
          "from": "OldRegistrar",
          "to": "NewRegistrar"
        }
      }
    }
  ],
  "dns_changes": [...],
  "ssl_history": [...],
  "timestamp": "2025-11-25T..."
}
```

## Testing

### 1. Scan a Domain Multiple Times

Scan the same domain multiple times with changes in between to test:

```bash
# First scan
curl -X POST http://localhost:5001/api/domain-info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'

# Wait a day or make DNS changes

# Second scan
curl -X POST http://localhost:5001/api/domain-info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

### 2. View History

```bash
curl -X POST http://localhost:5001/api/domain-history \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

## Troubleshooting

### Database Connection Issues

**Error:** `could not connect to server: Connection refused`

**Solution:**
- Check database credentials in `.env`
- Ensure database server is running
- For Supabase, verify project is not paused
- Check firewall rules allow connection on port 5432/6543

### SSL Certificate Errors

**Error:** `[SSL: CERTIFICATE_VERIFY_FAILED]`

**Solution:**
- This is normal for some domains with invalid certificates
- The error is caught and logged, scan continues
- SSL data will show `{"error": "..."}` for that domain

### Empty Relations Tab

**Reason:** No historical data yet

**Solution:**
- Historical data is built over time with repeated scans
- Scan the same domain multiple times
- Wait for domain to have actual changes (registrar, DNS, SSL renewals)

## Data Retention

By default, the system stores:
- Last 50 WHOIS snapshots per domain
- Last 100 DNS record changes per domain  
- Last 50 SSL certificates per domain

To adjust limits, modify the LIMIT clauses in `/api/domain-history` endpoint.

## Production Considerations

1. **Scheduled Scanning**: Set up cron jobs to periodically scan important domains
2. **Data Cleanup**: Implement cleanup jobs for old historical data
3. **Performance**: Add indexes on frequently queried columns
4. **Monitoring**: Track API response times and database size

## Architecture

```
User Scans URL
     ↓
Frontend → /api/domain-info
     ↓
Python API:
  - Fetch WHOIS
  - Fetch DNS
  - Fetch SSL
  - Save to DB
     ↓
Return Data → Display in Details Tab
     ↓
User Clicks Relations Tab
     ↓
Frontend → /api/domain-history
     ↓
Python API:
  - Query history tables
  - Detect changes
  - Build timeline
     ↓
Return Changes → Display Timeline
```

## Support

For issues or questions:
1. Check logs: `python whois_dns_api.py` output
2. Verify database connection: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME`
3. Test endpoints: Use curl or Postman
4. Check database tables: Ensure tables were created successfully
