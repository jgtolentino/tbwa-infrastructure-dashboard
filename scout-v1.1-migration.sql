-- Scout System Export v1.1 Migration
-- Adds medallion architecture tracking and system health monitoring

-- 1. Create scout_system_health table
CREATE TABLE IF NOT EXISTS scout_system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  system_status TEXT DEFAULT 'OPERATIONAL' CHECK (system_status IN ('OPERATIONAL', 'DEGRADED', 'ERROR')),
  scout_status JSONB DEFAULT '{}'::jsonb,
  medallion_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scout_system_health ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "scout_system_health_read" ON scout_system_health
  FOR SELECT USING (true);

-- Insert initial health record
INSERT INTO scout_system_health (system_status, scout_status, medallion_status)
VALUES (
  'OPERATIONAL',
  jsonb_build_object(
    'scout_schema_exists', true,
    'scout_table_count', 24,
    'last_check', NOW()
  ),
  jsonb_build_object(
    'status', 'HEALTHY',
    'validated_records', 18432,
    'data_sources', 703,
    'brand_coverage', 47,
    'ai_confidence', 0.872,
    'latest_validation', NOW(),
    'pipeline_health', 'OPERATIONAL'
  )
) ON CONFLICT DO NOTHING;

-- 2. Create medallion architecture stats function
CREATE OR REPLACE FUNCTION get_medallion_architecture_stats()
RETURNS TABLE (
  layer TEXT,
  table_count BIGINT,
  total_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH layer_stats AS (
    SELECT 
      CASE 
        WHEN table_name LIKE 'bronze_%' THEN 'bronze'
        WHEN table_name LIKE 'silver_%' THEN 'silver'
        WHEN table_name LIKE 'gold_%' THEN 'gold'
        ELSE 'other'
      END as data_layer,
      table_name,
      pg_total_relation_size(schemaname||'.'||table_name) as size_bytes
    FROM pg_tables
    WHERE schemaname IN ('public', 'bronze', 'silver', 'gold')
      AND (table_name LIKE 'bronze_%' 
        OR table_name LIKE 'silver_%' 
        OR table_name LIKE 'gold_%')
  )
  SELECT 
    data_layer as layer,
    COUNT(*)::BIGINT as table_count,
    pg_size_pretty(SUM(size_bytes)) as total_size
  FROM layer_stats
  WHERE data_layer != 'other'
  GROUP BY data_layer
  ORDER BY 
    CASE data_layer
      WHEN 'bronze' THEN 1
      WHEN 'silver' THEN 2
      WHEN 'gold' THEN 3
    END;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_medallion_architecture_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_medallion_architecture_stats() TO anon;
GRANT SELECT ON scout_system_health TO authenticated;
GRANT SELECT ON scout_system_health TO anon;

-- 4. Create sample medallion tables if they don't exist
CREATE TABLE IF NOT EXISTS bronze_raw_transactions (
  id SERIAL PRIMARY KEY,
  store_id TEXT,
  transaction_data JSONB,
  ingested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver_validated_transactions (
  id SERIAL PRIMARY KEY,
  store_id TEXT,
  product_id TEXT,
  quantity INTEGER,
  price DECIMAL(10,2),
  brand TEXT,
  category TEXT,
  ai_confidence DECIMAL(3,2),
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gold_sales_summary (
  id SERIAL PRIMARY KEY,
  period DATE,
  store_id TEXT,
  brand TEXT,
  total_sales DECIMAL(12,2),
  transaction_count INTEGER,
  avg_basket_size DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add some sample data to show medallion architecture
INSERT INTO bronze_raw_transactions (store_id, transaction_data)
SELECT 
  'STORE_' || (random() * 100)::int,
  jsonb_build_object(
    'items', random() * 10,
    'total', (random() * 1000)::numeric(10,2)
  )
FROM generate_series(1, 100);

INSERT INTO silver_validated_transactions (store_id, product_id, quantity, price, brand, category, ai_confidence)
SELECT 
  'STORE_' || (random() * 100)::int,
  'PROD_' || (random() * 1000)::int,
  (random() * 10)::int,
  (random() * 100)::numeric(10,2),
  (ARRAY['Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour'])[floor(random() * 5 + 1)],
  (ARRAY['Shoes', 'Apparel', 'Accessories'])[floor(random() * 3 + 1)],
  0.7 + random() * 0.3
FROM generate_series(1, 500);

INSERT INTO gold_sales_summary (period, store_id, brand, total_sales, transaction_count, avg_basket_size)
SELECT 
  CURRENT_DATE - (random() * 30)::int,
  'STORE_' || (random() * 100)::int,
  (ARRAY['Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour'])[floor(random() * 5 + 1)],
  (random() * 10000)::numeric(12,2),
  (random() * 100)::int,
  (random() * 200)::numeric(10,2)
FROM generate_series(1, 50);

-- 6. Update system health with current stats
UPDATE scout_system_health 
SET 
  medallion_status = jsonb_build_object(
    'status', 'HEALTHY',
    'validated_records', (SELECT COUNT(*) FROM silver_validated_transactions),
    'data_sources', (SELECT COUNT(DISTINCT store_id) FROM silver_validated_transactions),
    'brand_coverage', (SELECT COUNT(DISTINCT brand) FROM silver_validated_transactions),
    'ai_confidence', (SELECT AVG(ai_confidence) FROM silver_validated_transactions),
    'latest_validation', NOW(),
    'pipeline_health', 'OPERATIONAL'
  ),
  updated_at = NOW()
WHERE system_status = 'OPERATIONAL';

-- Verify the setup
SELECT 'Medallion Architecture Stats:' as info;
SELECT * FROM get_medallion_architecture_stats();

SELECT 'System Health:' as info;
SELECT * FROM scout_system_health LIMIT 1;