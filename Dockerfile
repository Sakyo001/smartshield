# Dockerfile for SmartShield ML API (Railway Deployment)
# This builds the Python API from the packages/ml directory in the monorepo

FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy ML package
COPY packages/ml /app

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Expose port (Railway sets PORT env var)
EXPOSE 8000

# Run gunicorn with proper settings for Railway
# --preload: Load app before forking workers (helps with startup time)
# --bind 0.0.0.0:$PORT: Listen on all interfaces
# --workers 1: Use 1 worker for Railway free tier (lower memory)
# --timeout 120: Request timeout
# --log-level info: Show startup logs
CMD gunicorn --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --timeout 120 \
    --preload \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    wsgi:app
