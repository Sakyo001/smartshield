#!/bin/bash
# Railway startup script for SmartShield ML API
# This ensures proper PORT variable handling

# Set default port if not provided by Railway
export PORT=${PORT:-8000}

echo "=========================================="
echo "🚀 Starting SmartShield ML API"
echo "PORT: $PORT"
echo "Workers: 1"
echo "=========================================="

# Start Gunicorn with the PORT from env
exec gunicorn \
    --bind "0.0.0.0:$PORT" \
    --workers 1 \
    --timeout 120 \
    --preload \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    wsgi:app
