"""
WSGI entry point for Gunicorn
"""
import os
import sys

# Print startup info for Railway logs
print("=" * 50)
print("🚀 SmartShield WHOIS API Starting...")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"PORT: {os.getenv('PORT', 'Not set')}")
print("=" * 50)

from whois_dns_api import app

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8000))
    print(f"Running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port)
