#!/bin/bash

echo "🗺️  Deploying Geographic Analytics with Philippine Admin-2 Polygons"
echo "=================================================================="
echo ""

# Check for required environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: SUPABASE_DB_URL not set"
    echo "Please set: export SUPABASE_DB_URL='postgresql://postgres:password@db.project.supabase.co:5432/postgres'"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set"
    exit 1
fi

# Step 1: Apply database migration
echo "📊 Step 1: Applying database migration..."
psql "$SUPABASE_DB_URL" -f supabase/migrations/024_geo_setup.sql
if [ $? -eq 0 ]; then
    echo "✅ Database migration applied successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

# Step 2: Deploy Edge Functions
echo ""
echo "🚀 Step 2: Deploying Edge Functions..."

FUNCTIONS=(
    "geo_choropleth"
    "geo_dotstrip"
    "geo_admin2_ingest"
    "refresh_geo"
)

for func in "${FUNCTIONS[@]}"; do
    echo "  Deploying $func..."
    if [ "$func" = "geo_choropleth" ] || [ "$func" = "geo_dotstrip" ]; then
        supabase functions deploy "$func" --verify-jwt
    else
        supabase functions deploy "$func" --no-verify-jwt
    fi
    
    if [ $? -eq 0 ]; then
        echo "  ✅ $func deployed"
    else
        echo "  ❌ $func deployment failed"
    fi
done

# Step 3: Download Philippine Admin2 GeoJSON
echo ""
echo "📥 Step 3: Downloading Philippine Admin2 boundaries..."

if [ ! -f "ph_admin2.geojson" ]; then
    echo "  Downloading from GADM..."
    curl -L -o ph_admin2.geojson "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_PHL_2.json"
    
    if [ $? -eq 0 ]; then
        echo "  ✅ GeoJSON downloaded successfully"
    else
        echo "  ❌ Failed to download GeoJSON"
        echo "  Please download manually from: https://gadm.org/download_country.html"
        exit 1
    fi
else
    echo "  ✅ Using existing ph_admin2.geojson"
fi

# Step 4: Upload to Supabase Storage
echo ""
echo "☁️  Step 4: Uploading GeoJSON to Supabase Storage..."

# Create storage bucket if it doesn't exist
supabase storage create public 2>/dev/null || true

# Upload file
supabase storage cp ph_admin2.geojson public/geo/ph_admin2.geojson

if [ $? -eq 0 ]; then
    echo "  ✅ GeoJSON uploaded to storage"
else
    echo "  ❌ Failed to upload GeoJSON"
    exit 1
fi

# Step 5: Ingest polygons
echo ""
echo "🔄 Step 5: Ingesting polygon data..."

INGEST_URL="${SUPABASE_URL}/functions/v1/geo_admin2_ingest?key=geo/ph_admin2.geojson"
curl -s "$INGEST_URL" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" | jq '.'

# Step 6: Build aggregates
echo ""
echo "📈 Step 6: Building aggregates..."

REFRESH_URL="${SUPABASE_URL}/functions/v1/refresh_geo"
curl -s "$REFRESH_URL" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" | jq '.'

# Step 7: Test endpoints
echo ""
echo "🧪 Step 7: Testing endpoints..."

echo "  Testing choropleth endpoint..."
TEST_CHOROPLETH=$(curl -s "${SUPABASE_URL}/functions/v1/geo_choropleth?from=2025-06-01&to=2025-07-31&metric=sales" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.features | length')

if [ "$TEST_CHOROPLETH" -gt 0 ]; then
    echo "  ✅ Choropleth endpoint working ($TEST_CHOROPLETH features)"
else
    echo "  ❌ Choropleth endpoint not returning data"
fi

echo "  Testing dotstrip endpoint..."
TEST_DOTSTRIP=$(curl -s "${SUPABASE_URL}/functions/v1/geo_dotstrip?from=2025-06-01&to=2025-07-31&metric=sales" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.dotstrip | length')

if [ "$TEST_DOTSTRIP" -gt 0 ]; then
    echo "  ✅ Dotstrip endpoint working ($TEST_DOTSTRIP regions)"
else
    echo "  ❌ Dotstrip endpoint not returning data"
fi

echo ""
echo "=================================================================="
echo "🎉 Geographic Analytics deployment complete!"
echo ""
echo "📍 Next steps:"
echo "  1. Update your frontend to use GeographicAnalyticsLive component"
echo "  2. Test at: http://localhost:3002/analytics/geographic"
echo "  3. Monitor performance with: ./scripts/deployment-dashboard.sh"
echo ""
echo "🔗 API Endpoints:"
echo "  Choropleth: ${SUPABASE_URL}/functions/v1/geo_choropleth"
echo "  Dotstrip: ${SUPABASE_URL}/functions/v1/geo_dotstrip"
echo "  Refresh: ${SUPABASE_URL}/functions/v1/refresh_geo"
echo ""