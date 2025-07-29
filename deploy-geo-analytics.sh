#!/bin/bash

# Deploy Geographic Analytics for TBWA Infrastructure Dashboard
# This script applies the migration and deploys Edge Functions

echo "🌍 Deploying Geographic Analytics..."

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Apply the migration
echo "📋 Applying geo_setup migration..."
supabase migration up --linked

# Deploy Edge Functions
echo "🚀 Deploying Edge Functions..."

# Deploy geo_choropleth
echo "  - Deploying geo_choropleth..."
supabase functions deploy geo_choropleth --linked

# Deploy geo_dotstrip
echo "  - Deploying geo_dotstrip..."
supabase functions deploy geo_dotstrip --linked

# Deploy geo_admin2_ingest
echo "  - Deploying geo_admin2_ingest..."
supabase functions deploy geo_admin2_ingest --linked

# Deploy refresh_geo
echo "  - Deploying refresh_geo..."
supabase functions deploy refresh_geo --linked

echo "✅ Geographic Analytics deployment complete!"
echo ""
echo "Next steps:"
echo "1. Create a 'public' storage bucket in Supabase Dashboard"
echo "2. Upload your Philippine Admin2 GeoJSON file to: geo/ph_admin2.geojson"
echo "3. Call the geo_admin2_ingest function to load the data"
echo ""
echo "Function URLs:"
echo "- Choropleth API: https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_choropleth"
echo "- Dot Strip API: https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_dotstrip"
echo "- Admin2 Ingest: https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_admin2_ingest"
echo "- Refresh Geo: https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/refresh_geo"