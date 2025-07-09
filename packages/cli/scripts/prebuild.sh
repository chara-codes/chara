#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}[PREBUILD]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[PREBUILD]${NC} $1"
}

print_error() {
    echo -e "${RED}[PREBUILD]${NC} $1"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$(dirname "$CLI_DIR")"
ROOT_DIR="$(dirname "$PACKAGES_DIR")"

# Package directories
WEB_DIR="$PACKAGES_DIR/web"
WIDGET_DIR="$PACKAGES_DIR/widget"
CLI_DIST_DIR="$CLI_DIR/dist"

print_step "Starting prebuild process..."
print_step "Root directory: $ROOT_DIR"
print_step "CLI directory: $CLI_DIR"
print_step "Web directory: $WEB_DIR"
print_step "Widget directory: $WIDGET_DIR"

# Change to root directory
cd "$ROOT_DIR"

# Build packages individually to avoid turbo hang
print_step "Building packages individually..."

# Build web package
print_step "Building web package..."
cd "$WEB_DIR"
if command -v bun &> /dev/null; then
    bun run build
elif command -v npm &> /dev/null; then
    npm run build
else
    print_error "Neither bun nor npm found!"
    exit 1
fi

# Build widget package
print_step "Building widget package..."
cd "$WIDGET_DIR"
if command -v bun &> /dev/null; then
    bun run build
elif command -v npm &> /dev/null; then
    npm run build
else
    print_error "Neither bun nor npm found!"
    exit 1
fi

# Build CLI package directly (avoid infinite loop with prebuild)
print_step "Building CLI package..."
cd "$CLI_DIR"
if command -v bun &> /dev/null; then
    bun build ./src/index.ts --outfile ./dist/chara --compile
elif command -v npm &> /dev/null; then
    npx bun build ./src/index.ts --outfile ./dist/chara --compile
else
    print_error "Neither bun nor npm found!"
    exit 1
fi

# Check if dist folders exist
print_step "Checking dist folders..."

if [ ! -d "$WEB_DIR/dist" ]; then
    print_error "Web dist folder not found at $WEB_DIR/dist"
    exit 1
fi

if [ ! -d "$WIDGET_DIR/dist" ]; then
    print_error "Widget dist folder not found at $WIDGET_DIR/dist"
    exit 1
fi

if [ ! -d "$CLI_DIST_DIR" ]; then
    print_error "CLI dist folder not found at $CLI_DIST_DIR"
    exit 1
fi

# Remove existing web and widget folders in CLI dist
print_step "Cleaning existing web and widget folders in CLI dist..."
rm -rf "$CLI_DIST_DIR/web"
rm -rf "$CLI_DIST_DIR/widget"

# Copy web dist to CLI dist/web
print_step "Copying web dist to CLI dist/web..."
cp -r "$WEB_DIR/dist" "$CLI_DIST_DIR/web"
print_step "✓ Web dist copied to $CLI_DIST_DIR/web"

# Copy widget dist to CLI dist/widget
print_step "Copying widget dist to CLI dist/widget..."
cp -r "$WIDGET_DIR/dist" "$CLI_DIST_DIR/widget"
print_step "✓ Widget dist copied to $CLI_DIST_DIR/widget"

# Verify the copies
print_step "Verifying copied folders..."
if [ -d "$CLI_DIST_DIR/web" ] && [ "$(ls -A "$CLI_DIST_DIR/web")" ]; then
    print_step "✓ Web folder exists and is not empty"
else
    print_error "Web folder is missing or empty"
    exit 1
fi

if [ -d "$CLI_DIST_DIR/widget" ] && [ "$(ls -A "$CLI_DIST_DIR/widget")" ]; then
    print_step "✓ Widget folder exists and is not empty"
else
    print_error "Widget folder is missing or empty"
    exit 1
fi

print_step "✅ Prebuild completed successfully!"
print_step "Final structure:"
print_step "  - $CLI_DIST_DIR/web (from web package dist)"
print_step "  - $CLI_DIST_DIR/widget (from widget package dist)"
print_step "  - $CLI_DIST_DIR/chara (CLI binary)"
