# CLI Publishing - Quick Setup Reference

## Prerequisites Checklist

- [ ] Repository has GitHub Actions enabled
- [ ] NPM account created and verified
- [ ] NPM token generated with "Automation" permissions
- [ ] `NPM_TOKEN` secret added to GitHub repository settings

## File Structure

```
chara/
├── .github/
│   ├── workflows/
│   │   ├── publish-cli.yml      # Main publishing workflow
│   │   └── test-cli.yml         # PR testing workflow
│   ├── PUBLISHING.md            # Detailed publishing guide
│   └── CLI_SETUP.md            # This file
├── packages/
│   └── cli/
│       ├── package.json         # Contains npm publishing config
│       ├── scripts/
│       │   └── bump-version.js  # Version management script
│       └── dist/
│           └── chara           # Built CLI binary
```

## Quick Commands

### For Developers

```bash
# Version management
cd packages/cli
bun run version:patch          # 1.0.0 → 1.0.1
bun run version:minor          # 1.0.0 → 1.1.0
bun run version:major          # 1.0.0 → 2.0.0
bun run version:set 1.2.3      # Set specific version
bun run version:current        # Show current version

# Local testing
bun run build                  # Build CLI
./dist/chara --help           # Test locally
npm pack --dry-run            # Test package contents
```

### For Users

```bash
# Install stable version
npm install -g chara

# Install alpha version
npm install -g chara@alpha

# Use CLI
chara --help
chara dev
```

## Publishing Workflow

### Automatic Publishing

1. **Alpha releases** (playground branch):
   - Push to `playground` branch
   - Version: `{current}-alpha.{timestamp}`
   - Tag: `alpha`
   - Command: `npm install -g chara@alpha`

2. **Stable releases** (main branch):
   - Push to `main` branch
   - Version: From `package.json`
   - Tag: `latest`
   - Command: `npm install -g chara`
   - Creates GitHub release

### Manual Publishing

1. Go to repository → Actions tab
2. Select "Publish CLI to npm"
3. Click "Run workflow"
4. Choose branch (main or playground)
5. Click "Run workflow"

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Authentication failed | Check `NPM_TOKEN` secret in GitHub settings |
| Version already exists | Bump version in `package.json` before publishing |
| Build failed | Check that all workspace dependencies build successfully |
| Binary not found | Ensure `bun run build` creates `./dist/chara` |
| Package validation failed | Run `npm pack --dry-run` to check package contents |
| Dependency resolution error | Workspace dependencies are automatically removed during publish |

## Key Files to Monitor

- `packages/cli/package.json` - Version and publishing config (workspace deps in devDependencies)
- `packages/cli/dist/chara` - Built binary (created by build process, includes all dependencies)
- `.github/workflows/publish-cli.yml` - Publishing workflow
- `.github/workflows/test-cli.yml` - PR testing workflow

## NPM Token Setup

1. Go to [npmjs.com](https://www.npmjs.com) → Profile → Access Tokens
2. Generate new token → "Automation" type
3. Copy token
4. Go to GitHub repo → Settings → Secrets and variables → Actions
5. Add secret: `NPM_TOKEN` = your token

## Testing Before Publishing

```bash
# Run full test suite
bunx turbo test --filter=chara

# Build and test CLI
bunx turbo build --filter=chara
cd packages/cli
chmod +x ./dist/chara
./dist/chara --help
./dist/chara --version

# Test package contents
npm pack --dry-run
```

## Publishing Schedule

- **Alpha**: Every push to `playground` branch
- **Stable**: Every push to `main` branch
- **Manual**: Can be triggered anytime from Actions

## Dependency Architecture

The CLI uses a special dependency setup for publishing:

- **Development**: Workspace dependencies (`@chara/*`) are in `devDependencies`
- **Build**: All dependencies are compiled into the binary with `bun build --compile`
- **Publishing**: Workspace dependencies are automatically removed from package.json
- **Runtime**: Single binary with no external dependencies

This ensures clean npm publishing without dependency conflicts.

## Support

- For publishing issues: Check GitHub Actions logs
- For CLI issues: Test locally with `./dist/chara`
- For npm issues: Verify package at [npmjs.com/package/chara](https://www.npmjs.com/package/chara)
- For dependency issues: Remember that workspace deps are compiled into the binary