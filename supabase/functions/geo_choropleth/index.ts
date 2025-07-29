// Geographic Choropleth Data API
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
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = url.searchParams.get('to') || new Date().toISOString().split('T')[0];
    const metric = url.searchParams.get('metric') || 'sales';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get aggregated metrics by admin2
    const { data: metrics, error: metricsError } = await supabase
      .from('mv_admin2_day')
      .select('admin2_id, region_name, province_name, total_sales, transaction_count, unique_customers')
      .gte('date', from)
      .lte('date', to);

    if (metricsError) throw metricsError;

    // Aggregate by admin2
    const aggregated = metrics.reduce((acc: any, row: any) => {
      const key = row.admin2_id;
      if (!acc[key]) {
        acc[key] = {
          admin2_id: row.admin2_id,
          region_name: row.region_name,
          province_name: row.province_name,
          total_sales: 0,
          transaction_count: 0,
          unique_customers: new Set(),
        };
      }
      acc[key].total_sales += row.total_sales || 0;
      acc[key].transaction_count += row.transaction_count || 0;
      if (row.unique_customers) {
        row.unique_customers.forEach((c: string) => acc[key].unique_customers.add(c));
      }
      return acc;
    }, {});

    // Convert to array and calculate unique customers
    const results = Object.values(aggregated).map((item: any) => ({
      ...item,
      unique_customers: item.unique_customers.size,
      value: metric === 'sales' ? item.total_sales : 
             metric === 'transactions' ? item.transaction_count :
             item.unique_customers.size
    }));

    // Calculate quantiles for consistent coloring
    const values = results.map((r: any) => r.value).filter((v: number) => v > 0).sort((a: number, b: number) => a - b);
    const quantiles = [0, 0.2, 0.4, 0.6, 0.8, 1].map(q => {
      const idx = Math.floor(q * (values.length - 1));
      return values[idx] || 0;
    });

    // Get GeoJSON boundaries
    const { data: boundaries, error: boundariesError } = await supabase
      .from('admin2')
      .select('id, province_code, province_name, region_name, geometry');

    if (boundariesError) throw boundariesError;

    // Merge metrics with boundaries
    const features = boundaries.map((boundary: any) => {
      const metric = results.find((r: any) => r.admin2_id === boundary.id);
      return {
        type: 'Feature',
        properties: {
          id: boundary.id,
          province_code: boundary.province_code,
          province_name: boundary.province_name,
          region_name: boundary.region_name,
          value: metric?.value || 0,
          total_sales: metric?.total_sales || 0,
          transaction_count: metric?.transaction_count || 0,
          unique_customers: metric?.unique_customers || 0,
        },
        geometry: boundary.geometry,
      };
    });

    const response = {
      type: 'FeatureCollection',
      features,
      quantiles,
      summary: {
        total_sales: results.reduce((sum: number, r: any) => sum + r.total_sales, 0),
        total_transactions: results.reduce((sum: number, r: any) => sum + r.transaction_count, 0),
        total_customers: new Set(results.flatMap((r: any) => Array.from(r.unique_customers || []))).size,
        date_range: { from, to },
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});