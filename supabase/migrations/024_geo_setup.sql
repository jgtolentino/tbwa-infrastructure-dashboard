-- Geographic Analytics Setup
-- Philippine Admin-2 Polygons with Scout AI Metrics

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create geo schema
CREATE SCHEMA IF NOT EXISTS geo;

-- Admin2 boundaries table
CREATE TABLE IF NOT EXISTS geo.admin2 (
  id SERIAL PRIMARY KEY,
  region_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  province_code TEXT UNIQUE NOT NULL,
  province_name TEXT NOT NULL,
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for performance
CREATE INDEX IF NOT EXISTS idx_admin2_geometry ON geo.admin2 USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_admin2_region ON geo.admin2(region_code);
CREATE INDEX IF NOT EXISTS idx_admin2_province ON geo.admin2(province_code);

-- Store locations to admin2 mapping
CREATE TABLE IF NOT EXISTS geo.store_admin2_mapping (
  store_id UUID PRIMARY KEY REFERENCES scout.stores(id),
  admin2_id INTEGER REFERENCES geo.admin2(id),
  confidence DECIMAL(3,2) DEFAULT 1.0,
  match_type TEXT CHECK (match_type IN ('coordinate', 'name_fuzzy', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized view for daily aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS gold.mv_admin2_day AS
WITH daily_metrics AS (
  SELECT 
    sam.admin2_id,
    DATE(t.transaction_date) as date,
    COUNT(DISTINCT t.id) as transaction_count,
    SUM(t.total_amount) as total_sales,
    COUNT(DISTINCT t.customer_id) as unique_customers,
    AVG(t.total_amount) as avg_transaction_value
  FROM scout.transactions t
  JOIN geo.store_admin2_mapping sam ON t.store_id = sam.store_id
  WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY sam.admin2_id, DATE(t.transaction_date)
)
SELECT 
  a.id as admin2_id,
  a.region_code,
  a.region_name,
  a.province_code,
  a.province_name,
  dm.date,
  dm.transaction_count,
  dm.total_sales,
  dm.unique_customers,
  dm.avg_transaction_value,
  -- Performance indicators
  CASE 
    WHEN dm.total_sales > 1000000 THEN 'high'
    WHEN dm.total_sales > 500000 THEN 'medium'
    ELSE 'low'
  END as performance_tier,
  -- Year-over-year growth (placeholder)
  0 as yoy_growth_pct
FROM geo.admin2 a
LEFT JOIN daily_metrics dm ON a.id = dm.admin2_id;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_admin2_day_date ON gold.mv_admin2_day(date);
CREATE INDEX IF NOT EXISTS idx_mv_admin2_day_region ON gold.mv_admin2_day(region_code);

-- Function to map stores to admin2 boundaries
CREATE OR REPLACE FUNCTION geo.map_stores_to_admin2()
RETURNS void AS $$
BEGIN
  -- First try coordinate-based matching
  INSERT INTO geo.store_admin2_mapping (store_id, admin2_id, confidence, match_type)
  SELECT 
    s.id,
    a.id,
    1.0,
    'coordinate'
  FROM scout.stores s
  JOIN geo.admin2 a ON ST_Contains(a.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
  WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
  ON CONFLICT (store_id) DO UPDATE
  SET admin2_id = EXCLUDED.admin2_id,
      confidence = EXCLUDED.confidence,
      match_type = EXCLUDED.match_type,
      updated_at = NOW();

  -- Then fuzzy name matching for stores without coordinates
  INSERT INTO geo.store_admin2_mapping (store_id, admin2_id, confidence, match_type)
  SELECT DISTINCT ON (s.id)
    s.id,
    a.id,
    GREATEST(
      similarity(LOWER(s.city), LOWER(a.province_name)),
      similarity(LOWER(s.province), LOWER(a.province_name)),
      similarity(LOWER(s.city), LOWER(a.region_name))
    ) as confidence,
    'name_fuzzy'
  FROM scout.stores s
  CROSS JOIN geo.admin2 a
  WHERE s.id NOT IN (SELECT store_id FROM geo.store_admin2_mapping)
    AND (s.latitude IS NULL OR s.longitude IS NULL)
    AND GREATEST(
      similarity(LOWER(s.city), LOWER(a.province_name)),
      similarity(LOWER(s.province), LOWER(a.province_name)),
      similarity(LOWER(s.city), LOWER(a.region_name))
    ) > 0.3
  ORDER BY s.id, confidence DESC
  ON CONFLICT (store_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION geo.refresh_admin2_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold.mv_admin2_day;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE geo.admin2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo.store_admin2_mapping ENABLE ROW LEVEL SECURITY;

-- Read access policies
CREATE POLICY "read_admin2" ON geo.admin2 FOR SELECT USING (true);
CREATE POLICY "read_store_mapping" ON geo.store_admin2_mapping FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON geo.admin2 TO anon, authenticated;
GRANT SELECT ON geo.store_admin2_mapping TO anon, authenticated;
GRANT SELECT ON gold.mv_admin2_day TO anon, authenticated;
GRANT EXECUTE ON FUNCTION geo.map_stores_to_admin2() TO service_role;
GRANT EXECUTE ON FUNCTION geo.refresh_admin2_metrics() TO service_role;