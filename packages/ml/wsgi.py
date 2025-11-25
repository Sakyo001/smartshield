"""
WSGI entry point for Gunicorn
"""
from whois_dns_api import app

if __name__ == "__main__":
    app.run()
