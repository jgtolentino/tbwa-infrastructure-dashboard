#!/bin/bash

# Enable auto-commit for deployments

echo "🔧 Configuring Auto-Commit for Deployments"
echo "=========================================="
echo ""

# Add to .env if not already present
if ! grep -q "AUTO_COMMIT_DEPLOYS" .env 2>/dev/null; then
    echo "" >> .env
    echo "# Auto-commit successful deployments" >> .env
    echo "AUTO_COMMIT_DEPLOYS=true" >> .env
    echo "✅ Added AUTO_COMMIT_DEPLOYS=true to .env"
else
    # Update existing value
    sed -i.bak 's/AUTO_COMMIT_DEPLOYS=.*/AUTO_COMMIT_DEPLOYS=true/' .env
    echo "✅ Updated AUTO_COMMIT_DEPLOYS to true"
fi

echo ""
echo "📝 Auto-commit is now ENABLED!"
echo ""
echo "When the file watcher deploys successfully, it will:"
echo "  1. Deploy the Edge Function"
echo "  2. Commit the changes with a descriptive message"
echo "  3. Log the deployment in deploy.log"
echo ""
echo "To disable auto-commit, run:"
echo "  export AUTO_COMMIT_DEPLOYS=false"
echo ""
echo "🚀 Start the watcher with:"
echo "  export AUTO_COMMIT_DEPLOYS=true && ./scripts/watch-and-deploy.sh"