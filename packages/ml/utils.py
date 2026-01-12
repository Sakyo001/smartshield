"""
Utility functions for domain parsing and data formatting
"""
from urllib.parse import urlparse
from datetime import datetime


def extract_domain(url):
    """Extract domain from URL"""
    try:
        if '?' in url:
            url = url.split('?')[0]
        if '#' in url:
            url = url.split('#')[0]
        
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        domain = domain.split(':')[0]
        domain = domain.strip().lstrip('/')
        return domain
    except:
        return url


def parse_ssl_date(date_str):
    """Parse SSL certificate date from ASN.1 format to ISO format"""
    try:
        # ASN.1 format: YYYYMMDDHHMMSSZ
        dt = datetime.strptime(date_str, '%Y%m%d%H%M%SZ')
        return dt.isoformat()
    except:
        return None
