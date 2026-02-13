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

# Run the Python startup script (handles PORT properly)
CMD ["python", "start.py"]
