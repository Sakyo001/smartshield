"""
Alternative startup script for Railway if shell scripts don't work
This Python script starts Gunicorn with proper PORT handling
"""
import os
import subprocess
import sys

# Get PORT from environment, default to 8000
port = os.environ.get('PORT', '8000')

print("=" * 50)
print("🚀 Starting SmartShield ML API")
print(f"PORT: {port}")
print(f"Workers: 1")
print("=" * 50)

# Build Gunicorn command
cmd = [
    'gunicorn',
    f'--bind=0.0.0.0:{port}',
    '--workers=1',
    '--timeout=120',
    '--preload',
    '--log-level=info',
    '--access-logfile=-',
    '--error-logfile=-',
    'wsgi:app'
]

# Execute Gunicorn
try:
    subprocess.run(cmd, check=True)
except subprocess.CalledProcessError as e:
    print(f"❌ Error starting Gunicorn: {e}")
    sys.exit(1)
except KeyboardInterrupt:
    print("\n👋 Shutting down...")
    sys.exit(0)
