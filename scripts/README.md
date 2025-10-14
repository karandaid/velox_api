# VeloxAPI Publishing Scripts

Bash scripts to help with npm publishing workflow.

## Scripts

### 1. `pre-publish.sh` - Pre-publish Validation
Validates everything before publishing:
- Runs full test suite
- Checks package.json configuration
- Validates required files exist
- Shows package size and contents
- Checks for uncommitted changes

```bash
./scripts/pre-publish.sh
```

### 2. `npm-publish.sh` - Publish to npm
Publishes the package to npm registry:
- Verifies npm login
- Runs tests
- Publishes with correct tags (alpha/beta/latest)
- Provides npm package URL

```bash
./scripts/npm-publish.sh
```

### 3. `version-bump.sh` - Version Management
Updates version across all files:
- Bumps package.json version
- Updates README.md
- Provides git tag instructions

```bash
# Patch version (0.2.0 -> 0.2.1)
./scripts/version-bump.sh patch

# Minor version (0.2.0 -> 0.3.0)
./scripts/version-bump.sh minor

# Major version (0.2.0 -> 1.0.0)
./scripts/version-bump.sh major

# Specific version
./scripts/version-bump.sh 0.3.0-beta.1
```

## Publishing Workflow

### First Time Setup
```bash
# 1. Login to npm
npm login

# 2. Validate package
./scripts/pre-publish.sh
```

### Publishing Alpha Release (Current)
```bash
# Publish v0.2.0-alpha.1
./scripts/npm-publish.sh
```

### Publishing Next Version
```bash
# 1. Bump version
./scripts/version-bump.sh minor  # or patch/major

# 2. Commit changes
git add .
git commit -m "Bump version to v0.3.0"

# 3. Validate
./scripts/pre-publish.sh

# 4. Publish
./scripts/npm-publish.sh

# 5. Push to Git
git push && git push --tags
```

## Notes

- **Alpha/Beta releases** automatically use `--tag alpha/beta` flag
- **Public access** is set by default (`--access public`)
- All scripts run tests before publishing
- Scripts are safe to run multiple times
