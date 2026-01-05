import sys
sys.path.insert(0, '.')

from whois_dns_api import apply_deterministic_rules, extract_domain

# Test with the phishing URL
phishing_url = "http://batvrms.net/deliver/D2017HL/u.php"
domain = extract_domain(phishing_url)

risk_increase, flags = apply_deterministic_rules(phishing_url, domain)

print(f"\n🔍 Testing URL: {phishing_url}")
print(f"Domain: {domain}")
print(f"Risk Increase: +{risk_increase}%")
print(f"Flags: {flags}")
print(f"\nExpected behavior: Should increase risk significantly")
print(f"  - No HTTPS: +15%")
print(f"  - Suspicious path: +10%")
print(f"  Total expected: ~25%+")
