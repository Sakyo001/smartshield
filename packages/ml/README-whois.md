# WHOIS & DNS Lookup API

This service provides WHOIS and DNS record information for domains.

## Installation

```bash
pip install -r requirements-whois.txt
```

## Running the Service

```bash
python whois_dns_api.py
```

The API will start on `http://localhost:5001`

## API Endpoints

### POST /api/domain-info
Get WHOIS and DNS information for a domain

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
  "whois": {
    "creation_date": "1995-08-14 04:00:00",
    "expiration_date": "2024-08-13 04:00:00",
    "updated_date": "2023-08-14 07:01:44",
    "registrar": "IANA",
    "name_servers": ["A.IANA-SERVERS.NET", "B.IANA-SERVERS.NET"],
    "status": ["clientTransferProhibited"],
    "org": "Internet Assigned Numbers Authority",
    "country": "US"
  },
  "dns": {
    "A": ["93.184.216.34"],
    "AAAA": ["2606:2800:220:1:248:1893:25c8:1946"],
    "MX": [],
    "NS": ["a.iana-servers.net.", "b.iana-servers.net."],
    "TXT": ["v=spf1 -all"],
    "CNAME": []
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "whois-dns-api"
}
```
