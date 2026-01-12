"""
XAI (Explainable AI) analysis for scan results
"""
from datetime import datetime


def generate_explanation(url, scan_result, whois_info, dns_info, ssl_info):
    """Generate human-readable explanation of scan results"""
    explanation = {
        'url': url,
        'risk_factors': [],
        'positive_factors': [],
        'summary': '',
        'recommendation': ''
    }
    
    risk_score = scan_result.get('riskScore', 0)
    positive_count = 0
    high_risk_count = 0
    
    # Risk score analysis
    if risk_score >= 70:
        explanation['risk_factors'].append({
            'title': 'High Risk Score',
            'description': f'AI detected strong phishing indicators ({risk_score}%)',
            'severity': 'high'
        })
        high_risk_count += 1
    elif risk_score >= 40:
        explanation['risk_factors'].append({
            'title': 'Medium Risk Score',
            'description': f'Some suspicious patterns detected ({risk_score}%)',
            'severity': 'medium'
        })
    else:
        explanation['positive_factors'].append({
            'title': 'Low Risk Score',
            'description': f'Site appears safe ({risk_score}%)',
            'severity': 'low'
        })
        positive_count += 1
    
    # WHOIS analysis
    if whois_info and not whois_info.get('error'):
        if whois_info.get('registrar'):
            explanation['positive_factors'].append({
                'title': 'Registered Domain',
                'description': f'Registered with {whois_info.get("registrar")}',
                'severity': 'positive'
            })
            positive_count += 1
        
        # Domain age
        creation_date = whois_info.get('creation_date')
        if creation_date:
            try:
                created = datetime.strptime(str(creation_date)[:10], '%Y-%m-%d')
                age_years = (datetime.now() - created).days / 365
                
                if age_years > 3:
                    explanation['positive_factors'].append({
                        'title': 'Established Domain',
                        'description': f'Registered for {int(age_years)} years',
                        'severity': 'positive'
                    })
                    positive_count += 2
                elif age_years < 0.02:  # < 7 days
                    explanation['risk_factors'].append({
                        'title': 'Very New Domain',
                        'description': 'Created less than a week ago',
                        'severity': 'high'
                    })
                    high_risk_count += 1
            except:
                pass
    else:
        error_msg = whois_info.get('error', 'Unknown error') if isinstance(whois_info, dict) else 'Unknown error'
        explanation['risk_factors'].append({
            'title': 'WHOIS Information Unavailable',
            'description': error_msg if 'Could not retrieve' in error_msg else f'Unable to verify domain: {error_msg}',
            'severity': 'medium'
        })
    
    # DNS analysis
    if dns_info and not dns_info.get('error'):
        if dns_info.get('A', []):
            explanation['positive_factors'].append({
                'title': 'Valid DNS Records',
                'description': 'Proper DNS A records found',
                'severity': 'positive'
            })
            positive_count += 1
        
        if dns_info.get('MX', []):
            explanation['positive_factors'].append({
                'title': 'Email Configuration',
                'description': 'MX records configured',
                'severity': 'positive'
            })
            positive_count += 1
    
    # SSL analysis
    if ssl_info and not ssl_info.get('error'):
        if ssl_info.get('issuer'):
            explanation['positive_factors'].append({
                'title': 'SSL Certificate',
                'description': 'Valid SSL certificate found',
                'severity': 'positive'
            })
            positive_count += 2
        
        # Check expiry
        validity = ssl_info.get('not_after', '')
        if validity:
            try:
                cert_valid_until = datetime.strptime(validity[:10], '%Y-%m-%d')
                if cert_valid_until < datetime.now():
                    explanation['risk_factors'].append({
                        'title': 'Expired SSL Certificate',
                        'description': 'Certificate has expired',
                        'severity': 'medium'
                    })
            except:
                pass
    else:
        ssl_error = ssl_info.get('error', 'Unknown error') if isinstance(ssl_info, dict) else 'Unknown error'
        severity = 'medium' if ssl_info.get('is_timeout') or ssl_info.get('is_ssl_verify_error') else 'high'
        
        explanation['risk_factors'].append({
            'title': 'SSL Certificate Issue',
            'description': ssl_error,
            'severity': severity
        })
        if severity == 'high':
            high_risk_count += 1
    
    # Detection results
    for detection in scan_result.get('detections', []):
        explanation['risk_factors'].append({
            'title': f"Detection: {detection.get('service', 'Unknown')}",
            'description': f"Flagged as: {detection.get('result', '')}",
            'severity': 'high'
        })
        high_risk_count += 1
    
    # Check critical issues
    critical_issues = []
    if ssl_info and ssl_info.get('error'):
        critical_issues.append('SSL Certificate Issue')
    if dns_info and dns_info.get('error'):
        critical_issues.append('DNS Resolution Issue')
    if whois_info and whois_info.get('error'):
        critical_issues.append('WHOIS Information Unavailable')
    
    # Calculate adjusted risk score
    adjusted_risk = risk_score
    
    if critical_issues:
        adjusted_risk = max(risk_score, 75)
        print(f"CRITICAL ISSUES: {critical_issues} - forcing 75% minimum")
    else:
        # Apply positive factor reductions
        if positive_count >= 5:
            adjusted_risk = max(0, risk_score - 45)
        elif positive_count >= 4:
            adjusted_risk = max(0, risk_score - 35)
        elif positive_count >= 3:
            adjusted_risk = max(0, risk_score - 25)
        elif positive_count >= 2:
            adjusted_risk = max(0, risk_score - 15)
        
        if high_risk_count > 2:
            adjusted_risk = max(risk_score * 0.8, 60)
    
    adjusted_risk = round(adjusted_risk)
    
    # Generate summary
    if critical_issues:
        explanation['summary'] = f"🚨 CRITICAL SECURITY ISSUE: {', '.join(critical_issues)}. This website has serious security problems."
        explanation['recommendation'] = "DO NOT enter sensitive information. Report this site to authorities."
    elif adjusted_risk >= 70:
        explanation['summary'] = f"This website shows {high_risk_count} critical warning signs and appears malicious."
        explanation['recommendation'] = "Do NOT enter personal or financial information."
    elif adjusted_risk >= 40:
        explanation['summary'] = f"This website has {high_risk_count} warning signs worth investigating."
        explanation['recommendation'] = "Proceed with caution. Verify legitimacy before trusting."
    else:
        explanation['summary'] = "This website appears to have a low risk profile."
        explanation['recommendation'] = "Site appears safe, but always practice good security habits."
    
    explanation['adjusted_risk_score'] = adjusted_risk
    explanation['original_risk_score'] = risk_score
    explanation['positive_factors_count'] = positive_count
    explanation['high_risk_indicators_count'] = high_risk_count
    explanation['critical_issues'] = critical_issues
    
    print(f"XAI: Original={risk_score}%, Adjusted={adjusted_risk}%, Critical={critical_issues}")
    
    return explanation
