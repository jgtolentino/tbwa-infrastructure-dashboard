#!/bin/bash

# Watch and Deploy Script for Supabase Edge Functions
# This script watches for changes in Edge Functions and automatically deploys them

echo "🔍 Watching for changes in Edge Functions..."
echo "Press Ctrl+C to stop watching"

# Function to deploy a specific function
deploy_function() {
    local function_name=$1
    echo "🚀 Deploying $function_name..."
    
    if supabase functions deploy $function_name; then
        echo "✅ Successfully deployed $function_name"
        echo "🔗 Function URL: https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/$function_name"
    else
        echo "❌ Failed to deploy $function_name"
    fi
}

# Function to check if file is in a specific function directory
get_function_from_path() {
    local file_path=$1
    
    if [[ $file_path == *"project-inspector"* ]]; then
        echo "project-inspector"
    elif [[ $file_path == *"scout-system-export"* ]]; then
        echo "scout-system-export"
    elif [[ $file_path == *"infrastructure-tools"* ]]; then
        echo "infrastructure-tools"
    else
        echo ""
    fi
}

# Check if fswatch is installed
if ! command -v fswatch &> /dev/null; then
    echo "❌ fswatch is not installed. Installing..."
    
    # Check OS and install fswatch
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install fswatch
    else
        # Linux
        echo "Please install fswatch manually:"
        echo "  Ubuntu/Debian: sudo apt-get install fswatch"
        echo "  RHEL/CentOS: sudo yum install fswatch"
        exit 1
    fi
fi

# Watch for changes
fswatch -r ./supabase/functions | while read file; do
    echo "📝 Change detected in: $file"
    
    # Get the function name from the file path
    function_name=$(get_function_from_path "$file")
    
    if [ -n "$function_name" ]; then
        # Log deployment attempt
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment triggered for $function_name" >> deploy.log
        
        # Deploy and log result
        if deploy_function "$function_name"; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Successfully deployed $function_name" >> deploy.log
            
            # Auto-commit successful deployments (optional)
            if [ "${AUTO_COMMIT_DEPLOYS}" = "true" ]; then
                git add -A
                git commit -m "🚀 Auto-deploy: Updated $function_name Edge Function

Deployed at: $(date '+%Y-%m-%d %H:%M:%S')
Function URL: https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/$function_name

[skip ci]" || true
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📝 Auto-committed deployment changes" >> deploy.log
            fi
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Failed to deploy $function_name" >> deploy.log
        fi
    else
        echo "⚠️  Changed file is not in a recognized function directory"
    fi
    
    echo "👀 Continuing to watch for changes..."
done