"""
WHOIS and DNS Lookup API - Main Flask Application
Simplified and modular architecture
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import requests as _requests

# Import our modules
from utils import extract_domain

# ── Known URL shortener domains ──────────────────────────────────────────────
_SHORTENER_DOMAINS = {
    "bit.ly", "bitly.com", "t.co", "tinyurl.com", "goo.gl", "ow.ly",
    "buff.ly", "is.gd", "rb.gy", "short.io", "tiny.cc", "shorturl.at",
    "bl.ink", "rebrand.ly", "cutt.ly", "lnkd.in", "clck.ru", "qr.ae",
    "adf.ly", "shrinkonce.com", "smarturl.it", "su.pr", "dlvr.it",
    "snip.ly", "zws.im", "v.gd", "x.co", "po.st", "mcaf.ee",
}

def expand_shortened_url(url: str) -> str:
    """
    Resolve shortened URLs by following redirects — but ONLY for known shortener
    domains. Regular URLs that happen to redirect (http→https, www canonicalization,
    trailing slashes) are returned unchanged to avoid false positives.
    """
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url if url.startswith(("http://", "https://")) else "https://" + url)
        host = parsed.netloc.lower()
        bare_host = host.removeprefix("www.")
        if bare_host not in _SHORTENER_DOMAINS:
            # Not a known shortener — skip expansion entirely
            return url
        resp = _requests.head(
            url if url.startswith(("http://", "https://")) else "https://" + url,
            allow_redirects=True,
            timeout=8,
            headers={"User-Agent": "Mozilla/5.0 SmartShield-Bot/1.0"},
        )
        final_url = resp.url
        if final_url and final_url != url:
            return final_url
    except Exception as e:
        print(f"URL expansion failed for {url}: {e}")
    return url
from data_fetchers import get_whois_info, get_dns_records, get_ssl_info
from database import supabase_request, save_whois_history, save_dns_history, save_ssl_history
from risk_assessment import apply_deterministic_rules, calculate_contextual_risk_adjustment
from xai_explainer import generate_explanation

app = Flask(__name__)

# Configure CORS to allow production and development origins
CORS(app, origins=[
    "https://www.smartshield.it.com",  # Production frontend
    "https://smartshield.it.com",       # Production frontend (without www)
    "http://localhost:3000",            # Local development
    "http://localhost:3001",            # Alternative local port
    "http://127.0.0.1:3000",            # Alternative localhost
], 
supports_credentials=True,
allow_headers=["Content-Type", "Authorization"],
methods=["GET", "POST", "OPTIONS"])


@app.route('/api/scan', methods=['POST', 'OPTIONS'])
@app.route('/api/domain-info', methods=['POST', 'OPTIONS'])
def domain_info():
    """Get WHOIS, DNS, and SSL information for a domain"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.get_json()
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # ── Expand shortened URLs before scanning ────────────────────────
        original_url = url
        expanded_url = expand_shortened_url(url)
        if expanded_url != original_url:
            print(f"Shortened URL expanded: {original_url} → {expanded_url}")
            url = expanded_url

        # Extract domain from URL
        domain = extract_domain(url)
        
        if not domain:
            return jsonify({'error': 'Invalid URL'}), 400
        
        print(f"Fetching info for domain: {domain}")
        
        # ── Parallel WHOIS + DNS + SSL lookups ──
        # All three run simultaneously; total wait = slowest single call (not sum of all)
        whois_info = {}
        dns_records = {}
        ssl_info = {}

        def _fetch_whois():
            try:
                result = get_whois_info(domain)
                print(f"WHOIS info retrieved: {list(result.keys())}")
                return ('whois', result)
            except Exception as e:
                print(f"Error getting WHOIS: {e}")
                return ('whois', {'error': f'WHOIS lookup failed: {str(e)}'})

        def _fetch_dns():
            try:
                result = get_dns_records(domain)
                print(f"DNS records retrieved: {list(result.keys())}")
                return ('dns', result)
            except Exception as e:
                print(f"Error getting DNS: {e}")
                return ('dns', {'error': f'DNS lookup failed: {str(e)}'})

        def _fetch_ssl():
            try:
                result = get_ssl_info(domain)
                print(f"SSL info retrieved: {list(result.keys())}")
                return ('ssl', result)
            except Exception as e:
                print(f"Error getting SSL: {e}")
                return ('ssl', {'error': f'SSL lookup failed: {str(e)}'})

        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [
                executor.submit(_fetch_whois),
                executor.submit(_fetch_dns),
                executor.submit(_fetch_ssl),
            ]
            for future in as_completed(futures):
                key, value = future.result()
                if key == 'whois':
                    whois_info = value
                elif key == 'dns':
                    dns_records = value
                elif key == 'ssl':
                    ssl_info = value

        # Save to history tables in background (non-blocking)
        def _save_histories():
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

        executor_bg = ThreadPoolExecutor(max_workers=1)
        executor_bg.submit(_save_histories)
        executor_bg.shutdown(wait=False)
        
        # MULTI-LAYER RISK ASSESSMENT
        
        # Layer 1: Apply deterministic rules
        deterministic_risk, deterministic_flags = apply_deterministic_rules(url, domain)
        print(f"Layer 1 (Deterministic): +{deterministic_risk}% risk, flags: {deterministic_flags}")
        
        # Layer 3: Calculate contextual risk adjustment
        risk_reduction, positive_count, risk_indicators = calculate_contextual_risk_adjustment(
            whois_info, dns_records, ssl_info
        )
        print(f"Layer 3 (Contextual): risk_reduction={risk_reduction}, indicators={risk_indicators}")
        
        response_data = {
            'domain': domain,
            'original_url': original_url,
            'expanded_url': expanded_url if expanded_url != original_url else None,
            'whois': whois_info,
            'dns': dns_records,
            'ssl': ssl_info,
            'risk_adjustment': {
                'reduction_percentage': risk_reduction,
                'positive_factors': positive_count,
                'indicators': risk_indicators,
                'deterministic_increase': deterministic_risk,
                'deterministic_flags': deterministic_flags
            },
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"Returning risk_adjustment indicators: {response_data['risk_adjustment']['indicators']}")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"ERROR in domain_info: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/domain-history', methods=['POST', 'OPTIONS'])
def domain_history():
    """Get historical WHOIS, DNS, and SSL data for a domain via Supabase API"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
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

@app.route('/api/reports', methods=['GET', 'POST', 'OPTIONS'])
def reports():
    """Get or create reports (community comments) for a URL"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    try:
        if request.method == 'GET':
            # Get all reports for a URL
            url = request.args.get('url', '')
            if not url:
                return jsonify({'error': 'URL is required'}), 400
            
            # Fetch reports from Supabase
            result = supabase_request('GET', 'reports', 
                params={'url': f'eq.{url}', 'order': 'created_at.desc'})
            
            if result is None:
                return jsonify({'reports': []}), 200
            
            return jsonify({'reports': result}), 200
        
        elif request.method == 'POST':
            # Create a new report (comment)
            data = request.get_json()
            url = data.get('url', '')
            user_id = data.get('user_id', '')
            description = data.get('description', '')
            flag = data.get('flag', 'neutral')  # 'legitimate', 'phishing', or 'neutral'
            
            if not url or not user_id or not description:
                return jsonify({'error': 'URL, user_id, and description are required'}), 400
            
            # Validate flag value
            if flag not in ['legitimate', 'phishing', 'neutral']:
                flag = 'neutral'
            
            # Insert report into Supabase
            report_data = {
                'url': url,
                'user_id': user_id,
                'description': description,
                'flag': flag
            }
            
            result = supabase_request('POST', 'reports', report_data)
            
            if result is None:
                return jsonify({'error': 'Failed to save report'}), 500
            
            # Return updated list of reports for this URL
            all_reports = supabase_request('GET', 'reports',
                params={'url': f'eq.{url}', 'order': 'created_at.desc'})
            
            if all_reports is None:
                all_reports = [result] if isinstance(result, dict) else result
            
            return jsonify({'reports': all_reports}), 201
            
    except Exception as e:
        print(f"ERROR in reports: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/explain', methods=['POST', 'OPTIONS'])
def explain_analysis():
    """Generate XAI explanation of scan results"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.get_json()
        url = data.get('url', '')
        scan_result = data.get('scan_result', {})
        whois_info = data.get('whois_info', {})
        dns_info = data.get('dns_info', {})
        ssl_info = data.get('ssl_info', {})
        deterministic_flags = data.get('deterministic_flags', [])
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Use simplified XAI explainer
        explanation = generate_explanation(url, scan_result, whois_info, dns_info, ssl_info, deterministic_flags)
        return jsonify(explanation), 200
        
    except Exception as e:
        print(f"ERROR in explain_analysis: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'whois-dns-api'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"🚀 Starting WHOIS & DNS Lookup API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
