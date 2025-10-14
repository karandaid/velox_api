# VeloxAPI Publishing Scripts

Simple bash scripts to publish your framework to npm.

## 📦 Quick Start - Publish to npm

### First Time Only

```bash
# 1. Login to npm (one time only)
npm login
```

### Publish Current Version

```bash
# Just run this - it handles everything!
./scripts/npm-publish.sh
```

That's it! The script will:
- ✅ Run all tests automatically
- ✅ Verify you're logged in
- ✅ Publish to npm with correct tags
- ✅ Show you the npm package URL

---

## 🔧 Available Scripts

### `npm-publish.sh` - Publish to npm (Main Script)
**Use this to publish your package**

```bash
./scripts/npm-publish.sh
```

Automatically:
- Checks npm login
- Runs full test suite (148 tests)
- Detects version type (alpha/beta/stable)
- Publishes with correct npm tags
- Makes package public

### `pre-publish.sh` - Validation Check (Optional)
**Use this to check everything before publishing**

```bash
./scripts/pre-publish.sh
```

Shows:
- Test results
- Package size
- Files that will be published
- Any issues to fix

### `version-bump.sh` - Update Version (Optional)
**Use this when you want to release a new version**

```bash
# Patch: 0.2.0 → 0.2.1 (bug fixes)
./scripts/version-bump.sh patch

# Minor: 0.2.0 → 0.3.0 (new features)
./scripts/version-bump.sh minor

# Major: 0.2.0 → 1.0.0 (breaking changes)
./scripts/version-bump.sh major

# Custom version
./scripts/version-bump.sh 0.3.0-beta.1
```

---

## 🚀 Common Workflows

### Publish Alpha Release (Current v0.2.0-alpha.1)

```bash
npm login                    # If not already logged in
./scripts/npm-publish.sh     # Publish!
```

### Publish Next Version

```bash
# 1. Update version
./scripts/version-bump.sh minor

# 2. Commit version change
git add .
git commit -m "Bump version to v0.3.0"

# 3. Publish to npm
./scripts/npm-publish.sh

# 4. Push to GitHub
git push && git push --tags
```

### Check Before Publishing

```bash
./scripts/pre-publish.sh     # Check everything
./scripts/npm-publish.sh     # Publish if all good
```

---

## 📋 What Gets Published

✅ **Included:**
- `lib/` - Framework source code
- `tests/` - Test suite
- `examples/` - Example code
- `docs/` - Documentation
- `learn/` - Tutorials
- `README.md`, `LICENSE`, etc.

❌ **Excluded (from .npmignore or .gitignore):**
- `node_modules/`
- Test coverage files
- Development files
- Private scripts

---

## 💡 Tips

### Check What Will Be Published
```bash
npm pack --dry-run
```

### View Package After Publishing
```bash
# Your package will be at:
# https://www.npmjs.com/package/veloxapi
```

### Publish Alpha/Beta Releases
The script automatically detects version tags:
- `0.2.0-alpha.1` → publishes with `--tag alpha`
- `0.3.0-beta.1` → publishes with `--tag beta`
- `1.0.0` → publishes with `--tag latest`

Users can install specific tags:
```bash
npm install veloxapi          # Latest stable
npm install veloxapi@alpha    # Alpha release
npm install veloxapi@beta     # Beta release
```

---

## 🆘 Troubleshooting

### "Not logged in to npm"
```bash
npm login
```

### "Tests failed"
Fix the failing tests before publishing:
```bash
npm test
```

### "Version already exists"
Bump the version first:
```bash
./scripts/version-bump.sh patch
```

### "Permission denied"
Make scripts executable:
```bash
chmod +x scripts/*.sh
```

---

## ✅ Quick Reference

| Task | Command |
|------|---------|
| Publish current version | `./scripts/npm-publish.sh` |
| Check before publishing | `./scripts/pre-publish.sh` |
| Bump patch version | `./scripts/version-bump.sh patch` |
| Bump minor version | `./scripts/version-bump.sh minor` |
| Login to npm | `npm login` |
| View on npm | https://www.npmjs.com/package/veloxapi |
