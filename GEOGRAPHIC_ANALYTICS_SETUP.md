# Geographic Analytics Setup Guide

## 🗺️ Philippine Admin-2 Polygons Integration

This guide helps you deploy live Geographic Analytics with real Philippine administrative boundaries, replacing demo squares with actual province/region polygons.

## Prerequisites

- Supabase project with PostGIS enabled
- Access to Supabase Storage
- Service role key for data ingestion

## Quick Start

### 1. Set Environment Variables

Add to your `.env` file:
```bash
SUPABASE_DB_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

### 2. Deploy Geographic Analytics

```bash
# Run the deployment script
./scripts/deploy-geo-analytics.sh
```

This script will:
1. Apply database migration (creates geo schema and tables)
2. Deploy 4 Edge Functions
3. Download Philippine Admin2 boundaries
4. Upload to Supabase Storage
5. Ingest polygon data
6. Build aggregates and test endpoints

### 3. Update Your Frontend

Replace your existing Geographic Analytics component:

```tsx
// In your page (e.g., app/analytics/geographic/page.tsx)
import { GeographicAnalyticsLive } from '@/components/geo/GeographicAnalyticsLive';

export default function GeographicAnalyticsPage() {
  return (
    <div className="p-6">
      <GeographicAnalyticsLive />
    </div>
  );
}
```

## What You Get

### Before (Demo Mode)
- Grid of colored squares
- Simulated data
- Sample region names

### After (Live Mode)
- Real Philippine province boundaries
- Live Scout transaction data
- Actual region names (NCR, Calabarzon, etc.)
- Data-driven quantile coloring
- Automatic fallback to demo if API fails

## API Endpoints

Your new Geographic Analytics endpoints:

```bash
# Choropleth map data
GET /functions/v1/geo_choropleth?from=2025-06-01&to=2025-07-31&metric=sales

# Regional rankings
GET /functions/v1/geo_dotstrip?from=2025-06-01&to=2025-07-31&metric=sales&limit=10

# Refresh data
POST /functions/v1/refresh_geo
```

## Features

1. **Smart Store Mapping**:
   - Geometric joins when stores have lat/lng
   - Fuzzy name matching for text-only locations
   - Manual mapping override capability

2. **Performance Optimization**:
   - Materialized views for fast queries
   - Spatial indexes on geometry columns
   - Pre-calculated daily aggregates

3. **Live Updates**:
   - Refresh button to update mappings
   - Auto-refresh every 5 minutes (optional)
   - Real-time transaction aggregation

## Troubleshooting

### No map data showing?
```bash
# Check if polygons were ingested
psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM geo.admin2;"

# Check store mappings
psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM geo.store_admin2_mapping;"
```

### API returns empty results?
```bash
# Refresh the materialized view
curl -X POST "$SUPABASE_URL/functions/v1/refresh_geo" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Demo mode stuck?
- Check browser console for errors
- Verify environment variables
- Test API directly with curl

## Manual Philippine Boundaries Download

If the automatic download fails:

1. Visit [GADM Philippines](https://gadm.org/download_country.html)
2. Select "Philippines" and "Level 2"
3. Download GeoJSON format
4. Rename to `ph_admin2.geojson`
5. Upload manually:
```bash
supabase storage cp ph_admin2.geojson public/geo/ph_admin2.geojson
```

## Success Indicators

✅ **Live Mode Active**:
- Map shows actual Philippine provinces
- Region names are real (NCR, Region I, etc.)
- No "Demo Mode" indicator
- Data updates when filters change

⚠️ **Demo Fallback Working**:
- Grid squares appear when API fails
- "Demo Mode" shown in header
- UI remains functional
- No errors block user interaction

## Next Steps

1. **Customize regions**: Edit region mapping in `geo_admin2_ingest` function
2. **Add metrics**: Extend materialized view with your KPIs
3. **Improve mapping**: Add UI for manual store-to-region assignment
4. **Schedule refresh**: Set up cron job for automatic updates

Your Geographic Analytics is now ready with real Philippine boundaries! 🇵🇭