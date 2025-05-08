#!/bin/bash

# Script to check changes on git, selectively rebuild and restart only the affected Docker services

# Configuration variables
REPO_DIR="${REPO_DIR:-$(pwd)}"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.yml}"
GIT_BRANCH="${GIT_BRANCH:-main}"
LOG_FILE="${LOG_FILE:-deploy.log}"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling function
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Define service paths mapping
declare -A SERVICE_PATHS
SERVICE_PATHS["charaserver"]="Dockerfile.server projects/server/ packages/logger/"
SERVICE_PATHS["charawidget"]="Dockerfile.widget projects/widget/"
SERVICE_PATHS["charalanding"]="Dockerfile.landing projects/landing/"
SERVICE_PATHS["charatunnel"]="Dockerfile.tunnel projects/tunnel/ packages/logger/"
SERVICE_PATHS["charaweb"]="Dockerfile.web projects/web/"

# Navigate to the repository directory
cd "$REPO_DIR" || handle_error "Could not change to repository directory: $REPO_DIR"

# Store the current commit hash
OLD_COMMIT=$(sudo -u apk git rev-parse HEAD)

# Fetch the latest changes
sudo -u apk git fetch || handle_error "Failed to fetch from the remote repository."

# Check if there are any changes
if ! sudo -u apk git diff --quiet HEAD origin/"$GIT_BRANCH"; then
    log "Changes detected, updating local repository..."

    # Pull the latest changes
    sudo -u apk git pull origin "$GIT_BRANCH" || handle_error "Failed to pull latest changes."

    # Get the new commit hash
    NEW_COMMIT=$(sudo -u apk git rev-parse HEAD)
    log "Updated to commit: $NEW_COMMIT"

    # Get the list of changed files between the two commits
    CHANGED_FILES=$(sudo -u apk git diff --name-only "$OLD_COMMIT" "$NEW_COMMIT")

    # Check if the Docker Compose file exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        handle_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    fi

    # Check if docker-compose.yml itself changed
    if echo "$CHANGED_FILES" | grep -q "$DOCKER_COMPOSE_FILE"; then
        log "Docker Compose file changed, restarting all services..."
        docker compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans || handle_error "Failed to stop Docker Compose services."
        docker compose -f "$DOCKER_COMPOSE_FILE" up -d || handle_error "Failed to start Docker Compose services."
        log "All Docker Compose services restarted successfully."
        exit 0
    fi

    # Check if package.json or other core files changed
    CORE_FILES=("package.json" "turbo.json" "tsconfig.json")
    CORE_CHANGED=false

    for CORE_FILE in "${CORE_FILES[@]}"; do
        if echo "$CHANGED_FILES" | grep -q "$CORE_FILE"; then
            CORE_CHANGED=true
            log "Core dependency file $CORE_FILE changed, will rebuild all services."
            break
        fi
    done

    if [ "$CORE_CHANGED" = true ]; then
        docker compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans || handle_error "Failed to stop Docker Compose services."
        docker compose -f "$DOCKER_COMPOSE_FILE" up -d --build || handle_error "Failed to build and start Docker Compose services."
        log "All services rebuilt and restarted due to core file changes."
        exit 0
    fi

    # Determine affected services
    declare -A AFFECTED_SERVICES

    for SERVICE in "${!SERVICE_PATHS[@]}"; do
        PATHS=${SERVICE_PATHS[$SERVICE]}
        for PATH_PATTERN in $PATHS; do
            if echo "$CHANGED_FILES" | grep -q "$PATH_PATTERN"; then
                AFFECTED_SERVICES[$SERVICE]=1
                log "Service $SERVICE needs to be rebuilt due to changes in $PATH_PATTERN"
                break
            fi
        done
    done

    # No services affected, just restart traefik to pick up any config changes
    if [ ${#AFFECTED_SERVICES[@]} -eq 0 ]; then
        log "No services affected by the changes. Checking if traefik config changed."
        if echo "$CHANGED_FILES" | grep -q "traefik/"; then
            log "Traefik configuration changed, restarting traefik service."
            docker compose -f "$DOCKER_COMPOSE_FILE" restart traefik || handle_error "Failed to restart traefik service."
        else
            log "No service-specific changes detected. No rebuild needed."
        fi
    else
        # Rebuild affected services
        REBUILD_ARGS=""
        for SERVICE in "${!AFFECTED_SERVICES[@]}"; do
            REBUILD_ARGS="$REBUILD_ARGS $SERVICE"
        done

        log "Rebuilding affected services: $REBUILD_ARGS"
        docker compose -f "$DOCKER_COMPOSE_FILE" up -d --build $REBUILD_ARGS || handle_error "Failed to rebuild and restart affected services."
        log "Successfully rebuilt and restarted affected services."
    fi

    log "Deployment completed successfully."
else
    log "No changes detected."
fi

exit 0
