"""
Data fetching functions for WHOIS, DNS, and SSL information
"""
import dns.resolver
import whois
import socket
import ssl
import OpenSSL
from utils import parse_ssl_date


def translate_ssl_error(error_str):
    """Translate technical SSL errors into human-readable messages"""
    error_lower = str(error_str).lower()
    
    # Handshake failure errors
    if 'handshake' in error_lower or 'sslv3_alert_handshake_failure' in error_lower:
        return 'Server rejected secure connection attempt - possible security mismatch or misconfiguration'
    
    # Certificate verification errors
    elif 'certificate verify failed' in error_lower or 'self signed' in error_lower:
        return 'SSL certificate could not be verified - may be expired, self-signed, or fraudulent'
    
    # Connection refused
    elif 'refused' in error_lower or 'connection reset' in error_lower:
        return 'Server closed the connection - may not support HTTPS'
    
    # Protocol errors
    elif 'sslv3_alert' in error_lower or 'tlsv1 alert' in error_lower or 'unexpected eof' in error_lower:
        return 'Server has TLS/SSL configuration problems - security protocol mismatch'
    
    # Timeout
    elif 'timeout' in error_lower:
        return 'Connection took too long - server may be slow or unreachable'
    
    # DNS errors
    elif 'gaierror' in error_lower or 'name or service not known' in error_lower:
        return 'Website server unreachable - cannot establish connection'
    
    # Default
    else:
        return f'Secure connection failed - {error_str}'


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
    """Get WHOIS information for a domain with timeout"""
    import threading
    
    whois_data_holder = {'data': None, 'error': None}
    
    def fetch_whois():
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
            
            whois_data_holder['data'] = whois_data
        except Exception as e:
            whois_data_holder['error'] = str(e)
    
    # Run WHOIS in a thread with 12-second timeout (to beat the 15-second API timeout)
    thread = threading.Thread(target=fetch_whois, daemon=True)
    thread.start()
    thread.join(timeout=12)
    
    if whois_data_holder['data'] is not None:
        return whois_data_holder['data']
    
    if whois_data_holder['error']:
        error_msg = whois_data_holder['error'].lower()
        if 'timeout' in error_msg or 'connection' in error_msg:
            return {'error': 'WHOIS service timeout - domain may use privacy protection', 'is_timeout': True}
        elif 'no match' in error_msg or 'not found' in error_msg:
            return {'error': 'Domain not registered or uses privacy protection', 'is_not_found': True}
        elif 'query rate' in error_msg or 'rate limit' in error_msg:
            return {'error': 'WHOIS service rate limited - try again later', 'is_rate_limited': True}
        return {'error': f'Could not retrieve WHOIS data - {whois_data_holder["error"]}'}
    
    # Thread is still running - timeout occurred
    return {'error': 'WHOIS lookup timeout - service responding slowly', 'is_timeout': True}


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
        return {'error': 'Website server unreachable - cannot verify connection', 'is_dns_error': True}
    except socket.error as e:
        error_msg = translate_ssl_error(str(e))
        if 'refused' in str(e).lower() or 'connection' in str(e).lower():
            return {'error': error_msg, 'is_connection_error': True}
        return {'error': error_msg}
    except ssl.SSLError as e:
        error_msg = translate_ssl_error(str(e))
        error_str = str(e).lower()
        
        if 'certificate verify failed' in error_str or 'self' in error_str:
            return {'error': error_msg, 'is_ssl_verify_error': True}
        elif 'handshake' in error_str or 'sslv3_alert' in error_str or 'tlsv1 alert' in error_str:
            return {'error': error_msg, 'is_ssl_config_error': True}
        else:
            return {'error': error_msg}
    except Exception as e:
        error_msg = translate_ssl_error(str(e))
        return {'error': error_msg}
