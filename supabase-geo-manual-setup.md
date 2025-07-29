# Geographic Analytics Manual Setup Guide

Since the MCP tools are in read-only mode, here's how to manually deploy the geographic analytics components:

## 1. Apply the Migration

Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql) and run the migration from:
`supabase/migrations/024_geo_setup.sql`

This will:
- Enable PostGIS extension
- Create the `geo` schema
- Create `admin2` and `store_admin2_mapping` tables
- Create materialized view `gold.mv_admin2_day`
- Set up necessary functions and permissions

## 2. Create Storage Bucket

1. Go to [Supabase Storage](https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/storage/buckets)
2. Click "New bucket"
3. Name: `public`
4. Public bucket: Yes (check the box)
5. Click "Create bucket"

## 3. Deploy Edge Functions

Using the Supabase CLI:

```bash
# From the project root directory
cd /Users/tbwa/Library/CloudStorage/GoogleDrive-jgtolentino.rn@gmail.com/My Drive/GitHub/GitHub/tbwa-infrastructure-dashboard

# Deploy each function
supabase functions deploy geo_choropleth --project-ref cxzllzyxwpyptfretryc
supabase functions deploy geo_dotstrip --project-ref cxzllzyxwpyptfretryc
supabase functions deploy geo_admin2_ingest --project-ref cxzllzyxwpyptfretryc
supabase functions deploy refresh_geo --project-ref cxzllzyxwpyptfretryc
```

Or use the provided script:
```bash
./deploy-geo-analytics.sh
```

## 4. Upload GeoJSON Data

1. Download Philippine Admin2 GeoJSON from a reliable source
2. Upload to Storage:
   - Path: `geo/ph_admin2.geojson`
   - Bucket: `public`

## 5. Ingest Geographic Data

Once the GeoJSON is uploaded, call the ingest function:

```bash
curl -X POST https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_admin2_ingest \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "geo/ph_admin2.geojson"}'
```

## Function Endpoints

After deployment, your geographic analytics APIs will be available at:

- **Choropleth Map Data**: 
  ```
  https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_choropleth?from=2024-01-01&to=2024-12-31&metric=sales
  ```

- **Dot Strip Rankings**: 
  ```
  https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_dotstrip?from=2024-01-01&to=2024-12-31&metric=sales&limit=10
  ```

- **Admin2 Data Ingest**: 
  ```
  https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_admin2_ingest
  ```

- **Refresh Geographic Data**: 
  ```
  https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/refresh_geo
  ```

## Query Parameters

### geo_choropleth
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `metric`: 'sales' | 'transactions' | 'customers'

### geo_dotstrip
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `metric`: 'sales' | 'transactions' | 'customers'
- `limit`: Number of top regions to return (default: 10)

## Testing

After deployment, test the endpoints:

```bash
# Test choropleth endpoint
curl https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_choropleth?metric=sales

# Test dot strip endpoint
curl https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/geo_dotstrip?metric=sales&limit=5
```

## Troubleshooting

1. **PostGIS not enabled**: The migration will automatically enable it
2. **Missing data**: Run the `geo_admin2_ingest` function after uploading GeoJSON
3. **Empty results**: Run the `refresh_geo` function to update materialized views
4. **CORS issues**: The functions include CORS headers for browser access