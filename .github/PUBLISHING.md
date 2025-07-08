# CLI Publishing Setup

This document describes the automated publishing workflow for the Chara CLI package.

## Overview

The Chara CLI package is automatically published to npm using GitHub Actions whenever changes are made to the `packages/cli` directory. The workflow supports two release channels:

- **Alpha releases**: Published from the `playground` branch with the `alpha` tag
- **Stable releases**: Published from the `main` branch with the `latest` tag

## Setup Requirements

### 1. NPM Token

You need to configure an NPM token in your GitHub repository secrets:

1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Click on your profile → "Access Tokens"
3. Generate a new token with "Automation" permissions
4. In your GitHub repository, go to Settings → Secrets and variables → Actions
5. Add a new secret named `NPM_TOKEN` with your npm token as the value

### 2. Repository Configuration

The workflow is configured to publish the package with the following settings:

- **Package name**: `chara`
- **Binary name**: `chara` (available as `./dist/chara`)
- **Registry**: public npm registry
- **License**: MIT

## Release Process

### Alpha Releases (playground branch)

When you push changes to the `playground` branch:

1. The workflow automatically builds the CLI
2. Creates an alpha version with timestamp: `{current-version}-alpha.{timestamp}`
3. Publishes to npm with the `alpha` tag
4. Users can install with: `npm install chara@alpha`

### Stable Releases (main branch)

When you push changes to the `main` branch:

1. The workflow builds the CLI
2. Publishes to npm with the `latest` tag
3. Creates a GitHub release with the version tag
4. Users can install with: `npm install chara` or `npm install chara@latest`

## Manual Publishing

You can also trigger the workflow manually:

1. Go to the Actions tab in your GitHub repository
2. Select "Publish CLI to npm"
3. Click "Run workflow"
4. Choose the branch you want to publish from

## Version Management

### Updating Version Numbers

Before publishing a stable release, update the version in `packages/cli/package.json`:

```bash
cd packages/cli
npm version patch  # or minor, major
```

### Alpha Versions

Alpha versions are automatically generated and don't require manual version updates. The format is:
```
{base-version}-alpha.{unix-timestamp}
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Ensure the `NPM_TOKEN` secret is correctly set
2. **Build Failure**: Check that all dependencies are properly installed
3. **Version Conflict**: Make sure you're not trying to publish an existing version

### Logs

Check the GitHub Actions logs for detailed error messages:
1. Go to Actions tab
2. Click on the failed workflow run
3. Expand the failed step to see detailed logs

## Package Contents

The published package includes:

- `dist/chara` - The compiled CLI binary
- `README.md` - Package documentation
- `LICENSE` - MIT license file
- `package.json` - Package metadata

## Testing Published Package

After publishing, you can test the package:

```bash
# Install globally
npm install -g chara@latest

# Or install alpha version
npm install -g chara@alpha

# Test the installation
chara --version
chara --help
```

## Security Considerations

- The NPM token has automation permissions only
- The workflow only runs on specific branches and paths
- All builds are isolated in GitHub's secure environment
- The package is published with public access as configured in `publishConfig`
