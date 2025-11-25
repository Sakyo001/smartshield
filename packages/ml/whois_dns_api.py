"""
WHOIS and DNS Lookup API
Provides domain information including WHOIS data and DNS records
Includes historical tracking for Relations tab
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import dns.resolver
import whois
import socket
from urllib.parse import urlparse
from datetime import datetime
import os
from dotenv import load_dotenv
import ssl
import OpenSSL
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Supabase configuration
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
        else:
            print(f"Supabase API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error making Supabase request: {e}")
        return None

def extract_domain(url):
    """Extract domain from URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        # Remove port if present
        domain = domain.split(':')[0]
        return domain
    except:
        return url

def get_dns_records(domain):
    """Get DNS records for a domain"""
    dns_data = {}
    
    try:
        # A Records (IPv4)
        try:
            a_records = dns.resolver.resolve(domain, 'A')
            dns_data['A'] = [str(r) for r in a_records]
        except:
            dns_data['A'] = []
        
        # AAAA Records (IPv6)
        try:
            aaaa_records = dns.resolver.resolve(domain, 'AAAA')
            dns_data['AAAA'] = [str(r) for r in aaaa_records]
        except:
            dns_data['AAAA'] = []
        
        # MX Records (Mail)
        try:
            mx_records = dns.resolver.resolve(domain, 'MX')
            dns_data['MX'] = [str(r) for r in mx_records]
        except:
            dns_data['MX'] = []
        
        # NS Records (Name Servers)
        try:
            ns_records = dns.resolver.resolve(domain, 'NS')
            dns_data['NS'] = [str(r) for r in ns_records]
        except:
            dns_data['NS'] = []
        
        # TXT Records
        try:
            txt_records = dns.resolver.resolve(domain, 'TXT')
            dns_data['TXT'] = [str(r).strip('"') for r in txt_records]
        except:
            dns_data['TXT'] = []
        
        # CNAME Records
        try:
            cname_records = dns.resolver.resolve(domain, 'CNAME')
            dns_data['CNAME'] = [str(r) for r in cname_records]
        except:
            dns_data['CNAME'] = []
            
    except Exception as e:
        dns_data['error'] = str(e)
    
    return dns_data

def get_whois_info(domain):
    """Get WHOIS information for a domain"""
    try:
        w = whois.whois(domain)
        
        # Convert to serializable format
        whois_data = {}
        
        # Handle dates
        if hasattr(w, 'creation_date'):
            if isinstance(w.creation_date, list):
                whois_data['creation_date'] = str(w.creation_date[0]) if w.creation_date else None
            else:
                whois_data['creation_date'] = str(w.creation_date) if w.creation_date else None
        
        if hasattr(w, 'expiration_date'):
            if isinstance(w.expiration_date, list):
                whois_data['expiration_date'] = str(w.expiration_date[0]) if w.expiration_date else None
            else:
                whois_data['expiration_date'] = str(w.expiration_date) if w.expiration_date else None
        
        if hasattr(w, 'updated_date'):
            if isinstance(w.updated_date, list):
                whois_data['updated_date'] = str(w.updated_date[0]) if w.updated_date else None
            else:
                whois_data['updated_date'] = str(w.updated_date) if w.updated_date else None
        
        # Add other fields
        fields = ['registrar', 'name_servers', 'status', 'emails', 'org', 'country']
        for field in fields:
            if hasattr(w, field):
                value = getattr(w, field)
                if isinstance(value, list):
                    whois_data[field] = [str(v) for v in value if v]
                else:
                    whois_data[field] = str(value) if value else None
        
        return whois_data
        
    except Exception as e:
        return {'error': str(e)}

def parse_ssl_date(date_str):
    """Parse SSL certificate date from ASN.1 format to ISO format"""
    try:
        # ASN.1 format: YYYYMMDDHHMMSSZ
        from datetime import datetime
        dt = datetime.strptime(date_str, '%Y%m%d%H%M%SZ')
        return dt.isoformat()
    except:
        return None

def get_ssl_info(domain):
    """Get SSL certificate information"""
    try:
        # Create SSL context
        context = ssl.create_default_context()
        
        # Connect to domain on port 443
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                # Get certificate
                cert_der = ssock.getpeercert(binary_form=True)
                cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_ASN1, cert_der)
                
                # Parse dates properly
                not_before = cert.get_notBefore().decode('utf-8')
                not_after = cert.get_notAfter().decode('utf-8')
                
                # Convert issuer and subject components to string keys
                issuer_dict = {}
                for key, value in cert.get_issuer().get_components():
                    issuer_dict[key.decode('utf-8')] = value.decode('utf-8')
                
                subject_dict = {}
                for key, value in cert.get_subject().get_components():
                    subject_dict[key.decode('utf-8')] = value.decode('utf-8')
                
                # Extract certificate information
                ssl_data = {
                    'issuer': issuer_dict,
                    'subject': subject_dict,
                    'version': cert.get_version(),
                    'serial_number': str(cert.get_serial_number()),
                    'not_before': parse_ssl_date(not_before),
                    'not_after': parse_ssl_date(not_after),
                    'signature_algorithm': cert.get_signature_algorithm().decode('utf-8'),
                }
                
                # Get Subject Alternative Names (SAN)
                san_list = []
                for i in range(cert.get_extension_count()):
                    ext = cert.get_extension(i)
                    if ext.get_short_name() == b'subjectAltName':
                        san_list = str(ext).split(', ')
                
                ssl_data['san_domains'] = san_list
                
                return ssl_data
                
    except Exception as e:
        return {'error': str(e)}

