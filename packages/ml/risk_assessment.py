"""
Risk assessment and analysis functions
"""
import re
from datetime import datetime
from third_party_apis import BrandVerificationService

# Initialize brand verification service
brand_service = BrandVerificationService()


def apply_deterministic_rules(url, domain):
    """
    Layer 1: Deterministic phishing detection rules
    Uses REAL-TIME third-party verification APIs (NOT hardcoded)
    Returns: (risk_increase, flags)
    """
    risk_increase = 0
    flags = []
    
    # LAYER 0: PhishTank/URLhaus verification - DEFINITIVE SOURCE
    # If PhishTank confirms it's phishing, that's 100% certain (2.2M+ verified URLs)
    is_known_threat, threat_info = brand_service.check_phishing_databases(url)
    if is_known_threat:
        # PhishTank confirmation is DEFINITIVE - force 100% risk
        # This overrides all other checks because PhishTank is crowdsourced and verified
        risk_increase = 100  # Force 100% risk - this is confirmed phishing
        flags.append(f"🚨 {threat_info}")
        print(f"🚨 DEFINITIVE: PhishTank/URLhaus confirmed phishing - forcing 100% risk")
        return risk_increase, flags
    
    # IP-based URL
    if re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', domain):
        risk_increase += 40
        flags.append('IP-based URL (high risk)')
    
    # HTTP (insecure) - Higher risk
    if url.startswith('http://'):
        risk_increase += 30
        flags.append('Using HTTP (insecure protocol)')
    
    # No HTTPS
    elif not url.startswith('https://'):
        risk_increase += 15
        flags.append('No HTTPS encryption')
    
    # REAL-TIME: Verify brand ownership using third-party APIs
    is_legit_domain, legit_domain = brand_service.verify_brand_ownership(url, domain)
    
    if not is_legit_domain and legit_domain != "unknown":
        risk_increase += 35
        brand_name = legit_domain.split('.')[0].title()
        flags.append(f'Deceptive Naming: Impersonating {brand_name} (legitimate: {legit_domain})')
    
    # Untrusted & Suspicious TLDs (expanded list)
    untrusted_tlds = [
        '.tk', '.ml', '.ga', '.cf', '.gq',  # Free TLDs heavily abused
        '.xyz', '.top', '.work', '.click', '.link', '.download', '.stream',  # Cheap TLDs
        '.win', '.bid', '.loan', '.trade', '.racing', '.party',  # Known phishing TLDs
        '.science', '.date', '.faith', '.cricket', '.accountant', '.review',
        '.country', '.kim', '.men', '.webcam'
    ]
    if any(domain.endswith(tld) for tld in untrusted_tlds):
        risk_increase += 25
        flags.append('Untrusted TLD (commonly used in phishing)')
    
    # Encoding & Obfuscation (expanded detection)
    # Check for Unicode homoglyphs, multiple encodings, unusual characters
    if '%' in url:
        encoded_count = url.count('%')
        if encoded_count > 3:
            risk_increase += 20
            flags.append(f'Heavy URL encoding ({encoded_count} encoded characters)')
        else:
            risk_increase += 10
            flags.append('URL encoding detected')
    
    # Detect punycode (internationalized domain names used for homograph attacks)
    if domain.startswith('xn--'):
        risk_increase += 30
        flags.append('Punycode domain (potential homograph attack)')
    
    # Multiple @ symbols or unusual characters
    if url.count('@') > 0:
        risk_increase += 25
        flags.append('@ symbol in URL (credential phishing)')
    
    # Excessive hyphens (typosquatting)
    if domain.count('-') > 2:
        risk_increase += 15
        flags.append(f'Excessive hyphens in domain ({domain.count("-")} hyphens)')
    
    # Deep paths (potential redirection hiding)
    path_depth = url.count('/') - 2  # Subtract protocol slashes
    if path_depth > 5:
        risk_increase += 12
        flags.append(f'Deep URL path structure ({path_depth} levels)')
    
    # Excessive subdomains
    subdomain_count = domain.count('.')
    if subdomain_count > 3:
        risk_increase += 20
        flags.append(f'Excessive subdomains ({subdomain_count} levels)')
    
    # Redirection & Navigation Indicators
    redirect_params = ['redirect', 'url', 'next', 'return', 'goto', 'continue', 'forward', 'redir']
    for param in redirect_params:
        if f'{param}=' in url.lower() or f'{param}%' in url.lower():
            risk_increase += 18
            flags.append('Redirection parameter detected (open redirect risk)')
            break
    
    # Phishing path keywords with urgency
    phishing_paths = ['deliver', 'verify', 'update', 'confirm', 'validate', 'secure', 
                      'account', 'suspended', 'restore', 'recovery', 'billing', 'payment',
                      'urgent', 'action', 'required', 'expire', 'limited']
    path_lower = url.split('?')[0].lower()
    found_paths = [p for p in phishing_paths if f'/{p}/' in path_lower or path_lower.endswith(f'/{p}')]
    if found_paths:
        risk_increase += 15
        flags.append(f'Suspicious path: /{found_paths[0]}/')
    
    # Content & Language Signals - Urgency Keywords
    urgency_keywords = [
        'verify now', 'act now', 'urgent', 'suspended', 'expire', 'limited time',
        'confirm immediately', 'action required', 'account locked', 'security alert',
        'unusual activity', 'verify identity', 'click here now', 'last chance',
        'final notice', 'update payment', 'payment failed', 're-activate'
    ]
    found_urgency = [kw for kw in urgency_keywords if kw in url.lower()]
    if found_urgency:
        risk_increase += 25
        flags.append(f'Urgency keywords: {", ".join(found_urgency[:2])}')
    
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
    
    # REAL-TIME: Analyze HTML content of the actual page
    print(f"🔍 Performing real-time content analysis...")
    html_analysis = brand_service.analyze_html_content(url)
    risk_increase += html_analysis['phishing_score']
    flags.extend(html_analysis['findings'])
    
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
        # Any SSL error is critical - no secure connection available
        risk_reduction -= 100
        ssl_error_msg = ssl_info.get('error', 'Unknown error')
        
        # Check if it's a timeout/connection issue (no SSL at all)
        if ssl_info.get('is_timeout') or ssl_info.get('is_connection_error') or ssl_info.get('is_dns_error'):
            indicators.append('🚨 No SSL Certificate - Connection Failed (CRITICAL)')
            print(f"SSL: CRITICAL - No SSL available - {ssl_error_msg}")
        elif ssl_info.get('is_ssl_verify_error'):
            indicators.append('🚨 Invalid SSL Certificate - Verification Failed (CRITICAL)')
            print(f"SSL: CRITICAL - Invalid certificate - {ssl_error_msg}")
        elif ssl_info.get('is_ssl_config_error'):
            indicators.append('🚨 SSL Configuration Error (CRITICAL)')
            print(f"SSL: CRITICAL - Config error - {ssl_error_msg}")
        else:
            indicators.append('🚨 SSL Certificate Missing/Invalid (CRITICAL)')
            print(f"SSL: CRITICAL - {ssl_error_msg}")
        
        positive_factors = 0
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
    else:
        # No SSL info at all
        risk_reduction -= 100
        indicators.append('🚨 No SSL Certificate Information (CRITICAL)')
        positive_factors = 0
        print("SSL: CRITICAL - No SSL data")
    
    print(f"Final: risk_reduction={risk_reduction}, positive_factors={positive_factors}")
    print("=== END ANALYSIS ===")
    
    return risk_reduction, positive_factors, indicators
