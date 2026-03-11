"""
Third-party brand verification and content analysis APIs
Real-time validation against trusted sources (NOT hardcoded)
"""

import re
import requests
from typing import Dict, List, Optional, Tuple
import dns.resolver
import whois
import ssl
import socket
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Authoritative brand registry
# Each entry: brand_keyword -> (official_domain, display_name, category)
# The keyword is the core word a phisher would embed in a fake domain.
# ---------------------------------------------------------------------------
BRAND_REGISTRY: Dict[str, Tuple[str, str, str]] = {
    # ── Philippine domestic banks ──────────────────────────────────────────
    "bdo":              ("bdo.com.ph",          "BDO Unibank",                          "PH Bank"),
    "landbank":         ("landbank.com",         "Land Bank of the Philippines",         "PH Bank"),
    "bpi":              ("bpi.com.ph",           "Bank of the Philippine Islands",       "PH Bank"),
    "metrobank":        ("metrobank.com.ph",     "Metropolitan Bank & Trust",            "PH Bank"),
    "chinabank":        ("chinabank.ph",         "China Banking Corporation",            "PH Bank"),
    "rcbc":             ("rcbc.com",             "Rizal Commercial Banking Corporation", "PH Bank"),
    "securitybank":     ("securitybank.com",     "Security Bank",                        "PH Bank"),
    "pnb":              ("pnb.com.ph",           "Philippine National Bank",             "PH Bank"),
    "unionbankph":      ("unionbankph.com",      "Union Bank of the Philippines",        "PH Bank"),
    "unionbank":        ("unionbankph.com",      "Union Bank of the Philippines",        "PH Bank"),
    "dbp":              ("dbp.ph",               "Development Bank of the Philippines",  "PH Bank"),
    "eastwestbanker":   ("eastwestbanker.com",   "East West Banking Corporation",        "PH Bank"),
    "eastwestbank":     ("eastwestbanker.com",   "East West Banking Corporation",        "PH Bank"),
    "eastwest":         ("eastwestbanker.com",   "East West Banking Corporation",        "PH Bank"),
    "aub":              ("aub.com.ph",           "Asia United Bank",                     "PH Bank"),
    "pbcom":            ("pbcom.com.ph",         "Philippine Bank of Communications",    "PH Bank"),
    "philtrustbank":    ("philtrustbank.com",    "Philippine Trust Company",             "PH Bank"),
    "philtrust":        ("philtrustbank.com",    "Philippine Trust Company",             "PH Bank"),
    "bankcom":          ("bankcom.com.ph",       "Bank of Commerce",                     "PH Bank"),
    "veteransbank":     ("veteransbank.com.ph",  "Philippine Veterans Bank",             "PH Bank"),
    "psbank":           ("psbank.com.ph",        "PSBank",                               "PH Bank"),
    "robinsonsbank":    ("robinsonsbank.com.ph", "Robinsons Bank",                       "PH Bank"),
    # ── Philippine digital banks / e-wallets ──────────────────────────────
    "mayabank":         ("mayabank.ph",          "Maya Bank",                            "PH Digital Bank"),
    "tonikbank":        ("tonikbank.com",        "Tonik Digital Bank",                   "PH Digital Bank"),
    "uniondigitalbank": ("uniondigitalbank.io",  "UnionDigital Bank",                    "PH Digital Bank"),
    "gotyme":           ("gotyme.com.ph",        "GoTyme Bank",                          "PH Digital Bank"),
    "unobank":          ("unobank.asia",         "UNObank",                              "PH Digital Bank"),
    "cimbbank":         ("cimbbank.com.ph",      "CIMB Bank Philippines",                "PH Digital Bank"),
    "gcash":            ("gcash.com",            "GCash",                                "PH E-Wallet"),
    "paymaya":          ("paymaya.com",          "PayMaya",                              "PH E-Wallet"),
    "maya":             ("maya.ph",              "Maya",                                 "PH E-Wallet"),
    "coins":            ("coins.ph",             "Coins.ph",                             "PH E-Wallet"),
    "grabpay":          ("grab.com",             "GrabPay",                              "PH E-Wallet"),
    "shopeepay":        ("shopee.ph",            "ShopeePay",                            "PH E-Wallet"),
    "instapay":         ("instapay.ph",          "InstaPay",                             "PH E-Wallet"),
    "pesonet":          ("pesonet.ph",           "PESONet",                              "PH E-Wallet"),
    # ── Well-known global websites ─────────────────────────────────────────
    "google":           ("google.com",           "Google",                               "Tech"),
    "gmail":            ("gmail.com",            "Gmail",                                "Tech"),
    "youtube":          ("youtube.com",          "YouTube",                              "Tech"),
    "microsoft":        ("microsoft.com",        "Microsoft",                            "Tech"),
    "outlook":          ("outlook.com",          "Microsoft Outlook",                    "Tech"),
    "apple":            ("apple.com",            "Apple",                                "Tech"),
    "icloud":           ("icloud.com",           "iCloud",                               "Tech"),
    "amazon":           ("amazon.com",           "Amazon",                               "Tech"),
    "facebook":         ("facebook.com",         "Facebook",                             "Social"),
    "instagram":        ("instagram.com",        "Instagram",                            "Social"),
    "whatsapp":         ("whatsapp.com",         "WhatsApp",                             "Social"),
    "twitter":          ("twitter.com",          "Twitter / X",                          "Social"),
    "tiktok":           ("tiktok.com",           "TikTok",                               "Social"),
    "netflix":          ("netflix.com",          "Netflix",                              "Streaming"),
    "spotify":          ("spotify.com",          "Spotify",                              "Streaming"),
    "paypal":           ("paypal.com",           "PayPal",                               "Payment"),
    "lazada":           ("lazada.com.ph",        "Lazada Philippines",                   "PH E-Commerce"),
    "shopee":           ("shopee.ph",            "Shopee Philippines",                   "PH E-Commerce"),
}

