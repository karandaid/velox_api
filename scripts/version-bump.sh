#!/bin/bash

# VeloxAPI - Version Bump Script
# Updates version and creates git tag

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/version-bump.sh [patch|minor|major|<version>]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/version-bump.sh patch      # 0.2.0 -> 0.2.1"
    echo "  ./scripts/version-bump.sh minor      # 0.2.0 -> 0.3.0"
    echo "  ./scripts/version-bump.sh major      # 0.2.0 -> 1.0.0"
    echo "  ./scripts/version-bump.sh 0.3.0      # Set specific version"
    exit 1
fi

BUMP_TYPE=$1
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "🔄 Version Bump Script"
echo "====================="
echo ""
echo "Current version: $CURRENT_VERSION"
echo "Bump type: $BUMP_TYPE"
echo ""

# Update package.json version
npm version $BUMP_TYPE --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")

echo "✅ Updated to: $NEW_VERSION"
echo ""

# Update version in other files if needed
if grep -q "Version.*$CURRENT_VERSION" README.md 2>/dev/null; then
    sed -i "s/Version.*$CURRENT_VERSION/Version: $NEW_VERSION/g" README.md
    echo "✅ Updated README.md"
fi

echo ""
echo "📝 Next steps:"
echo "1. Review changes: git diff"
echo "2. Commit: git add . && git commit -m 'Bump version to $NEW_VERSION'"
echo "3. Tag: git tag v$NEW_VERSION"
echo "4. Push: git push && git push --tags"
echo "5. Publish: ./scripts/npm-publish.sh"
echo ""
