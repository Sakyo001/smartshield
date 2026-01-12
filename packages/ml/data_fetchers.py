"""
Data fetching functions for WHOIS, DNS, and SSL information
"""
import dns.resolver
import whois
import socket
import ssl
import OpenSSL
from utils import parse_ssl_date


def get_dns_records(domain):
    """Get DNS records for a domain"""
    dns_data = {}
    record_types = {
        'A': [],
        'AAAA': [],
        'MX': [],
        'NS': [],
        'TXT': [],
        'CNAME': []
    }
    
    try:
        for record_type in record_types.keys():
            try:
                if record_type == 'TXT':
                    records = dns.resolver.resolve(domain, record_type)
                    dns_data[record_type] = [str(r).strip('"') for r in records]
                else:
                    records = dns.resolver.resolve(domain, record_type)
                    dns_data[record_type] = [str(r) for r in records]
            except:
                dns_data[record_type] = []
    except Exception as e:
        dns_data['error'] = str(e)
    
    return dns_data


def get_whois_info(domain):
    """Get WHOIS information for a domain"""
    try:
        w = whois.whois(domain)
        whois_data = {}
        
        # Handle dates
        date_fields = ['creation_date', 'expiration_date', 'updated_date']
        for field in date_fields:
            if hasattr(w, field):
                value = getattr(w, field)
                if isinstance(value, list):
                    whois_data[field] = str(value[0]) if value else None
                else:
                    whois_data[field] = str(value) if value else None
        
        # Handle other fields
        for field in ['registrar', 'name_servers', 'status', 'emails', 'org', 'country']:
            if hasattr(w, field):
                value = getattr(w, field)
                if isinstance(value, list):
                    whois_data[field] = [str(v) for v in value if v]
                else:
                    whois_data[field] = str(value) if value else None
        
        return whois_data
    except Exception as e:
        error_msg = str(e).lower()
        if 'timeout' in error_msg or 'connection' in error_msg:
            return {'error': 'WHOIS service timeout - domain may use privacy protection', 'is_timeout': True}
        elif 'no match' in error_msg or 'not found' in error_msg:
            return {'error': 'Domain not registered or uses privacy protection', 'is_not_found': True}
        elif 'query rate' in error_msg or 'rate limit' in error_msg:
            return {'error': 'WHOIS service rate limited - try again later', 'is_rate_limited': True}
        return {'error': f'Could not retrieve WHOIS data - {str(e)}'}


def get_ssl_info(domain):
    """Get SSL certificate information"""
    try:
        context = ssl.create_default_context()
        context.check_hostname = True
        context.verify_mode = ssl.CERT_REQUIRED
        
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert_der = ssock.getpeercert(binary_form=True)
                if not cert_der:
                    return {'error': 'No SSL certificate found on server'}
                
                cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_ASN1, cert_der)
                
                # Parse certificate details
                issuer_dict = {
                    key.decode('utf-8'): value.decode('utf-8')
                    for key, value in cert.get_issuer().get_components()
                }
                subject_dict = {
                    key.decode('utf-8'): value.decode('utf-8')
                    for key, value in cert.get_subject().get_components()
                }
                
                # Get SAN domains
                san_list = []
                for i in range(cert.get_extension_count()):
                    ext = cert.get_extension(i)
                    if ext.get_short_name() == b'subjectAltName':
                        san_list = str(ext).split(', ')
                
                return {
                    'issuer': issuer_dict,
                    'subject': subject_dict,
                    'version': cert.get_version(),
                    'serial_number': str(cert.get_serial_number()),
                    'not_before': parse_ssl_date(cert.get_notBefore().decode('utf-8')),
                    'not_after': parse_ssl_date(cert.get_notAfter().decode('utf-8')),
                    'signature_algorithm': cert.get_signature_algorithm().decode('utf-8'),
                    'san_domains': san_list
                }
    except socket.timeout:
        return {'error': 'SSL connection timeout - server may be unreachable', 'is_timeout': True}
    except socket.gaierror:
        return {'error': 'Domain could not be resolved', 'is_dns_error': True}
    except socket.error as e:
        if 'refused' in str(e).lower() or 'connection' in str(e).lower():
            return {'error': 'SSL port (443) not open', 'is_connection_error': True}
        return {'error': f'Connection error: {str(e)}'}
    except ssl.SSLError as e:
        if 'certificate verify failed' in str(e).lower():
            return {'error': 'SSL certificate verification failed (expired or invalid)', 'is_ssl_verify_error': True}
        elif 'unexpected eof' in str(e).lower() or 'tlsv1 alert' in str(e).lower():
            return {'error': 'Server TLS configuration issue', 'is_ssl_config_error': True}
        return {'error': f'SSL error: {str(e)}'}
    except Exception as e:
        return {'error': f'Could not retrieve SSL certificate - {str(e)}'}