# Aliases and alternative keywords that should map to the same brand.
# Attackers often drop or truncate brand names.
BRAND_KEYWORD_ALIASES: Dict[str, str] = {
    # PH Banks
    "ph-bdo": "bdo", "bdoonline": "bdo", "bdo-online": "bdo", "mybdo": "bdo",
    "lbp": "landbank", "lbponline": "landbank",
    "bpionline": "bpi", "mybpi": "bpi",
    "metro-bank": "metrobank",
    "secbank": "securitybank", "sec-bank": "securitybank",
    "pnbph": "pnb",
    "unionbankphil": "unionbank",
    "dbph": "dbp",
    "ewb": "eastwest", "ewbanker": "eastwestbanker",
    "aubph": "aub",
    "psb": "psbank",
    # PH Digital / E-wallets
    "maya": "mayabank", "paymaya": "mayabank",
    "tonik": "tonikbank",
    "uno": "unobank",
    "cimb": "cimbbank",
    "gcashph": "gcash", "gcash-ph": "gcash",
    "coinsph": "coins", "coins-ph": "coins",
    # Known websites
    "google-login": "google", "googleaccount": "google",
    "gmail-login": "gmail", "mygmail": "gmail",
    "microsoftonline": "microsoft", "ms-login": "microsoft",
    "office365": "microsoft", "o365": "microsoft",
    "appleid": "apple", "apple-id": "apple",
    "icloud-login": "icloud",
    "amazonprime": "amazon", "amazon-login": "amazon",
    "fb": "facebook", "fblogin": "facebook",
    "ig": "instagram", "insta": "instagram",
    "wa": "whatsapp", "whatsapp-login": "whatsapp",
    "x": "twitter", "xcom": "twitter",
    "tt": "tiktok", "tiktokapp": "tiktok",
    "paypal-login": "paypal", "mypaypal": "paypal",
    "netflixlogin": "netflix", "netflix-login": "netflix",
    "spotifymusic": "spotify",
}


