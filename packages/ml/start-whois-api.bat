@echo off
REM Install dependencies if needed
echo Installing Python dependencies...
pip install -r requirements-whois.txt

REM Start the WHOIS & DNS API
echo Starting WHOIS ^& DNS Lookup API...
python whois_dns_api.py
