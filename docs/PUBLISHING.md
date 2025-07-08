# Publishing Workflow Documentation

This document describes the automated publishing workflow for the Chara CLI package.

## Overview

The publishing system uses GitHub Actions with Changesets to automate the release process. It supports:

- **Main branch**: Stable releases to npm with `latest` tag
- **Playground branch**: Alpha releases to npm with `alpha` tag
- **Automatic changelog generation**: Using Changesets
- **Turborepo integration**: Optimized builds and caching

## How It Works

### 1. Branch-Based Releases

- **Main Branch (`main`)**: 
  - Triggers stable releases
  - Published with `latest` tag on npm
  - Version managed by Changesets
  - Creates GitHub releases with changelogs

- **Playground Branch (`playground`)**:
  - Triggers alpha releases
  - Published with `alpha` tag on npm
  - Version format: `x.y.z-alpha.{git-commit-hash}`
  - No GitHub releases created

### 2. Changesets Workflow

Changesets manage versioning and changelog generation:

1. **Create a changeset**: When making changes to the CLI
   ```bash
   bun run changeset
   ```

2. **Select packages**: Choose `chara` (the CLI package)

3. **Choose change type**:
   - `patch`: Bug fixes (1.0.0 → 1.0.1)
   - `minor`: New features (1.0.0 → 1.1.0)
   - `major`: Breaking changes (1.0.0 → 2.0.0)

4. **Write description**: Describe the changes for the changelog

### 3. GitHub Actions Workflow

The workflow (`.github/workflows/publish.yml`) runs on:
- Push to `main` or `playground` branches
- Pull requests to `main` (for testing only)

#### Jobs:

1. **Test Job**: 
   - Runs on all triggers
   - Installs dependencies
   - Runs tests
   - Builds CLI
   - Tests binary execution

2. **Publish Job** (only on push to main/playground):
   - Sets up environment (Bun, npm auth)
   - Builds all packages
   - Runs Changesets action
   - Publishes to npm with appropriate tags

## Usage Guide

### For Regular Development

1. **Make your changes** to the CLI code
2. **Create a changeset**:
   ```bash
   bun run changeset
   ```
3. **Commit both your changes and the changeset**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
4. **Push to main** (or create PR):
   ```bash
   git push origin main
   ```

### For Alpha Testing

1. **Push changes to playground branch**:
   ```bash
   git checkout playground
   git push origin playground
   ```
2. **Alpha version is automatically published** with format `x.y.z-alpha.{hash}`
3. **Install alpha version**:
   ```bash
   npm install -g chara@alpha
   ```

### Manual Publishing (Emergency)

If you need to publish manually:

1. **Ensure you're authenticated**:
   ```bash
   npm login
   ```

2. **Build the package**:
   ```bash
   cd packages/cli
   bun run build
   ```

3. **Publish**:
   ```bash
   # For stable release
   npm publish --access public

   # For alpha release
   npm publish --tag alpha --access public
   ```

## Package Configuration

The CLI package is configured for publishing with:

- **Name**: `chara` (not `@chara/cli`)
- **Binary**: `./dist/chara`
- **Public access**: Available to everyone
- **Files included**: Only `dist/chara`, `README.md`, and `LICENSE`

## Environment Setup

### Required Secrets

The following secrets must be configured in GitHub repository settings:

1. **NPM_TOKEN**: 
   - Create at https://www.npmjs.com/settings/tokens
   - Must have "Automation" type
   - Needs publish permissions

2. **GITHUB_TOKEN**: 
   - Automatically provided by GitHub Actions
   - Used for creating releases and managing repository

### Local Development

To test the publishing workflow locally:

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Build packages**:
   ```bash
   bun run build
   ```

3. **Test changeset commands**:
   ```bash
   bun run changeset:version  # Updates versions based on changesets
   bun run changeset:publish  # Would publish to npm (don't run locally)
   ```

## Troubleshooting

### Common Issues

1. **"Package not found" errors**:
   - Ensure package name is `chara` (not `@chara/cli`)
   - Check NPM_TOKEN has correct permissions

2. **Build failures**:
   - Ensure all dependencies are installed
   - Check that `bun build` command works locally

3. **Version conflicts**:
   - Check existing versions on npm: `npm view chara versions --json`
   - Ensure changeset specifies correct version bump

4. **Authentication issues**:
   - Verify NPM_TOKEN is valid and not expired
   - Check token has "Automation" type

### Debug Commands

```bash
# Check current version
cd packages/cli && node -p "require('./package.json').version"

# Check npm registry
npm view chara

# Test binary
cd packages/cli && ./dist/chara --help

# Check changeset status
bun run changeset status
```

## Best Practices

1. **Always create changesets** for CLI changes
2. **Test locally** before pushing
3. **Use semantic versioning** appropriately
4. **Write clear changeset descriptions** for users
5. **Test alpha versions** before promoting to main
6. **Keep binary small** - only include necessary files

## Related Files

- `.github/workflows/publish.yml` - Main workflow
- `packages/cli/package.json` - Package configuration
- `.changeset/config.json` - Changeset configuration
- `turbo.json` - Build configuration
- `packages/cli/.npmignore` - Files to exclude from npm