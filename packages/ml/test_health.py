#!/usr/bin/env python3
"""
Quick health check test for Railway deployment debugging
Run this locally to verify the app starts correctly
"""

import os
import sys
import time

print("=" * 60)
print("🔍 SmartShield Health Check Tester")
print("=" * 60)

# Set test environment
os.environ['PORT'] = '8000'
os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'test_key'

print("\n1️⃣  Importing app...")
try:
    from whois_dns_api import app
    print("✅ App imported successfully")
except Exception as e:
    print(f"❌ Failed to import app: {e}")
    sys.exit(1)

print("\n2️⃣  Testing health endpoint...")
try:
    with app.test_client() as client:
        response = client.get('/health')
        status = response.status_code
        data = response.get_json()
        
        print(f"   Status Code: {status}")
        print(f"   Response: {data}")
        
        if status == 200 and data.get('status') == 'ok':
            print("✅ Health check endpoint works!")
        else:
            print("❌ Health check returned unexpected response")
            sys.exit(1)
            
except Exception as e:
    print(f"❌ Health check failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n3️⃣  Testing /api/scan endpoint...")
try:
    with app.test_client() as client:
        response = client.post('/api/scan',
                              json={'url': 'https://google.com'},
                              content_type='application/json')
        status = response.status_code
        data = response.get_json()
        
        print(f"   Status Code: {status}")
        print(f"   Has decision: {'decision' in data}")
        print(f"   Has confidence: {'confidence' in data}")
        
        if status == 200:
            print("✅ Scan endpoint works!")
        else:
            print(f"⚠️  Scan endpoint returned {status} (may need DB connection)")
            
except Exception as e:
    print(f"⚠️  Scan test failed: {e}")
    print("   (This is expected without DB credentials)")

print("\n" + "=" * 60)
print("✅ Basic functionality test complete!")
print("=" * 60)
print("\n💡 To test with real DB:")
print("   1. Copy .env.example to .env")
print("   2. Fill in real Supabase credentials")
print("   3. Run: python test_health.py")
