"""
Database operations for Supabase history tracking
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://jlgktijajxapqclgjyjx.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')


def supabase_request(method, endpoint, data=None, params=None):
    """Make a request to Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    try:
        if method == 'POST':
            response = requests.post(url, json=data, headers=headers)
        elif method == 'GET':
            response = requests.get(url, params=params, headers=headers)
        else:
            return None
        
        if response.status_code in [200, 201]:
            return response.json()
        print(f"Supabase API error: {response.status_code} - {response.text}")
        return None
    except Exception as e:
        print(f"Error making Supabase request: {e}")
        return None


def save_whois_history(domain, whois_data):
    """Save WHOIS data to history table"""
    try:
        if 'error' in whois_data:
            return
        
        emails = whois_data.get('emails', [])
        data = {
            'domain': domain,
            'registrar': whois_data.get('registrar'),
            'creation_date': whois_data.get('creation_date'),
            'expiration_date': whois_data.get('expiration_date'),
            'updated_date': whois_data.get('updated_date'),
            'name_servers': whois_data.get('name_servers', []),
            'status': whois_data.get('status', []),
            'registrant_org': whois_data.get('org'),
            'registrant_country': whois_data.get('country'),
            'registrant_email': emails[0] if len(emails) > 0 else None,
            'admin_email': emails[1] if len(emails) > 1 else None,
            'tech_email': emails[2] if len(emails) > 2 else None
        }
        supabase_request('POST', 'domain_whois_history', data)
    except Exception as e:
        print(f"Error saving WHOIS history: {e}")


def save_dns_history(domain, dns_data):
    """Save DNS records to history table"""
    try:
        for record_type, records in dns_data.items():
            if record_type == 'error' or not records:
                continue
            
            for record_value in records:
                priority = None
                if record_type == 'MX':
                    parts = str(record_value).split()
                    if len(parts) >= 2:
                        try:
                            priority = int(parts[0])
                            record_value = ' '.join(parts[1:])
                        except:
                            pass
                
                data = {
                    'domain': domain,
                    'record_type': record_type,
                    'record_value': str(record_value),
                    'priority': priority
                }
                supabase_request('POST', 'domain_dns_history', data)
    except Exception as e:
        print(f"Error saving DNS history: {e}")


def save_ssl_history(domain, ssl_data):
    """Save SSL certificate to history table"""
    try:
        if 'error' in ssl_data:
            return
        
        data = {
            'domain': domain,
            'issuer': str(ssl_data.get('issuer', {})),
            'subject': str(ssl_data.get('subject', {})),
            'valid_from': ssl_data.get('not_before'),
            'valid_until': ssl_data.get('not_after'),
            'serial_number': ssl_data.get('serial_number'),
            'signature_algorithm': ssl_data.get('signature_algorithm'),
            'san_domains': ssl_data.get('san_domains', [])
        }
        supabase_request('POST', 'domain_ssl_history', data)
    except Exception as e:
        print(f"Error saving SSL history: {e}")
