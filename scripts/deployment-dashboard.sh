#!/bin/bash

# TBWA Scout Deployment Dashboard
# Shows deployment status, logs, and metrics

echo "📊 TBWA Scout Deployment Dashboard"
echo "=================================="
echo ""

# Function to display recent deployments
show_recent_deployments() {
    echo "📋 Recent Deployments:"
    echo "---------------------"
    if [ -f deploy.log ]; then
        tail -n 10 deploy.log | while read line; do
            echo "  $line"
        done
    else
        echo "  No deployments logged yet."
    fi
    echo ""
}

# Function to show deployment statistics
show_deployment_stats() {
    echo "📈 Deployment Statistics:"
    echo "------------------------"
    if [ -f deploy.log ]; then
        TOTAL=$(grep -c "Deployment triggered" deploy.log 2>/dev/null || echo "0")
        SUCCESS=$(grep -c "✅ Successfully deployed" deploy.log 2>/dev/null || echo "0")
        FAILED=$(grep -c "❌ Failed to deploy" deploy.log 2>/dev/null || echo "0")
        
        echo "  Total Deployments: $TOTAL"
        echo "  Successful: $SUCCESS"
        echo "  Failed: $FAILED"
        if [ $TOTAL -gt 0 ]; then
            SUCCESS_RATE=$(( SUCCESS * 100 / TOTAL ))
            echo "  Success Rate: $SUCCESS_RATE%"
        fi
    else
        echo "  No deployment data available."
    fi
    echo ""
}

# Function to show current Edge Functions status
show_edge_functions_status() {
    echo "🚀 Edge Functions Status:"
    echo "------------------------"
    echo "  Checking deployed functions..."
    
    # Get list of deployed functions
    FUNCTIONS=$(supabase functions list 2>/dev/null | grep -E "(scout-system-export|project-inspector|infrastructure-tools)" | awk '{print $4 " (v" $8 ")"}')
    
    if [ -n "$FUNCTIONS" ]; then
        echo "$FUNCTIONS" | while read func; do
            echo "  ✅ $func"
        done
    else
        echo "  ⚠️  No Scout functions deployed"
    fi
    echo ""
}

# Function to show environment status
show_environment_status() {
    echo "🔧 Environment Configuration:"
    echo "----------------------------"
    if [ -f .env ]; then
        echo "  ✅ .env file exists"
        if grep -q "SUPABASE_ACCESS_TOKEN" .env; then
            echo "  ✅ Access token configured"
        else
            echo "  ❌ Access token missing"
        fi
        if grep -q "SUPABASE_PROJECT_REF" .env; then
            PROJECT_REF=$(grep "SUPABASE_PROJECT_REF" .env | cut -d'=' -f2)
            echo "  ✅ Project: $PROJECT_REF"
        else
            echo "  ❌ Project reference missing"
        fi
    else
        echo "  ❌ .env file not found"
    fi
    echo ""
}

# Function to show watcher status
show_watcher_status() {
    echo "👁️  File Watcher Status:"
    echo "----------------------"
    if pgrep -f "fswatch.*supabase/functions" > /dev/null; then
        echo "  ✅ Watcher is running"
        PID=$(pgrep -f "fswatch.*supabase/functions")
        echo "  Process ID: $PID"
    else
        echo "  ⭕ Watcher is not running"
        echo "  To start: ./scripts/watch-and-deploy.sh"
    fi
    echo ""
}

# Function to show quick actions
show_quick_actions() {
    echo "⚡ Quick Actions:"
    echo "----------------"
    echo "  1. Start watcher:     ./scripts/watch-and-deploy.sh"
    echo "  2. Deploy all:        ./scripts/deploy-all-functions.sh"
    echo "  3. View deploy log:   tail -f deploy.log"
    echo "  4. Test function:     curl https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export"
    echo "  5. Enable auto-commit: export AUTO_COMMIT_DEPLOYS=true"
    echo ""
}

# Main dashboard display
clear
show_environment_status
show_watcher_status
show_edge_functions_status
show_deployment_stats
show_recent_deployments
show_quick_actions

# Optional: Auto-refresh
if [ "$1" = "--watch" ]; then
    echo "🔄 Auto-refreshing every 5 seconds... (Press Ctrl+C to stop)"
    while true; do
        sleep 5
        clear
        show_environment_status
        show_watcher_status
        show_edge_functions_status
        show_deployment_stats
        show_recent_deployments
        show_quick_actions
    done
fi