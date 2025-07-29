// Geographic Dot Strip Rankings API
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
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get top regions by metric
    const { data: regionMetrics, error } = await supabase
      .from('mv_admin2_day')
      .select('region_code, region_name, total_sales, transaction_count, unique_customers')
      .gte('date', from)
      .lte('date', to);

    if (error) throw error;

    // Aggregate by region
    const regionAgg = regionMetrics.reduce((acc: any, row: any) => {
      const key = row.region_code;
      if (!acc[key]) {
        acc[key] = {
          region_code: row.region_code,
          region_name: row.region_name,
          total_sales: 0,
          transaction_count: 0,
          unique_customers: new Set(),
        };
      }
      acc[key].total_sales += row.total_sales || 0;
      acc[key].transaction_count += row.transaction_count || 0;
      if (row.unique_customers) {
        acc[key].unique_customers.add(row.unique_customers);
      }
      return acc;
    }, {});

    // Convert to array and sort by metric
    const regions = Object.values(regionAgg)
      .map((r: any) => ({
        ...r,
        unique_customers: r.unique_customers.size,
        value: metric === 'sales' ? r.total_sales :
               metric === 'transactions' ? r.transaction_count :
               r.unique_customers.size
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, limit);

    // Calculate quantiles for color mapping
    const values = regions.map(r => r.value).filter(v => v > 0);
    const max = Math.max(...values);
    const quantiles = [0, 0.2, 0.4, 0.6, 0.8, 1].map(q => q * max);

    // Map to dot strip format
    const dotstrip = regions.map((region: any, index: number) => ({
      rank: index + 1,
      region_code: region.region_code,
      region_name: region.region_name,
      value: region.value,
      formatted_value: metric === 'sales' ? 
        `₱${(region.value / 1000000).toFixed(1)}M` :
        region.value.toLocaleString(),
      percentage: (region.value / regions[0]?.value * 100) || 0,
      color_intensity: values.findIndex(v => region.value <= v) / (values.length - 1),
    }));

    return new Response(JSON.stringify({ 
      dotstrip,
      quantiles,
      summary: {
        metric,
        date_range: { from, to },
        total: regions.reduce((sum: number, r: any) => sum + r.value, 0),
      }
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