def save_whois_history(domain, whois_data):
    """Save WHOIS data to history table via Supabase API"""
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
    """Save DNS records to history table via Supabase API"""
    try:
        # Save each record type
        for record_type, records in dns_data.items():
            if record_type == 'error' or not records:
                continue
                
            for record_value in records:
                # Extract priority for MX records
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
    """Save SSL certificate to history table via Supabase API"""
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

@app.route('/api/domain-info', methods=['POST'])
def domain_info():
    """Get WHOIS, DNS, and SSL information for a domain"""
    try:
        data = request.get_json()
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Extract domain from URL
        domain = extract_domain(url)
        
        if not domain:
            return jsonify({'error': 'Invalid URL'}), 400
        
        print(f"Fetching info for domain: {domain}")
        
        # Get WHOIS, DNS, and SSL information
        try:
            whois_info = get_whois_info(domain)
            print(f"WHOIS info retrieved: {list(whois_info.keys())}")
        except Exception as e:
            print(f"Error getting WHOIS: {e}")
            whois_info = {'error': str(e)}
        
        try:
            dns_records = get_dns_records(domain)
            print(f"DNS records retrieved: {list(dns_records.keys())}")
        except Exception as e:
            print(f"Error getting DNS: {e}")
            dns_records = {'error': str(e)}
        
        try:
            ssl_info = get_ssl_info(domain)
            print(f"SSL info retrieved: {list(ssl_info.keys())}")
        except Exception as e:
            print(f"Error getting SSL: {e}")
            ssl_info = {'error': str(e)}
        
        # Save to history tables (non-blocking)
        try:
            save_whois_history(domain, whois_info)
            print("WHOIS history saved")
        except Exception as e:
            print(f"Error saving WHOIS history: {e}")
        
        try:
            save_dns_history(domain, dns_records)
            print("DNS history saved")
        except Exception as e:
            print(f"Error saving DNS history: {e}")
        
        try:
            save_ssl_history(domain, ssl_info)
            print("SSL history saved")
        except Exception as e:
            print(f"Error saving SSL history: {e}")
        
        return jsonify({
            'domain': domain,
            'whois': whois_info,
            'dns': dns_records,
            'ssl': ssl_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"ERROR in domain_info: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/domain-history', methods=['POST'])
def domain_history():
    """Get historical WHOIS, DNS, and SSL data for a domain via Supabase API"""
    try:
        data = request.get_json()
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        domain = extract_domain(url)
        
        if not domain:
            return jsonify({'error': 'Invalid URL'}), 400
        
        # Get WHOIS history
        whois_history = supabase_request('GET', 'domain_whois_history', 
            params={'domain': f'eq.{domain}', 'order': 'snapshot_date.desc', 'limit': 50}) or []
        
        # Get DNS history
        dns_history = supabase_request('GET', 'domain_dns_history',
            params={'domain': f'eq.{domain}', 'order': 'snapshot_date.desc', 'limit': 100}) or []
        
        # Get SSL history
        ssl_history = supabase_request('GET', 'domain_ssl_history',
            params={'domain': f'eq.{domain}', 'order': 'snapshot_date.desc', 'limit': 50}) or []
        
        # Detect changes in WHOIS
        whois_changes = []
        for i in range(len(whois_history) - 1):
            current = whois_history[i]
            previous = whois_history[i + 1]
            changes = {}
            
            for key in ['registrar', 'expiration_date', 'name_servers', 'status']:
                if current.get(key) != previous.get(key):
                    changes[key] = {
                        'from': previous.get(key),
                        'to': current.get(key),
                        'date': current['snapshot_date']
                    }
            
            if changes:
                whois_changes.append({
                    'date': current['snapshot_date'],
                    'changes': changes
                })
        
        # Detect changes in DNS - group by date
        dns_by_date = {}
        for record in dns_history:
            date_key = record['snapshot_date'][:10]  # Get date part only
            if date_key not in dns_by_date:
                dns_by_date[date_key] = {}
            record_type = record['record_type']
            if record_type not in dns_by_date[date_key]:
                dns_by_date[date_key][record_type] = []
            dns_by_date[date_key][record_type].append(record['record_value'])
        
        dns_changes = []
        dates = sorted(dns_by_date.keys(), reverse=True)
        for i in range(len(dates) - 1):
            current_date = dates[i]
            prev_date = dates[i + 1]
            current_records = dns_by_date[current_date]
            prev_records = dns_by_date[prev_date]
            
            changes = {}
            for record_type in set(list(current_records.keys()) + list(prev_records.keys())):
                current_vals = set(current_records.get(record_type, []))
                prev_vals = set(prev_records.get(record_type, []))
                
                if current_vals != prev_vals:
                    changes[record_type] = {
                        'added': list(current_vals - prev_vals),
                        'removed': list(prev_vals - current_vals),
                        'date': current_date
                    }
            
            if changes:
                dns_changes.append({
                    'date': current_date,
                    'changes': changes
                })
        
        return jsonify({
            'domain': domain,
            'whois_history': whois_history,
            'dns_history': dns_history,
            'ssl_history': ssl_history,
            'whois_changes': whois_changes,
            'dns_changes': dns_changes,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'whois-dns-api'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"🚀 Starting WHOIS & DNS Lookup API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
