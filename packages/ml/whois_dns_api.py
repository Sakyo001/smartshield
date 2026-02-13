"""
WHOIS and DNS Lookup API - Main Flask Application
- /api/scan: FAST deterministic URL classification (rules + concurrent PhishTank)
- /api/domain-info: Detailed WHOIS/DNS/SSL lookup (heavy, called lazily)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import os

# Import our modules
from utils import extract_domain
from data_fetchers import get_whois_info, get_dns_records, get_ssl_info
from database import supabase_request, save_whois_history, save_dns_history, save_ssl_history
from risk_assessment import apply_lightweight_rules, apply_deterministic_rules, calculate_contextual_risk_adjustment
from third_party_apis import BrandVerificationService
from xai_explainer import generate_explanation

app = Flask(__name__)
CORS(app)

# Shared brand service for concurrent PhishTank checks
brand_service = BrandVerificationService()


@app.route('/api/scan', methods=['POST', 'OPTIONS'])
def fast_scan():
    """
    FAST scan endpoint — enhanced deterministic rules + concurrent PhishTank/URLhaus.
    No WHOIS/DNS/SSL lookups here. Designed for <2s response.
    """
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

        start = time.time()

        # ── Run lightweight rules (instant, 0ms — no network) ──
        rule_risk, rule_flags = apply_lightweight_rules(url, domain)
        print(f"📏 Rules: +{rule_risk}% risk, flags: {rule_flags}")

        # ── Run PhishTank/URLhaus check concurrently (max 3s) ──
        db_risk = 0
        db_flags = []
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(brand_service.check_phishing_databases, url)
                is_known_threat, threat_info = future.result(timeout=4)
                if is_known_threat:
                    db_risk = 100
                    db_flags.append(threat_info)
                    print(f"🚨 PhishTank/URLhaus: CONFIRMED threat")
        except Exception as e:
            print(f"⚠️ PhishTank check skipped: {type(e).__name__}")

        # ── Combine scores ──
        total_risk = min(100, rule_risk + db_risk)
        all_flags = rule_flags + db_flags

        # Determine decision & confidence
        if db_risk >= 100:
            # Confirmed by threat database — definitive
            decision = 'PHISHING'
            confidence = 100
        elif total_risk >= 70:
            decision = 'PHISHING'
            confidence = min(100, total_risk)
        elif total_risk >= 40:
            decision = 'SUSPICIOUS'
            confidence = total_risk
        else:
            decision = 'LEGITIMATE'
            confidence = max(0, 100 - total_risk)

        elapsed_ms = round((time.time() - start) * 1000, 1)
        print(f"⚡ Scan complete in {elapsed_ms}ms — {decision} (risk={total_risk}%)")

        response = {
            'decision': decision,
            'confidence': round(confidence, 2),
            'risk_score': round(total_risk, 2),
            'model': 'deterministic-v2',
            'inference_ms': elapsed_ms,
            'rule_flags': all_flags,
            'rule_risk_increase': total_risk,
            'domain': domain,
            'timestamp': datetime.now().isoformat()
        }

        return jsonify(response)

    except Exception as e:
        print(f"ERROR in fast_scan: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/domain-info', methods=['POST', 'OPTIONS'])
def domain_info():
    """Get detailed WHOIS, DNS, and SSL information for a domain (heavy, called lazily)"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
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
        whois_info = {}
        try:
            whois_info = get_whois_info(domain)
            print(f"WHOIS info retrieved: {list(whois_info.keys())}")
        except Exception as e:
            print(f"Error getting WHOIS: {e}")
            whois_info = {'error': f'WHOIS lookup failed: {str(e)}'}
        
        dns_records = {}
        try:
            dns_records = get_dns_records(domain)
            print(f"DNS records retrieved: {list(dns_records.keys())}")
        except Exception as e:
            print(f"Error getting DNS: {e}")
            dns_records = {'error': f'DNS lookup failed: {str(e)}'}
        
        ssl_info = {}
        try:
            ssl_info = get_ssl_info(domain)
            print(f"SSL info retrieved: {list(ssl_info.keys())}")
        except Exception as e:
            print(f"Error getting SSL: {e}")
            ssl_info = {'error': f'SSL lookup failed: {str(e)}'}
        
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

@app.route('/api/reports', methods=['GET', 'POST'])
def reports():
    """Get or create reports (community comments) for a URL"""
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

@app.route('/api/explain', methods=['POST'])
def explain_analysis():
    """Generate XAI explanation of scan results"""
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
