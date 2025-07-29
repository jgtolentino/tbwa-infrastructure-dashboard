#!/bin/bash

# TBWA Infrastructure Dashboard Startup Script
# This script will install dependencies and start the dashboard on localhost:3002

set -e  # Exit on any error

PROJECT_PATH="/Users/tbwa/Library/CloudStorage/GoogleDrive-jgtolentino.rn@gmail.com/My Drive/GitHub/GitHub/tbwa-infrastructure-dashboard"

echo "🚀 Starting TBWA Infrastructure Dashboard..."
echo "📁 Project path: $PROJECT_PATH"

# Navigate to project directory
cd "$PROJECT_PATH"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if .env.local exists and has Supabase URL
if [ ! -f ".env.local" ] || ! grep -q "NEXT_PUBLIC_SUPABASE_URL" ".env.local"; then
    echo "⚠️  Environment file missing or incomplete"
    echo "💡 Please add your Supabase credentials to .env.local"
    echo "   Example:"
    echo "   NEXT_PUBLIC_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo ""
fi

echo "🌟 Starting development server on port 3002..."
echo "🔗 Dashboard will be available at: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
