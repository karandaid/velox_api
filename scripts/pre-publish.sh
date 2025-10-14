#!/bin/bash

# VeloxAPI - Pre-publish Validation Script
# Runs all checks before publishing

set -e

echo "🔍 VeloxAPI Pre-Publish Validation"
echo "==================================="
echo ""

# Check Node version
echo "📋 Environment Check:"
echo "   Node: $(node --version)"
echo "   npm: $(npm --version)"
echo ""

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Warning: Uncommitted changes detected"
    git status --short
    echo ""
fi

# Run tests
echo "🧪 Running test suite..."
npm test
echo ""

# Check package.json
echo "📦 Package Validation:"
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")
PACKAGE_DESC=$(node -p "require('./package.json').description")

echo "   Name: $PACKAGE_NAME"
echo "   Version: $PACKAGE_VERSION"
echo "   Description: $PACKAGE_DESC"
echo ""

# Validate required files
echo "📁 File Check:"
FILES=("README.md" "package.json" "lib/index.js" "LICENSE")

for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing)"
    fi
done
echo ""

# Check package size
echo "📊 Package Size:"
TARBALL=$(npm pack --dry-run 2>&1 | tail -1)
echo "   $TARBALL"
echo ""

# Check what will be published
echo "📋 Files to be published:"
npm pack --dry-run 2>&1 | grep -E "^\s+\d+\.\d+\s+[kKmM]?[bB]?\s+" | head -20
echo ""

echo "✅ Pre-publish validation complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm login (if not logged in)"
echo "2. Run: ./scripts/npm-publish.sh"
echo ""
