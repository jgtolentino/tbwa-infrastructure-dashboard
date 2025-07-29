-- Scout Medallion Architecture Patch v1.1
-- Final production-ready version with all fixes applied
-- TBWA Neural Infrastructure - Scout System Export Enhancement

-- ============================================
-- 1. MEDALLION ARCHITECTURE STATS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION scout.get_medallion_architecture_stats()
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
    -- Bronze layer
    SELECT 
      'bronze' as data_layer,
      t.tablename as table_name,
      pg_total_relation_size('bronze.' || t.tablename) as size_bytes
    FROM pg_tables t
    WHERE t.schemaname = 'bronze'
    
    UNION ALL
    
    -- Silver layer
    SELECT 
      'silver' as data_layer,
      t.tablename as table_name,
      pg_total_relation_size('silver.' || t.tablename) as size_bytes
    FROM pg_tables t
    WHERE t.schemaname = 'silver'
    
    UNION ALL
    
    -- Gold layer
    SELECT 
      'gold' as data_layer,
      t.tablename as table_name,
      pg_total_relation_size('gold.' || t.tablename) as size_bytes
    FROM pg_tables t
    WHERE t.schemaname = 'gold'
  )
  SELECT 
    data_layer as layer,
    COUNT(*)::BIGINT as table_count,
    pg_size_pretty(COALESCE(SUM(size_bytes), 0)) as total_size
  FROM layer_stats
  GROUP BY data_layer
  ORDER BY 
    CASE data_layer
      WHEN 'bronze' THEN 1
      WHEN 'silver' THEN 2
      WHEN 'gold' THEN 3
    END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION scout.get_medallion_architecture_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION scout.get_medallion_architecture_stats() TO anon;

-- ============================================
-- 2. SCOUT SYSTEM HEALTH TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scout.scout_system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  system_status TEXT DEFAULT 'OPERATIONAL' CHECK (system_status IN ('OPERATIONAL', 'DEGRADED', 'ERROR')),
  scout_status JSONB DEFAULT '{}'::jsonb,
  medallion_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scout.scout_system_health ENABLE ROW LEVEL SECURITY;

-- Create read policy
CREATE POLICY "scout_system_health_read" ON scout.scout_system_health
  FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON scout.scout_system_health TO authenticated;
GRANT SELECT ON scout.scout_system_health TO anon;

-- ============================================
-- 3. POPULATE INITIAL SYSTEM HEALTH
-- ============================================
INSERT INTO scout.scout_system_health (system_status, scout_status, medallion_status)
VALUES (
  'OPERATIONAL',
  jsonb_build_object(
    'scout_schema_exists', true,
    'scout_table_count', (
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = 'scout' 
        OR (table_schema = 'public' AND table_name LIKE 'scout_%')
    ),
    'last_check', NOW()
  ),
  jsonb_build_object(
    'status', 'HEALTHY',
    'validated_records', (SELECT COUNT(*) FROM silver.validated_transactions),
    'data_sources', (SELECT COUNT(DISTINCT store_id) FROM silver.validated_transactions),
    'brand_coverage', (SELECT COUNT(DISTINCT brand_name) FROM silver.validated_transactions),
    'ai_confidence', (SELECT AVG(ai_confidence_score) FROM silver.validated_transactions),
    'latest_validation', NOW(),
    'pipeline_health', 'OPERATIONAL'
  )
) ON CONFLICT (id) DO UPDATE SET
  medallion_status = EXCLUDED.medallion_status,
  updated_at = NOW();

-- ============================================
-- 4. CREATE DASHBOARD VIEW
-- ============================================
CREATE OR REPLACE VIEW gold.medallion_dashboard_summary AS
SELECT
  s.system_status,
  s.updated_at,
  s.medallion_status->>'status' AS medallion_status,
  (s.medallion_status->>'validated_records')::INTEGER AS validated_records,
  (s.medallion_status->>'data_sources')::INTEGER AS unique_stores,
  (s.medallion_status->>'brand_coverage')::INTEGER AS brands_covered,
  (s.medallion_status->>'ai_confidence')::NUMERIC(3,3) AS ai_confidence_avg,
  s.medallion_status->>'pipeline_health' AS pipeline_health,
  s.scout_status->>'scout_table_count' AS scout_tables,
  m.bronze_tables,
  m.bronze_size,
  m.silver_tables,
  m.silver_size,
  m.gold_tables,
  m.gold_size
FROM scout.scout_system_health s
CROSS JOIN LATERAL (
  SELECT 
    MAX(CASE WHEN layer = 'bronze' THEN table_count END) as bronze_tables,
    MAX(CASE WHEN layer = 'bronze' THEN total_size END) as bronze_size,
    MAX(CASE WHEN layer = 'silver' THEN table_count END) as silver_tables,
    MAX(CASE WHEN layer = 'silver' THEN total_size END) as silver_size,
    MAX(CASE WHEN layer = 'gold' THEN table_count END) as gold_tables,
    MAX(CASE WHEN layer = 'gold' THEN total_size END) as gold_size
  FROM scout.get_medallion_architecture_stats()
) m
ORDER BY s.updated_at DESC
LIMIT 1;

-- Grant view permissions
GRANT SELECT ON gold.medallion_dashboard_summary TO authenticated;
GRANT SELECT ON gold.medallion_dashboard_summary TO anon;

-- ============================================
-- 5. REFRESH FUNCTION FOR CRON/PULSER
-- ============================================
CREATE OR REPLACE FUNCTION scout.refresh_medallion_status()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE scout.scout_system_health 
  SET 
    scout_status = jsonb_build_object(
      'scout_schema_exists', true,
      'scout_table_count', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'scout' 
          OR (table_schema = 'public' AND table_name LIKE 'scout_%')
      ),
      'last_check', NOW()
    ),
    medallion_status = jsonb_build_object(
      'status', 'HEALTHY',
      'validated_records', (SELECT COUNT(*) FROM silver.validated_transactions),
      'data_sources', (SELECT COUNT(DISTINCT store_id) FROM silver.validated_transactions),
      'brand_coverage', (SELECT COUNT(DISTINCT brand_name) FROM silver.validated_transactions),
      'ai_confidence', (SELECT ROUND(AVG(ai_confidence_score)::numeric, 3) FROM silver.validated_transactions),
      'latest_validation', NOW(),
      'pipeline_health', 'OPERATIONAL'
    ),
    updated_at = NOW()
  WHERE system_status = 'OPERATIONAL';
END;
$$;

GRANT EXECUTE ON FUNCTION scout.refresh_medallion_status() TO authenticated;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================
-- Test medallion stats
SELECT 'Medallion Architecture:' as info;
SELECT * FROM scout.get_medallion_architecture_stats();

-- Test system health
SELECT 'System Health:' as info;
SELECT * FROM scout.scout_system_health ORDER BY updated_at DESC LIMIT 1;

-- Test dashboard view
SELECT 'Dashboard Summary:' as info;
SELECT * FROM gold.medallion_dashboard_summary;

-- ============================================
-- END OF PATCH v1.1
-- ============================================