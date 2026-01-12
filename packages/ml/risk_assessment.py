"""
Risk assessment and analysis functions
"""
import re
from datetime import datetime


def apply_deterministic_rules(url, domain):
    """
    Layer 1: Deterministic phishing detection rules
    Returns: (risk_increase, flags)
    """
    risk_increase = 0
    flags = []
    
    # IP-based URL
    if re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', domain):
        risk_increase += 40
        flags.append('IP-based URL (high risk)')
    
    # No HTTPS
    if not url.startswith('https://'):
        risk_increase += 15
        flags.append('No HTTPS encryption')
    
    # Suspicious TLDs
    suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.click']
    if any(domain.endswith(tld) for tld in suspicious_tlds):
        risk_increase += 25
        flags.append('Suspicious TLD (common in phishing)')
    
    # Excessive subdomains
    subdomain_count = domain.count('.')
    if subdomain_count > 3:
        risk_increase += 20
        flags.append(f'Excessive subdomains ({subdomain_count} levels)')
    
    # URL encoding or deep paths
    if '%' in url or url.count('/') > 5:
        risk_increase += 10
        flags.append('Suspicious URL path structure')
    
    # Phishing path keywords
    phishing_paths = ['deliver', 'verify', 'update', 'confirm', 'validate', 'secure', 
                      'account', 'suspended', 'restore', 'recovery', 'billing', 'payment']
    path_lower = url.split('?')[0].lower()
    found_paths = [p for p in phishing_paths if f'/{p}/' in path_lower or path_lower.endswith(f'/{p}')]
    if found_paths:
        risk_increase += 15
        flags.append(f'Suspicious path: /{found_paths[0]}/')
    
    # Phishing keywords in URL
    phishing_keywords = ['verify', 'account', 'suspended', 'login', 'update', 'confirm', 
                         'secure', 'webscr', 'billing', 'banking', 'signin', 'paypal']
    found_keywords = [kw for kw in phishing_keywords if kw in url.lower()]
    if found_keywords:
        risk_increase += len(found_keywords) * 5
        flags.append(f'Phishing keywords: {", ".join(found_keywords[:3])}')
    
    # Random tokens in path
    if '/' in url:
        for segment in url.split('/')[3:]:
            if len(segment) > 4:
                main_part = segment.split('.')[0]
                has_mixed = (any(c.isdigit() for c in main_part) and 
                           any(c.isupper() for c in main_part) and 
                           any(c.islower() for c in main_part) and 
                           len(main_part) >= 5)
                if has_mixed:
                    risk_increase += 12
                    flags.append(f'Random token in path: {main_part}')
                    break
    
    # Short suspicious filenames
    if '/' in url:
        last_segment = url.split('/')[-1].split('?')[0]
        if '.' in last_segment:
            filename = last_segment.split('.')[0]
            if len(filename) <= 2 and filename.isalpha():
                risk_increase += 10
                flags.append(f'Suspicious short filename: {last_segment}')
    
    # URL shorteners
    shortener_domains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd']
    if any(shortener in domain for shortener in shortener_domains):
        risk_increase += 15
        flags.append('URL shortener (destination hidden)')
    
    return risk_increase, flags


def calculate_contextual_risk_adjustment(whois_info, dns_records, ssl_info):
    """
    Layer 3: Contextual risk adjustment based on domain signals
    Returns: (risk_reduction, positive_factors, indicators)
    """
    positive_factors = 0
    risk_reduction = 0
    indicators = []
    
    print(f"=== RISK ADJUSTMENT ANALYSIS ===")
    print(f"WHOIS: {list(whois_info.keys()) if whois_info else 'None'}")
    print(f"DNS: {list(dns_records.keys()) if dns_records else 'None'}")
    print(f"SSL: {list(ssl_info.keys()) if ssl_info else 'None'}")
    
    # WHOIS Analysis
    if whois_info and not whois_info.get('error'):
        if whois_info.get('registrar'):
            positive_factors += 1
            risk_reduction += 5
            indicators.append('Registered Domain')
        
        # Domain age
        creation_date = whois_info.get('creation_date')
        if creation_date:
            try:
                created = datetime.strptime(str(creation_date)[:10], '%Y-%m-%d')
                age_years = (datetime.now() - created).days / 365
                
                if age_years > 5:
                    positive_factors += 3
                    risk_reduction += 20
                    indicators.append(f'Highly Established Domain ({int(age_years)} years)')
                elif age_years > 3:
                    positive_factors += 2
                    risk_reduction += 15
                    indicators.append(f'Established Domain ({int(age_years)} years)')
                elif age_years > 1:
                    positive_factors += 1
                    risk_reduction += 8
                    indicators.append(f'Moderate Age Domain ({int(age_years)} years)')
                elif age_years < 0.02:  # < 7 days
                    risk_reduction -= 10
                    indicators.append('VERY NEW DOMAIN (High Risk)')
                elif age_years < 0.08:  # < 30 days
                    risk_reduction -= 5
                    indicators.append('New Domain (Risk Factor)')
            except:
                pass
    else:
        risk_reduction -= 100
        indicators.append('🚨 WHOIS Information Unavailable (CRITICAL)')
        positive_factors = 0
        print("WHOIS: CRITICAL - UNAVAILABLE")
    
    # DNS Analysis
    if dns_records and not dns_records.get('error'):
        if dns_records.get('A', []):
            positive_factors += 1
            risk_reduction += 5
            indicators.append('Valid DNS A Records')
        
        if dns_records.get('MX', []):
            positive_factors += 1
            risk_reduction += 8
            indicators.append('Email Infrastructure Configured')
        
        if len(dns_records.get('NS', [])) >= 2:
            positive_factors += 1
            risk_reduction += 5
            indicators.append('Multiple Name Servers')
    else:
        risk_reduction -= 100
        indicators.append('🚨 DNS Records Unavailable (CRITICAL)')
        positive_factors = 0
        print("DNS: CRITICAL - UNAVAILABLE")
    
    # SSL Analysis
    if ssl_info and ssl_info.get('error'):
        risk_reduction -= 100
        indicators.append('🚨 SSL Certificate Missing/Invalid (CRITICAL)')
        positive_factors = 0
        print(f"SSL: CRITICAL - {ssl_info.get('error')}")
    elif ssl_info and ssl_info.get('issuer'):
        positive_factors += 2
        risk_reduction += 12
        indicators.append('Valid SSL Certificate')
        
        # Trusted CA check
        issuer_org = ssl_info.get('issuer', {}).get('O', '').lower()
        trusted_cas = ['digicert', "let's encrypt", 'sectigo', 'godaddy', 'amazon']
        if any(ca in issuer_org for ca in trusted_cas):
            positive_factors += 1
            risk_reduction += 8
            indicators.append('Trusted Certificate Authority')
        print("SSL: OK")
    
    print(f"Final: risk_reduction={risk_reduction}, positive_factors={positive_factors}")
    print("=== END ANALYSIS ===")
    
    return risk_reduction, positive_factors, indicators
