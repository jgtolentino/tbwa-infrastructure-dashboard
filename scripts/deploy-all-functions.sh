#!/bin/bash

# Deploy All Edge Functions Script
# This script deploys all Edge Functions in the project

echo "🚀 Deploying all Edge Functions..."
echo "================================"

# Array of functions to deploy
# Note: Only including functions that exist locally
# To download remote functions: supabase functions download <function-name>
FUNCTIONS=(
    "scout-system-export"
)

# Counter for success/failure
SUCCESS=0
FAILED=0

# Deploy each function
for FUNCTION in "${FUNCTIONS[@]}"; do
    echo ""
    echo "📦 Deploying: $FUNCTION"
    echo "------------------------"
    
    if supabase functions deploy $FUNCTION; then
        echo "✅ Successfully deployed $FUNCTION"
        ((SUCCESS++))
    else
        echo "❌ Failed to deploy $FUNCTION"
        ((FAILED++))
    fi
done

echo ""
echo "================================"
echo "📊 Deployment Summary:"
echo "✅ Successful: $SUCCESS"
echo "❌ Failed: $FAILED"
echo "================================"

# List all deployed functions
echo ""
echo "📋 Current deployed functions:"
supabase functions list

# Show function URLs
echo ""
echo "🔗 Function URLs:"
for FUNCTION in "${FUNCTIONS[@]}"; do
    echo "   $FUNCTION: https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/$FUNCTION"
done