// Refresh Geographic Analytics Data
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Re-map stores to admin2 boundaries
    const { error: mapError } = await supabase.rpc('map_stores_to_admin2');
    if (mapError) throw mapError;

    // Step 2: Get mapping statistics
    const { data: mappingStats, error: statsError } = await supabase
      .from('store_admin2_mapping')
      .select('match_type')
      .order('match_type');

    if (statsError) throw statsError;

    // Count by match type
    const matchTypeCounts = mappingStats.reduce((acc: any, row: any) => {
      acc[row.match_type] = (acc[row.match_type] || 0) + 1;
      return acc;
    }, {});

    // Step 3: Refresh materialized view
    const { error: refreshError } = await supabase.rpc('refresh_admin2_metrics');
    if (refreshError) throw refreshError;

    // Step 4: Get summary statistics
    const { data: summary, error: summaryError } = await supabase
      .from('mv_admin2_day')
      .select('admin2_id')
      .not('total_sales', 'is', null);

    if (summaryError) throw summaryError;

    const activeRegions = new Set(summary.map((s: any) => s.admin2_id)).size;

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      mapping_stats: {
        total_stores_mapped: Object.values(matchTypeCounts).reduce((a: any, b: any) => a + b, 0),
        by_type: matchTypeCounts,
      },
      metrics_stats: {
        active_regions: activeRegions,
        total_records: summary.length,
      },
      message: 'Geographic analytics data refreshed successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});