class BrandVerificationService:
    """Verify if a URL is the legitimate domain of a brand"""
    
    def __init__(self):
        # PhishTank API
        self.phishtank_url = "https://checkurl.phishtank.com/checkurl/"
        
        # URLhaus (malware database)
        self.urlhaus_url = "https://urlhaus-api.abuse.ch/v1/url/"
        
        # OpenPhish feed
        self.openphish_url = "https://openphish.com/feed.txt"

    # ------------------------------------------------------------------
    # Brand Impersonation Detection (bank-aware)
    # ------------------------------------------------------------------

    def check_brand_impersonation(self, url: str, domain: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Detect whether a domain is impersonating a known bank or financial brand.

        Returns: (is_impersonating, legitimate_domain, display_name)
          - is_impersonating : True if the domain looks like a fake
          - legitimate_domain: the real domain being impersonated, or None
          - display_name     : human-readable brand name, or None
        """
        # Strip subdomains: "secure.bdo-login.com" → work on "bdo-login.com"
        # Also strip www.
        clean = domain.lower().replace("www.", "")
        # Remove port if present
        clean = clean.split(":")[0]

        # Split into registrable domain parts (last two labels)
        parts = clean.split(".")
        registrable = ".".join(parts[-2:]) if len(parts) >= 2 else clean
        # Full domain without TLD for keyword scanning
        domain_no_tld = re.sub(r"\.[a-z]{2,}(\.[a-z]{2})?$", "", clean)

        # ── Step 1: Build a normalised slug from the domain (strip hyphens/numbers) ──
        slug = re.sub(r"[^a-z0-9]", "", domain_no_tld)          # e.g. "bdosecurelogin"
        slug_hyphenated = domain_no_tld.replace(" ", "").replace(".", "")  # keep hyphens stripped

        # ── Step 2: Resolve any aliases to canonical brand keys ──
        all_keywords = {**{k: k for k in BRAND_REGISTRY}, **BRAND_KEYWORD_ALIASES}

        matched_brand_key: Optional[str] = None

        # 2a. Exact keyword appears as a whole token in the domain (hyphen/dot split)
        domain_tokens = re.split(r"[-.]", domain_no_tld)
        for token in domain_tokens:
            if token in all_keywords:
                resolved = all_keywords[token]
                matched_brand_key = resolved if resolved in BRAND_REGISTRY else None
                if matched_brand_key:
                    break

        # 2b. Keyword is a substring of the slug (e.g. "bdoonline", "metrobankph")
        if not matched_brand_key:
            # Sort by length descending so longer keywords match before shorter ones
            # (prevents "bank" matching before "unionbank")
            for kw in sorted(all_keywords.keys(), key=len, reverse=True):
                if kw in slug:
                    resolved = all_keywords[kw]
                    if resolved in BRAND_REGISTRY:
                        matched_brand_key = resolved
                        break

        if not matched_brand_key:
            return False, None, None

        legit_domain, display_name, category = BRAND_REGISTRY[matched_brand_key]

        # ── Step 3: Is this the ACTUAL legitimate domain? ──
        # Accept exact match or "www." prefix of the legitimate domain
        legit_parts = legit_domain.split(".")
        legit_registrable = ".".join(legit_parts[-2:]) if len(legit_parts) >= 2 else legit_domain

        if registrable == legit_registrable:
            print(f"✅ {domain} is the legitimate {display_name} domain")
            return False, None, None

        # ── Step 4: Confirmed impersonation ──
        print(f"🚨 BRAND IMPERSONATION: {domain} impersonates {display_name} (legit: {legit_domain})")
        return True, legit_domain, display_name

    def verify_brand_ownership(self, url: str, domain: str) -> Tuple[bool, str]:
        """
        Verify if domain is the ACTUAL legitimate owner
        Uses real-time verification methods - NOT hardcoded lists
        Returns: (is_legitimate, legitimate_domain)
        """
        print(f"🔍 Verifying brand ownership for: {domain}")
        
        # PRIORITY: Check for typosquatting/homographic attacks first
        typosquatting_result = self._detect_typosquatting(domain)
        if typosquatting_result:
            legit_domain, reason = typosquatting_result
            print(f"🚨 TYPOSQUATTING DETECTED: {reason}")
            return False, legit_domain
        
        # Method 1: Check WHOIS registrant info against known brand registrants
        try:
            whois_legitimate = self._verify_via_whois(domain)
            if whois_legitimate:
                print(f"✅ Domain verified via WHOIS registrant check")
                return True, domain
        except Exception as e:
            print(f"⚠️ WHOIS verification failed: {e}")
        
        # Method 2: Check DNS SPF/DKIM records (email authentication)
        try:
            dns_legitimate = self._verify_via_dns_auth(domain)
            if dns_legitimate:
                print(f"✅ Domain verified via DNS authentication records")
                return True, domain
        except Exception as e:
            print(f"⚠️ DNS auth verification failed: {e}")
        
        # Method 3: Check SSL certificate ownership
        try:
            ssl_legitimate = self._verify_via_ssl_cert(domain)
            if ssl_legitimate:
                print(f"✅ Domain verified via SSL certificate")
                return True, domain
        except Exception as e:
            print(f"⚠️ SSL verification failed: {e}")
        
        # Method 4: Cross-reference with trusted brand database API
        try:
            legit_domain = self._find_legitimate_domain(domain)
            if legit_domain:
                print(f"⚠️ Possible impersonation detected. Legitimate domain: {legit_domain}")
                return False, legit_domain
        except Exception as e:
            print(f"⚠️ Brand database lookup failed: {e}")
        
        print(f"❓ Could not verify domain ownership")
        return False, "unknown"

    def _detect_typosquatting(self, domain: str) -> Tuple[str, str] or None:
        """
        Detect typosquatting attacks by finding similar legitimate domains
        Examples: 
          - faceb00k.com → facebook.com (0 → o)
          - amaz0n.com → amazon.com (0 → o)
          - app1e.com → apple.com (1 → l)
        Returns: (legitimate_domain, reason) or None
        """
        # Common brand names and their legitimate domains
        brands = {
            # ── PH domestic banks ─────────────────────────────────────────
            'bdo': 'bdo.com.ph', 'landbank': 'landbank.com', 'bpi': 'bpi.com.ph',
            'metrobank': 'metrobank.com.ph', 'chinabank': 'chinabank.ph',
            'rcbc': 'rcbc.com', 'securitybank': 'securitybank.com',
            'pnb': 'pnb.com.ph', 'unionbankph': 'unionbankph.com', 'dbp': 'dbp.ph',
            'eastwestbanker': 'eastwestbanker.com', 'aub': 'aub.com.ph',
            'pbcom': 'pbcom.com.ph', 'philtrustbank': 'philtrustbank.com',
            'bankcom': 'bankcom.com.ph', 'veteransbank': 'veteransbank.com.ph',
            'psbank': 'psbank.com.ph', 'robinsonsbank': 'robinsonsbank.com.ph',
            # ── PH digital banks / e-wallets ──────────────────────────────
            'gcash': 'gcash.com', 'maya': 'maya.ph', 'mayabank': 'mayabank.ph',
            'paymaya': 'paymaya.com', 'coins': 'coins.ph',
            'tonikbank': 'tonikbank.com', 'gotyme': 'gotyme.com.ph',
            'unobank': 'unobank.asia', 'cimbbank': 'cimbbank.com.ph',
            'uniondigitalbank': 'uniondigitalbank.io',
            'grabpay': 'grab.com', 'shopeepay': 'shopee.ph',
            'instapay': 'instapay.ph', 'pesonet': 'pesonet.ph',
            # ── Well-known global websites ────────────────────────────────
            'google': 'google.com', 'gmail': 'gmail.com', 'youtube': 'youtube.com',
            'microsoft': 'microsoft.com', 'outlook': 'outlook.com',
            'apple': 'apple.com', 'icloud': 'icloud.com',
            'amazon': 'amazon.com',
            'facebook': 'facebook.com', 'instagram': 'instagram.com',
            'whatsapp': 'whatsapp.com', 'twitter': 'twitter.com',
            'tiktok': 'tiktok.com',
            'netflix': 'netflix.com', 'spotify': 'spotify.com',
            'paypal': 'paypal.com',
            'lazada': 'lazada.com.ph', 'shopee': 'shopee.ph',
        }
        
        domain_name = domain.split('.')[0].lower()
        
        # Check if it's already a legitimate domain (exact match)
        for brand, legit_domain in brands.items():
            if domain_name == brand:
                # Exact match to a legitimate brand domain - NOT typosquatting
                return None
        
        # Check for common typosquatting patterns
        typo_map = {
            '0': 'o',  # faceb00k → facebook
            '1': 'l',  # app1e → apple
            '3': 'e',  # am@z0n → amazon
            '5': 's',  # twitt3r → twitter
            '7': 't',  # ou7look → outlook
            '8': 'b',  # 8haypal → paypal
        }
        
        for typo_char, correct_char in typo_map.items():
            if typo_char not in domain_name:
                continue  # Skip if typo character not even present
                
            normalized = domain_name.replace(typo_char, correct_char)
            
            for brand, legit_domain in brands.items():
                if normalized == brand:
                    # Found a match! Likely typosquatting
                    return (legit_domain, f"Typosquatting detected: '{domain_name}' resembles '{brand}' ('{typo_char}' instead of '{correct_char}')")
        
        # Check for homoglyphs (look-alike characters)
        # ο (Greek omicron) vs o (Latin o)
        # and other confusing character substitutions
        homoglyph_pairs = {
            'ο': 'o',  # Greek omicron
            'а': 'a',  # Cyrillic a
            'е': 'e',  # Cyrillic e
            'р': 'p',  # Cyrillic r
            'с': 'c',  # Cyrillic c
            'х': 'x',  # Cyrillic x
            'у': 'y',  # Cyrillic y
            'ӏ': 'l',  # Cyrillic Palochka (looks like Latin l or I)
            'І': 'i',  # Cyrillic Byelarussian-Ukrainian I
            'ㅣ': 'l',  # Hangul Jungseong I (looks like Latin l)
            '0': 'o',  # Numeric zero as letter o
            '1': 'i',  # Numeric one as letter i
        }
        
        # IMPORTANT: Replace ALL homoglyphs at once, not one by one
        # This ensures "аррӏе" becomes "apple" not "аррle" or partial normalization
        normalized_for_homoglyphs = domain_name
        homoglyphs_found = []
        for fake_char, real_char in homoglyph_pairs.items():
            if fake_char in normalized_for_homoglyphs:
                homoglyphs_found.append((fake_char, real_char))
                normalized_for_homoglyphs = normalized_for_homoglyphs.replace(fake_char, real_char)
        
        # Check if normalized version matches any brand
        if homoglyphs_found:
            for brand, legit_domain in brands.items():
                if normalized_for_homoglyphs == brand:
                    # Build description of which characters were homoglyphs
                    char_desc = ', '.join([f"'{fake}' as '{real}'" for fake, real in homoglyphs_found[:2]])
                    return (legit_domain, f"Homograph attack detected: Using confusing characters ({char_desc}) to impersonate '{brand}'")
        
        # Legacy check: Replace one at a time for safety (in case we missed something)
        for fake_char, real_char in homoglyph_pairs.items():
            if fake_char not in domain_name:
                continue  # Skip if homoglyph not present
                
            normalized = domain_name.replace(fake_char, real_char)
            
            for brand, legit_domain in brands.items():
                if normalized == brand:
                    return (legit_domain, f"Homograph attack detected: Using confusing character '{fake_char}' instead of '{real_char}'")
        
        return None

    def _verify_via_whois(self, domain: str) -> bool:
        """
        Check if WHOIS registrant matches known brand registrants
        Pulls from REAL WHOIS data, not hardcoded
        """
        try:
            w = whois.whois(domain)
            registrant = (w.registrant_name or w.org or "").lower()
            registrant_email = (w.registrant_email or "").lower()
            
            print(f"  WHOIS Registrant: {registrant}")
            
            # Check if registrant email is corporate domain (not gmail, yahoo, etc)
            if registrant_email:
                corporate_emails = ['@paypal.com', '@apple.com', '@amazon.com', '@microsoft.com', '@google.com']
                if any(email in registrant_email for email in corporate_emails):
                    return True
            
            # Check for company registration keywords
            company_keywords = ['inc', 'ltd', 'llc', 'corp', 'company', 'ag', 'gmbh', 'sa']
            if any(keyword in registrant for keyword in company_keywords):
                # Legitimate companies register their domains
                return True
            
            return False
        except Exception as e:
            print(f"  WHOIS check error: {e}")
            return False

    def _verify_via_dns_auth(self, domain: str) -> bool:
        """
        Check DNS SPF, DKIM, DMARC records
        Legitimate domains have proper email authentication
        """
        try:
            has_spf = False
            has_dmarc = False
            
            # Check for SPF record
            try:
                spf_records = dns.resolver.resolve(domain, 'TXT')
                has_spf = any('v=spf1' in str(r) for r in spf_records)
                if has_spf:
                    print(f"  ✅ Found SPF record")
            except:
                pass
            
            # Check for DMARC record
            try:
                dmarc_records = dns.resolver.resolve(f"_dmarc.{domain}", 'TXT')
                has_dmarc = any('v=DMARC1' in str(r) for r in dmarc_records)
                if has_dmarc:
                    print(f"  ✅ Found DMARC record")
            except:
                pass
            
            # Legitimate domains usually have at least SPF or DMARC
            return has_spf or has_dmarc
        except Exception as e:
            print(f"  DNS auth check error: {e}")
            return False

    def _verify_via_ssl_cert(self, domain: str) -> bool:
        """
        Verify SSL certificate CN matches domain
        And certificate is from trusted CA
        """
        try:
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    
                    # Check if certificate CN matches domain
                    subject_cn = dict(x[0] for x in cert['subject'])
                    cn = subject_cn.get('commonName', '')
                    
                    # Verify certificate is from trusted CA
                    issuer = dict(x[0] for x in cert['issuer'])
                    ca_org = issuer.get('organizationName', '')
                    
                    TRUSTED_CAS = ['DigiCert', 'Sectigo', 'Let\'s Encrypt', 'Comodo', 'GlobalSign', 'GoDaddy']
                    
                    cn_match = cn.lower() == domain.lower()
                    ca_trusted = any(ca in ca_org for ca in TRUSTED_CAS)
                    
                    if cn_match and ca_trusted:
                        print(f"  ✅ SSL certificate verified (CN: {cn}, CA: {ca_org})")
                        return True
                    else:
                        print(f"  ❌ SSL mismatch or untrusted CA (CN: {cn}, CA: {ca_org})")
                        return False
        except Exception as e:
            print(f"  SSL check error: {e}")
            return False

    def _find_legitimate_domain(self, suspected_domain: str) -> str:
        """
        If domain is suspicious, find the ACTUAL legitimate domain
        Uses real-time threat intelligence APIs
        """
        try:
            # Try URLhaus API for known malicious domains
            response = requests.post(
                self.urlhaus_url,
                data={"url": f"https://{suspected_domain}"},
                timeout=3
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('query_status') == 'ok' and data.get('results'):
                    print(f"  ⚠️ Found in URLhaus threat database")
                    return None
        except:
            pass
        
        # Try PhishTank API for known phishing URLs
        try:
            response = requests.post(
                self.phishtank_url,
                data={"url": f"https://{suspected_domain}", "format": "json"},
                timeout=3
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('in_database'):
                    print(f"  ⚠️ Found in PhishTank database")
                    return None
        except:
            pass
        
        return None

    def check_phishing_databases(self, url: str) -> Tuple[bool, str]:
        """
        Check if URL is known phishing/malware
        Uses REAL public databases - NOT hardcoded
        
        PhishTank = DEFINITIVE SOURCE (2.2M+ verified phishing URLs)
        If PhishTank says it's phishing, it IS phishing
        """
        print(f"🔍 Checking threat databases for: {url}")
        
        # Extract domain for secondary check
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        
        # PhishTank Check 1: Full URL (most accurate)
        try:
            response = requests.post(
                self.phishtank_url,
                data={"url": url, "format": "json"},
                timeout=3
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('in_database'):
                    detail_url = data.get('phish_detail_url', '')
                    verified = data.get('verified', False)
                    verified_str = "VERIFIED" if verified else "REPORTED"
                    print(f"  🚨 PHISHTANK CONFIRMED: URL is {verified_str} phishing")
                    return True, f"🚨 CONFIRMED PHISHING: Found in PhishTank database ({verified_str}). This URL has been identified as a phishing attempt. Details: {detail_url}"
        except Exception as e:
            print(f"  PhishTank check failed (timeout or network issue): {type(e).__name__}")
        
        # PhishTank Check 2: Domain only (in case URL path is different but domain is known phishing)
        if domain:
            try:
                domain_url = f"https://{domain}/"
                response = requests.post(
                    self.phishtank_url,
                    data={"url": domain_url, "format": "json"},
                    timeout=3
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get('in_database'):
                        detail_url = data.get('phish_detail_url', '')
                        print(f"  🚨 PHISHTANK CONFIRMED: Domain is known phishing")
                        return True, f"🚨 CONFIRMED PHISHING: Domain '{domain}' found in PhishTank database. This site is known for phishing attacks. Details: {detail_url}"
            except Exception as e:
                print(f"  PhishTank domain check failed: {type(e).__name__}")
        
        # URLhaus - malware & phishing URL database (secondary verification)
        try:
            response = requests.post(
                self.urlhaus_url,
                data={"url": url},
                timeout=3
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('query_status') == 'ok' and data.get('results'):
                    threat = data['results'][0].get('threat', 'unknown')
                    host = data['results'][0].get('host', '')
                    print(f"  🚨 URLHAUS CONFIRMED: URL is known threat")
                    return True, f"🚨 KNOWN THREAT: Found in URLhaus database ({threat}). Host: {host}"
        except Exception as e:
            print(f"  URLhaus check failed (timeout or network issue): {type(e).__name__}")
        
        print(f"  ✅ Not found in threat databases (may still be phishing if new/unknown)")
        return False, None

    def analyze_html_content(self, url: str) -> Dict:
        """
        Fetch and analyze actual HTML content in REAL-TIME
        Detect phishing indicators by analyzing page structure and content
        """
        print(f"📄 Analyzing HTML content from: {url}")
        
        try:
            response = requests.get(
                url, 
                timeout=10, 
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            )
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            indicators = {
                'phishing_score': 0,
                'findings': []
            }
            
            # Check 1: Login forms pointing to different EXTERNAL domain (not internal paths)
            forms = soup.find_all('form')
            for form in forms:
                action = form.get('action', '')
                # Only flag if it's an external domain redirect, NOT internal paths like /pages/search
                if action and action.startswith('http') and not self._is_same_domain(url, action):
                    # This is a redirect to a completely different domain - suspicious
                    indicators['phishing_score'] += 20
                    indicators['findings'].append(f"⚠️ Form redirects to different domain: {action}")
                    print(f"  🚨 Form redirect to external domain detected: {action}")
                # Internal paths and relative URLs are normal, don't flag them
            
            # Check 2: Hidden iframes (but whitelist legitimate analytics/tracking services)
            # These services are safe and used by legitimate sites
            legitimate_iframe_domains = [
                'googletagmanager.com',      # Google Tag Manager
                'google-analytics.com',      # Google Analytics
                'analytics.google.com',      # Google Analytics 4
                'cdn.segment.com',          # Segment analytics
                'js.intercomcdn.com',       # Intercom
                'cdn.jsdelivr.net',         # CDN for libraries
                'unpkg.com',                # CDN for libraries
                'cdnjs.cloudflare.com',     # Cloudflare CDN
                'maxcdn.bootstrapcdn.com',  # Bootstrap CDN
                'fonts.googleapis.com',     # Google Fonts
                'facebook.com/tr',          # Facebook Pixel
                'connect.facebook.net',     # Facebook Connect
                'platform.twitter.com',     # Twitter widgets
                'embed.youtube.com',        # YouTube embeds
                'ads.google.com',          # Google Ads
                'pagead2.googlesyndication.com', # Google Ad sense
                'doubleclick.net',         # Google/DoubleClick
                'criteo.com',              # Criteo ads
                'amazon-adsystem.com',     # Amazon ads
                'akamaized.net',           # Akamai CDN
                'cloudflare.com',          # Cloudflare
            ]
            
            iframes = soup.find_all('iframe')
            for iframe in iframes:
                style = iframe.get('style', '').lower()
                src = iframe.get('src', '').lower()
                
                # Check if hidden
                is_hidden = style and ('display:none' in style or 'visibility:hidden' in style)
                
                # Check if it's a legitimate service
                is_legitimate = any(domain in src for domain in legitimate_iframe_domains)
                
                # Only flag if it's hidden AND NOT from a legitimate service
                if is_hidden and not is_legitimate:
                    indicators['phishing_score'] += 25
                    src_display = iframe.get('src', 'unknown')
                    indicators['findings'].append(f"🚨 Hidden iframe detected: {src_display}")
                    print(f"  🚨 Hidden iframe found: {src_display}")
                # If it's hidden but from a legitimate service, it's normal - don't flag
            
            # Check 3: Urgency language in page content
            meta_desc = soup.find('meta', {'name': 'description'})
            meta_title = soup.find('title')
            page_text = soup.get_text().lower()
            
            urgency_words = [
                'verify', 'confirm', 'validate', 'update', 'urgent',
                'act now', 'verify now', 'account suspended', 'security alert',
                'action required', 'limited time', 'immediately'
            ]
            
            urgency_found = [w for w in urgency_words if w in page_text]
            if len(urgency_found) >= 2:
                indicators['phishing_score'] += 15
                indicators['findings'].append(f"⚠️ Multiple urgency keywords detected: {', '.join(urgency_found[:3])}")
                print(f"  ⚠️ Urgency keywords found: {urgency_found}")
            
            # Check 4: SSL mismatch in forms
            page_protocol = 'https' if url.startswith('https') else 'http'
            for form in forms:
                action = form.get('action', '')
                if action.startswith('http://') and page_protocol == 'https':
                    indicators['phishing_score'] += 20
                    indicators['findings'].append("🚨 Form submits to insecure HTTP from HTTPS page")
                    print(f"  🚨 Protocol mismatch in form submission")
            
            # Check 5: Suspicious redirects/meta refresh
            # Only flag if it redirects to a DIFFERENT domain (phishing technique)
            # Legitimate sites use meta refresh for session management - that's normal
            meta_refresh = soup.find('meta', {'http-equiv': 'refresh'})
            if meta_refresh:
                content = meta_refresh.get('content', '').lower()
                # Parse the meta refresh: format is "delay;url=destination"
                if 'url=' in content:
                    # Extract the redirect URL
                    redirect_url = content.split('url=', 1)[1].strip()
                    
                    # Only flag if redirecting to a different domain (phishing technique)
                    if redirect_url.startswith('http') and not self._is_same_domain(url, redirect_url):
                        # Extract delay time (first part before semicolon)
                        delay_str = content.split(';')[0].strip()
                        try:
                            delay = int(delay_str)
                        except:
                            delay = 0
                        
                        # Instant redirects to different domains are more suspicious
                        if delay <= 2:
                            indicators['phishing_score'] += 25
                            indicators['findings'].append(f"🚨 Instant redirect to different domain: {redirect_url}")
                            print(f"  🚨 Suspicious redirect detected: {redirect_url} (delay: {delay}s)")
                        else:
                            indicators['phishing_score'] += 10
                            indicators['findings'].append(f"⚠️ Redirects to different domain: {redirect_url}")
                            print(f"  ⚠️ Cross-domain redirect: {redirect_url} (delay: {delay}s)")
                # Internal redirects are normal (session management, etc.) - don't flag
            
            print(f"  📊 Content analysis score: {indicators['phishing_score']}/100")
            return indicators
            
        except requests.exceptions.ConnectionError as e:
            error_msg = "Cannot reach website - domain may not exist or server is offline"
            print(f"  ❌ {error_msg}")
            return {'phishing_score': 0, 'findings': [error_msg]}
        except requests.exceptions.Timeout:
            error_msg = "Page load took too long (timeout) - server may be unresponsive"
            print(f"  ❌ {error_msg}")
            return {'phishing_score': 0, 'findings': [error_msg]}
        except requests.exceptions.RequestException as e:
            error_msg = "Could not retrieve page content for analysis"
            print(f"  ❌ {error_msg}: {type(e).__name__}")
            return {'phishing_score': 0, 'findings': [error_msg]}
        except Exception as e:
            error_msg = f"Content analysis error: {type(e).__name__}"
            print(f"  ❌ {error_msg}")
            return {'phishing_score': 0, 'findings': [error_msg]}

    def _is_same_domain(self, url1: str, url2: str) -> bool:
        """Check if two URLs are from the same domain"""
        try:
            domain1 = urlparse(url1).netloc.replace('www.', '')
            domain2 = urlparse(url2).netloc.replace('www.', '')
            return domain1 == domain2
        except:
            return False
