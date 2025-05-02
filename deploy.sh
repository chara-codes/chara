#!/bin/bash

# Script to check changes on git, update local folder and gracefully restart docker compose in case of changes

# Configuration variables (modify these according to your environment)
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

# Navigate to the repository directory
cd "$REPO_DIR" || handle_error "Could not change to repository directory: $REPO_DIR"

# Store the current commit hash
OLD_COMMIT=$(sudo -u apk git rev-parse HEAD)
log "Current commit: $OLD_COMMIT"

# Fetch the latest changes
log "Fetching latest changes from the repository..."
sudo -u apk git fetch || handle_error "Failed to fetch from the remote repository."

# Check if there are any changes
if ! sudo -u apk git diff --quiet HEAD origin/"$GIT_BRANCH"; then
    log "Changes detected, updating local repository..."

    # Pull the latest changes
    sudo -u apk git pull origin "$GIT_BRANCH" || handle_error "Failed to pull latest changes."

    # Get the new commit hash
    NEW_COMMIT=$(sudo -u apk git rev-parse HEAD)
    log "Updated to commit: $NEW_COMMIT"

    # Check if the Docker Compose file exists
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        log "Restarting Docker Compose services..."

        # Gracefully restart Docker Compose services
        docker compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans || handle_error "Failed to stop Docker Compose services."
        docker compose -f "$DOCKER_COMPOSE_FILE" up -d || handle_error "Failed to start Docker Compose services."

        log "Docker Compose services restarted successfully."
    else
        handle_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    fi

    log "Deployment completed successfully."
else
    log "No changes detected, skipping deployment."
fi

exit 0
