# Release Management with Auto

This project uses [Auto](https://github.com/intuit/auto) for automated release management. Auto generates releases based on PR labels and conventional commits.

## Setup

Auto is configured via `.autorc` files in the root and `packages/cli` directories. The main configuration includes:

- **Labels**: Define release types (major, minor, patch, skip)
- **Plugins**: npm, released, first-time-contributor, all-contributors
- **Branches**: `main` for production, `playground` for canary releases

## Release Process

### 1. Label Your PRs

When creating a PR, add one of these labels to determine the release type:

- `💥 Breaking Change` - Major version bump
- `🚀 Feature` - Minor version bump  
- `🐛 Bug Fix` - Patch version bump
- `📚 Documentation` - Patch version bump
- `🏠 Internal` - Patch version bump
- `🏃 Performance` - Patch version bump
- `📦 Dependencies` - Patch version bump
- `🚫 Skip Release` - Skip this PR from releases

### 2. Automated Releases

Releases happen automatically via GitHub Actions:

- **Main branch**: Production releases with `auto shipit`
- **Playground branch**: Canary releases with `auto canary`

### 3. Manual Release Commands

You can also trigger releases manually:

```bash
# Check release status
bun run release:check

# Setup GitHub labels (run once)
bun run release:labels

# Dry run (test without publishing)
bun run release:dry-run

# Create canary release
bun run release:canary

# Create next release
bun run release:next

# Ship production release
bun run release
```

## Auto Features

### Changelog Generation

Auto automatically generates changelogs based on PR labels and descriptions. Each release gets:

- Categorized changes by type
- PR links and author credits
- First-time contributor recognition

### Version Bumping

Version bumps follow semantic versioning:

- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes, docs, internal changes

### GitHub Releases

Auto creates GitHub releases with:

- Release notes from changelog
- Asset uploads (if configured)
- Tag creation

## Branch Strategy

- **main**: Production releases only
- **playground**: Canary/alpha releases for testing
- **feature branches**: Use canary releases for preview

## Configuration Files

- `.autorc` - Main auto configuration
- `packages/cli/.autorc` - CLI-specific overrides
- `scripts/auto-release.js` - Helper script for manual releases

## Migration from Changesets

This project was migrated from Changesets to Auto. Key differences:

- **No changeset files**: Use PR labels instead
- **Automated versioning**: No manual version bumping
- **Integrated publishing**: Releases happen in CI/CD

## Troubleshooting

### Missing Labels

If a PR doesn't have a label, auto will skip it from releases. Add the appropriate label to include it.

### Failed Releases

Check the GitHub Actions logs for detailed error messages. Common issues:

- Missing NPM_TOKEN secret
- Insufficient GitHub permissions
- Network connectivity issues

### Canary Releases

Canary releases are created from non-main branches and tagged with `-canary.{hash}`. They're useful for testing features before merging.

## Resources

- [Auto Documentation](https://intuit.github.io/auto/)
- [Auto GitHub Repository](https://github.com/intuit/auto)
- [NPM Plugin Documentation](https://intuit.github.io/auto/docs/plugins/npm)