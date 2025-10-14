#!/bin/bash

# VeloxAPI - npm Publish Script
# Publishes the package to npm registry

set -e

echo "🚀 VeloxAPI npm Publishing Script"
echo "=================================="
echo ""

# Check if logged in to npm
if ! npm whoami &> /dev/null; then
    echo "❌ Not logged in to npm"
    echo "Please run: npm login"
    exit 1
fi

echo "📦 Logged in as: $(npm whoami)"
echo ""

# Run tests first
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ All tests passed!"
echo ""

# Check package.json
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

echo "📋 Package Details:"
echo "   Name: $PACKAGE_NAME"
echo "   Version: $PACKAGE_VERSION"
echo ""

# Confirm publication
read -p "📤 Publish $PACKAGE_NAME@$PACKAGE_VERSION to npm? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 1
fi

# Publish to npm
echo ""
echo "📤 Publishing to npm..."

# For alpha/beta releases, use --tag
if [[ $PACKAGE_VERSION == *"alpha"* ]]; then
    npm publish --tag alpha --access public
elif [[ $PACKAGE_VERSION == *"beta"* ]]; then
    npm publish --tag beta --access public
else
    npm publish --access public
fi

echo ""
echo "✅ Successfully published $PACKAGE_NAME@$PACKAGE_VERSION"
echo "🔗 View at: https://www.npmjs.com/package/$PACKAGE_NAME"
echo ""
