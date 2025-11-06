#!/bin/bash
# Restart Omada Dashboard Docker container

echo "Stopping existing container..."
docker-compose down

echo "Starting container with updated configuration..."
docker-compose up -d

echo ""
echo "Waiting for container to start..."
sleep 5

echo ""
echo "=== Container Status ==="
docker ps | grep omada-dashboard

echo ""
echo "=== Recent Logs ==="
docker logs --tail 20 omada-dashboard

echo ""
echo "=== Health Check ==="
docker inspect omada-dashboard | grep -A 5 '"Health"'

echo ""
echo "Application should be accessible at: http://localhost:3500"
