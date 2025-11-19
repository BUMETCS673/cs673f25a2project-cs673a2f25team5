#!/usr/bin/env bash
# Remote deploy script to be copied to the EC2 host and executed there.
# Expects the following env vars to be present (set by the GitHub Action):
#   IMAGE_TAG (default: 'latest')
#   BACKEND_IMAGE (backend image)
#   FRONTEND_IMAGE (frontend image)
#   DEPLOY_DIR (path where docker-compose.prod.yaml lives)
#   DOCKER_USERNAME
#   DOCKER_ACCESS_TOKEN
#
# The script:
#  - logs into docker
#  - pulls the requested images
#  - creates backend, frontend and nginx services as needed
#  - runs a health check and prints logs on failure

set -euo pipefail

TAG="${IMAGE_TAG}"
BACKEND_IMG="${BACKEND_IMAGE}:${TAG}"
FRONTEND_IMG="${FRONTEND_IMAGE}:${TAG}"
DEPLOY_DIR="${DEPLOY_DIR:-/home/ubuntu}"

echo "Starting remote deploy script"
echo "Tag: ${TAG}"
echo "Backend image: ${BACKEND_IMG}"
echo "Frontend image: ${FRONTEND_IMG}"
echo "Deploy dir: ${DEPLOY_DIR}"

# Docker login
if [ -n "${DOCKER_USERNAME}" ] && [ -n "${DOCKER_ACCESS_TOKEN}" ]; then
  echo "Logging into Docker registry as ${DOCKER_USERNAME}"
  echo "${DOCKER_ACCESS_TOKEN}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
else
  echo "No Docker registry credentials provided, cannot log in."
  exit 1
fi

# Ensure deploy directory exists and change into it
if [ ! -d "${DEPLOY_DIR}" ]; then
  echo "ERROR: Deploy directory does not exist: ${DEPLOY_DIR}"
  exit 1
fi
cd "${DEPLOY_DIR}"

echo "Pulling images..."
docker pull "${BACKEND_IMG}" || { echo "Failed to pull ${BACKEND_IMG}"; exit 1; }
docker pull "${FRONTEND_IMG}" || { echo "Failed to pull ${FRONTEND_IMG}"; exit 1; }

echo "Running docker compose pull and updating app services..."
docker compose -f docker-compose.prod.yaml pull

# Store old container IDs for potential rollback
OLD_BACKEND=$(docker ps -q -f name=event-manager-backend-prod 2>/dev/null || echo "")
OLD_FRONTEND=$(docker ps -q -f name=event-manager-frontend-prod 2>/dev/null || echo "")

echo "Starting new containers (old containers will be renamed temporarily)..."
# Rename old containers to keep them running during deployment
if [ -n "$OLD_BACKEND" ]; then
  docker rename event-manager-backend-prod event-manager-backend-prod-old 2>/dev/null || true
fi
if [ -n "$OLD_FRONTEND" ]; then
  docker rename event-manager-frontend-prod event-manager-frontend-prod-old 2>/dev/null || true
fi

# Start new containers
docker compose -f docker-compose.prod.yaml up -d --no-deps backend frontend nginx

echo "Waiting for services to become healthy (using Docker health checks)..."
# Wait for services to report healthy status
max_wait=120  # total seconds (increased for service startup)
interval=5
elapsed=0

until [ "$elapsed" -ge "$max_wait" ]; do
  # Check if all critical services are healthy
  BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' event-manager-backend-prod 2>/dev/null || echo "none")
  FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' event-manager-frontend-prod 2>/dev/null || echo "none")
  
  echo "Backend health: ${BACKEND_HEALTH}, Frontend health: ${FRONTEND_HEALTH} (elapsed: ${elapsed}s/${max_wait}s)"
  
  if [ "$BACKEND_HEALTH" = "healthy" ] && [ "$FRONTEND_HEALTH" = "healthy" ]; then
    echo "✅ All services are healthy!"
    echo "Deployment succeeded for tag: ${TAG}"
    docker compose -f docker-compose.prod.yaml ps
    
    # Remove old containers now that new ones are healthy
    echo "Removing old containers..."
    if [ -n "$OLD_BACKEND" ]; then
      docker stop event-manager-backend-prod-old 2>/dev/null || true
      docker rm event-manager-backend-prod-old 2>/dev/null || true
    fi
    if [ -n "$OLD_FRONTEND" ]; then
      docker stop event-manager-frontend-prod-old 2>/dev/null || true
      docker rm event-manager-frontend-prod-old 2>/dev/null || true
    fi
    
    # Clean up old/dangling images to prevent disk space accumulation
    echo "Cleaning up old Docker images..."
    docker image prune -f --filter "until=24h" || echo "Warning: Image cleanup failed (non-critical)"
    
    exit 0
  fi
  
  sleep "$interval"
  elapsed=$((elapsed + interval))
done

echo "❌ Health check timeout after ${max_wait}s. Services did not become healthy."
echo "Dumping compose ps and recent logs for diagnosis..."
docker compose -f docker-compose.prod.yaml ps
docker compose -f docker-compose.prod.yaml logs --tail=300

# Rollback: Stop new containers and restore old ones
echo "🔄 Rolling back to previous containers..."
docker compose -f docker-compose.prod.yaml down backend frontend 2>/dev/null || true

if [ -n "$OLD_BACKEND" ]; then
  echo "Restoring old backend container..."
  docker rename event-manager-backend-prod-old event-manager-backend-prod 2>/dev/null || true
fi
if [ -n "$OLD_FRONTEND" ]; then
  echo "Restoring old frontend container..."
  docker rename event-manager-frontend-prod-old event-manager-frontend-prod 2>/dev/null || true
fi

echo "Rollback complete. Old containers restored."
echo "Deployment failed (services not healthy)."
exit 1
