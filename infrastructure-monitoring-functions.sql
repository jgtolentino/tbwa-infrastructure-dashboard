-- TBWA Infrastructure Monitoring Functions
-- These functions enable the infrastructure dashboard to monitor database health

-- 1. Database Summary Function
CREATE OR REPLACE FUNCTION get_database_summary()
RETURNS TABLE (
  total_schemas bigint,
  total_tables bigint,
  total_size text,
  scout_tables bigint,
  other_schemas jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH schema_stats AS (
    SELECT 
      n.nspname as schema_name,
      COUNT(c.oid) as table_count
    FROM pg_namespace n
    LEFT JOIN pg_class c ON n.oid = c.relnamespace AND c.relkind = 'r'
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    GROUP BY n.nspname
  )
  SELECT 
    COUNT(DISTINCT schema_name)::bigint as total_schemas,
    SUM(table_count)::bigint as total_tables,
    pg_size_pretty(pg_database_size(current_database())) as total_size,
    COALESCE(SUM(CASE WHEN schema_name = 'scout' THEN table_count ELSE 0 END), 0)::bigint as scout_tables,
    jsonb_agg(
      jsonb_build_object(
        'schema_name', schema_name,
        'table_count', table_count
      ) ORDER BY table_count DESC
    ) as other_schemas
  FROM schema_stats;
END;
$$;

-- 2. Scout Schema Status Check
CREATE OR REPLACE FUNCTION check_scout_schema_status()
RETURNS TABLE (
  schema_exists boolean,
  table_count integer,
  tables jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'scout') as schema_exists,
    COUNT(*)::integer as table_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'table_name', table_name,
          'row_count', 0
        ) ORDER BY table_name
      ),
      '[]'::jsonb
    ) as tables
  FROM information_schema.tables 
  WHERE table_schema = 'scout' 
    AND table_type = 'BASE TABLE';
END;
$$;

-- 3. Storage Report Function
CREATE OR REPLACE FUNCTION get_storage_report()
RETURNS TABLE (
  total_database_size text,
  scout_schema_size text,
  largest_tables jsonb,
  storage_by_schema jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH table_sizes AS (
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
      pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ),
  schema_sizes AS (
    SELECT 
      schemaname,
      SUM(size_bytes) as total_bytes,
      pg_size_pretty(SUM(size_bytes)) as total_size
    FROM table_sizes
    GROUP BY schemaname
  )
  SELECT 
    pg_size_pretty(pg_database_size(current_database())) as total_database_size,
    COALESCE(
      (SELECT total_size FROM schema_sizes WHERE schemaname = 'scout'),
      '0 bytes'
    ) as scout_schema_size,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table_name', schemaname || '.' || tablename,
          'total_size', total_size,
          'row_count', 0
        ) ORDER BY size_bytes DESC LIMIT 10
      )
      FROM table_sizes
    ) as largest_tables,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'schema_name', schemaname,
          'total_size', total_size
        ) ORDER BY total_bytes DESC
      )
      FROM schema_sizes
    ) as storage_by_schema;
END;
$$;

-- 4. Schema Analysis Function
CREATE OR REPLACE FUNCTION analyze_scout_schema()
RETURNS TABLE (
  schema_name text,
  tables jsonb,
  indexes jsonb,
  constraints jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'scout' as schema_name,
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'table_name', t.table_name,
            'column_count', (
              SELECT COUNT(*) 
              FROM information_schema.columns c 
              WHERE c.table_schema = t.table_schema 
                AND c.table_name = t.table_name
            ),
            'row_count', 0
          ) ORDER BY t.table_name
        ),
        '[]'::jsonb
      )
      FROM information_schema.tables t
      WHERE t.table_schema = 'scout' 
        AND t.table_type = 'BASE TABLE'
    ) as tables,
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'index_name', indexname,
            'table_name', tablename
          ) ORDER BY indexname
        ),
        '[]'::jsonb
      )
      FROM pg_indexes
      WHERE schemaname = 'scout'
    ) as indexes,
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'constraint_name', tc.constraint_name,
            'table_name', tc.table_name,
            'constraint_type', tc.constraint_type
          ) ORDER BY tc.table_name, tc.constraint_name
        ),
        '[]'::jsonb
      )
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'scout'
    ) as constraints;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_database_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION check_scout_schema_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_report() TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_scout_schema() TO authenticated;

-- Grant execute permissions to anon users (for public dashboards)
GRANT EXECUTE ON FUNCTION get_database_summary() TO anon;
GRANT EXECUTE ON FUNCTION check_scout_schema_status() TO anon;
GRANT EXECUTE ON FUNCTION get_storage_report() TO anon;
GRANT EXECUTE ON FUNCTION analyze_scout_schema() TO anon;