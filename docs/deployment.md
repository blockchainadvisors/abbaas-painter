# Deployment Guide

This guide covers deploying Abbaas Painter to production environments, including Docker, cloud platforms, and traditional server setups.

---

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Cloud Deployments](#cloud-deployments)
- [Reverse Proxy Configuration](#reverse-proxy-configuration)
- [Environment Configuration](#environment-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling Considerations](#scaling-considerations)
- [Security Hardening](#security-hardening)

---

## Deployment Overview

### Architecture Options

| Option | Best For | Complexity |
|--------|----------|------------|
| Single Server | Small teams, demos | Low |
| Docker Compose | Development, small production | Medium |
| Kubernetes | Large scale, high availability | High |
| Serverless | Variable load, cost optimization | Medium |

### Resource Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 2 GB | 10+ GB |
| Network | 10 Mbps | 100+ Mbps |

> **Note:** The LaMa model requires ~2GB RAM during inference. Ensure adequate memory allocation.

---

## Pre-Deployment Checklist

- [ ] Backend tests passing
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Environment variables configured
- [ ] CORS origins updated for production domain
- [ ] SSL/TLS certificates obtained
- [ ] Domain DNS configured
- [ ] Firewall rules set
- [ ] Monitoring configured
- [ ] Backup strategy defined

---

## Docker Deployment

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download model (optional, increases image size but faster startup)
# RUN python -c "from huggingface_hub import hf_hub_download; hf_hub_download('fashn-ai/LaMa', 'big-lama.pt')"

# Copy application
COPY app/ ./app/

# Run server
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Frontend Nginx Configuration

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Docker Compose

Create `docker-compose.yml` at project root:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - model-cache:/root/.cache/huggingface
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:8000
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  model-cache:
```

### Running with Docker Compose

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Manual Deployment

### Backend Deployment

**1. Install Python and dependencies:**

```bash
sudo apt update
sudo apt install python3.12 python3.12-venv python3-pip

cd /opt/abbaas-painter/backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**2. Create systemd service:**

Create `/etc/systemd/system/abbaas-backend.service`:

```ini
[Unit]
Description=Abbaas Painter Backend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/abbaas-painter/backend
Environment="PATH=/opt/abbaas-painter/backend/venv/bin"
ExecStart=/opt/abbaas-painter/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**3. Enable and start service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable abbaas-backend
sudo systemctl start abbaas-backend
sudo systemctl status abbaas-backend
```

### Frontend Deployment

**1. Build frontend:**

```bash
cd /opt/abbaas-painter/frontend
npm ci
VITE_API_URL=https://api.yourdomain.com npm run build
```

**2. Copy to web root:**

```bash
sudo cp -r dist/* /var/www/abbaas-painter/
```

**3. Configure Nginx:**

Create `/etc/nginx/sites-available/abbaas-painter`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/abbaas-painter;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for model inference
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;

        # Increase body size for large images
        client_max_body_size 50M;
    }
}
```

**4. Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/abbaas-painter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Cloud Deployments

### AWS Deployment

**Architecture:**
```
CloudFront (CDN)
    │
    ├── S3 (Frontend static files)
    │
    └── ALB (Application Load Balancer)
            │
            └── ECS/EC2 (Backend containers)
```

**Steps:**

1. **Frontend to S3 + CloudFront:**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name/
   ```

2. **Backend to ECS:**
   - Create ECR repository
   - Push Docker image
   - Create ECS task definition
   - Create ECS service with ALB

### Google Cloud Platform

**Architecture:**
```
Cloud CDN
    │
    └── Cloud Run (Backend)
            │
            └── Cloud Storage (Frontend)
```

**Deploy backend to Cloud Run:**

```bash
gcloud run deploy abbaas-backend \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --timeout 300
```

### DigitalOcean App Platform

Create `app.yaml`:

```yaml
name: abbaas-painter
services:
  - name: backend
    source:
      repo: your-repo
      branch: main
      source_dir: backend
    run_command: uvicorn app.main:app --host 0.0.0.0 --port 8080
    environment_slug: python
    instance_size_slug: professional-xs
    instance_count: 1
    http_port: 8080
    routes:
      - path: /api

  - name: frontend
    source:
      repo: your-repo
      branch: main
      source_dir: frontend
    build_command: npm run build
    environment_slug: node-js
    instance_size_slug: basic-xxs
    routes:
      - path: /
```

---

## Reverse Proxy Configuration

### Nginx (Recommended)

See [Manual Deployment](#manual-deployment) section.

### Caddy

Create `Caddyfile`:

```caddyfile
yourdomain.com {
    root * /var/www/abbaas-painter
    file_server

    handle /api/* {
        reverse_proxy localhost:8000 {
            header_up X-Real-IP {remote_host}
        }
    }

    handle {
        try_files {path} /index.html
    }
}
```

### Traefik (Docker)

Add labels to `docker-compose.yml`:

```yaml
services:
  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`yourdomain.com`) && PathPrefix(`/api`)"
      - "traefik.http.services.api.loadbalancer.server.port=8000"

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`yourdomain.com`)"
      - "traefik.http.services.web.loadbalancer.server.port=80"
```

---

## Environment Configuration

### Production Environment Variables

**Backend:**

| Variable | Description | Example |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://yourdomain.com` |
| `MODEL_CACHE_DIR` | Model storage path | `/var/cache/models` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

**Frontend (Build-time):**

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourdomain.com` |

### Update CORS for Production

Edit `backend/app/main.py`:

```python
import os

origins = os.getenv("ALLOWED_ORIGINS", "").split(",") or [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Monitoring and Logging

### Application Logging

**Backend logging configuration:**

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Health Checks

**Kubernetes liveness probe:**

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Metrics (Optional)

Add Prometheus metrics with `prometheus-fastapi-instrumentator`:

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

---

## Scaling Considerations

### Horizontal Scaling

The backend is **stateless** and can be horizontally scaled:

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancing

Use sticky sessions or ensure requests are independent (default behavior).

### Caching

Consider adding Redis for:
- Session management (if added)
- Result caching (same image+mask = cached result)

### GPU Acceleration

For high-throughput deployments:

1. Use NVIDIA Docker runtime
2. Update service to use CUDA:
   ```python
   self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
   ```
3. Use GPU-enabled instances

---

## Security Hardening

### HTTPS Configuration

Always use HTTPS in production. Use Let's Encrypt for free certificates:

```bash
sudo certbot --nginx -d yourdomain.com
```

### Rate Limiting

Add rate limiting with slowapi:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("/inpaint")
@limiter.limit("10/minute")
async def inpaint(request: Request, ...):
    ...
```

### Input Validation

- Maximum image size limits
- File type validation
- Request size limits

```python
# In main.py
app = FastAPI(
    max_request_size=50 * 1024 * 1024  # 50MB
)
```

### Security Headers

Add security headers via middleware or reverse proxy:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## Troubleshooting Deployment

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Backend not running | Check backend service status |
| CORS errors | Wrong origins configured | Update ALLOWED_ORIGINS |
| Slow cold start | Model downloading | Pre-download model in Dockerfile |
| Out of memory | Large image + model | Increase container memory |
| Timeout on inpaint | Slow CPU inference | Increase proxy timeout, consider GPU |
