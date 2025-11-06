# Docker Deployment Guide

## Quick Start

### Using Docker Compose (Recommended)

1. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Omada API credentials
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f omada-dashboard
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

The application will be accessible at `http://localhost:3500`

## Docker Build Details

### Multi-Stage Build

The Dockerfile uses a 3-stage build process:

1. **deps**: Installs production dependencies only
2. **builder**: Installs all dependencies and builds the application
3. **runner**: Minimal runtime image with only what's needed to run

### Image Features

- **Base**: Node.js 18 Alpine (minimal footprint)
- **Size**: ~150MB (optimized)
- **Security**: Runs as non-root user (nextjs:nodejs)
- **Health checks**: Enabled for container orchestration
- **Auto-restart**: Configured with `restart: unless-stopped`

## Manual Docker Build

### Build the Image

```bash
docker build -t omada-dashboard:latest .
```

### Run the Container

```bash
docker run -d \
  --name omada-dashboard \
  --restart unless-stopped \
  -p 3500:3500 \
  --env-file .env.local \
  omada-dashboard:latest
```

### With Individual Environment Variables

```bash
docker run -d \
  --name omada-dashboard \
  --restart unless-stopped \
  -p 3500:3500 \
  -e OMADA_CLIENT_ID=your_client_id \
  -e OMADA_CLIENT_SECRET=your_client_secret \
  -e OMADA_ID=your_omada_id \
  -e OMADA_SITE_ID= \
  -e OMADA_API_BASE_URL=https://use1-omada-northbound.tplinkcloud.com \
  omada-dashboard:latest
```

## Container Management

### View Running Containers

```bash
docker ps
```

### View Logs

```bash
# Follow logs in real-time
docker logs -f omada-dashboard

# View last 100 lines
docker logs --tail 100 omada-dashboard

# View logs with timestamps
docker logs -t omada-dashboard
```

### Check Container Health

```bash
docker inspect omada-dashboard | grep -A 10 Health
```

### Access Container Shell

```bash
docker exec -it omada-dashboard sh
```

### View Resource Usage

```bash
docker stats omada-dashboard
```

### Restart Container

```bash
docker restart omada-dashboard
```

### Stop and Remove

```bash
docker stop omada-dashboard
docker rm omada-dashboard
```

## Production Deployment

### With Docker Compose

```yaml
version: '3.8'

services:
  omada-dashboard:
    image: omada-dashboard:latest
    container_name: omada-dashboard
    restart: unless-stopped
    ports:
      - "3500:3500"
    env_file:
      - .env.local
    networks:
      - omada-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3500"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  omada-network:
    driver: bridge
```

### Behind a Reverse Proxy

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Troubleshooting

### Container Fails to Start

1. **Check logs:**
   ```bash
   docker logs omada-dashboard
   ```

2. **Verify environment variables:**
   ```bash
   docker exec omada-dashboard env | grep OMADA
   ```

3. **Check if port is already in use:**
   ```bash
   lsof -i :3500
   ```

### Build Fails

1. **Clear Docker cache:**
   ```bash
   docker builder prune -a
   ```

2. **Rebuild without cache:**
   ```bash
   docker build --no-cache -t omada-dashboard:latest .
   ```

### Cannot Access Application

1. **Verify container is running:**
   ```bash
   docker ps | grep omada-dashboard
   ```

2. **Check port mapping:**
   ```bash
   docker port omada-dashboard
   ```

3. **Test from inside container:**
   ```bash
   docker exec omada-dashboard wget -O- http://localhost:3500
   ```

## Updating the Application

### Using Docker Compose

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Using Docker CLI

```bash
# Stop and remove old container
docker stop omada-dashboard
docker rm omada-dashboard

# Rebuild image
docker build -t omada-dashboard:latest .

# Start new container
docker run -d \
  --name omada-dashboard \
  --restart unless-stopped \
  -p 3500:3500 \
  --env-file .env.local \
  omada-dashboard:latest
```

## Environment Variables

Required:
- `OMADA_CLIENT_ID`: Your Omada API Client ID
- `OMADA_CLIENT_SECRET`: Your Omada API Client Secret
- `OMADA_ID`: Your Omada Controller ID
- `OMADA_API_BASE_URL`: API endpoint URL

Optional:
- `OMADA_SITE_ID`: Pre-select a specific site (leave empty for site selection)
- `NODE_ENV`: Set to `production` (default in Dockerfile)
- `PORT`: Application port (default: 3500)
- `HOSTNAME`: Bind address (default: 0.0.0.0)

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use secrets management** for production credentials
3. **Keep base image updated:** Regularly rebuild with latest node:18-alpine
4. **Run security scans:**
   ```bash
   docker scan omada-dashboard:latest
   ```
5. **Limit container resources:**
   ```bash
   docker run -d \
     --name omada-dashboard \
     --memory="512m" \
     --cpus="1.0" \
     -p 3500:3500 \
     --env-file .env.local \
     omada-dashboard:latest
   ```

## Monitoring

### Health Check Endpoint

The container includes a health check that verifies the application is responding:

```bash
docker inspect --format='{{json .State.Health}}' omada-dashboard | jq
```

### Logs in Production

View structured JSON logs:

```bash
docker logs -f omada-dashboard | jq
```

### Export Logs

```bash
docker logs omada-dashboard > application.log 2>&1
```

## Support

For issues related to:
- **Docker setup**: See this guide
- **Application setup**: See README.md
- **Troubleshooting**: See TROUBLESHOOTING.md
- **API details**: See omada_api_documentation.md
