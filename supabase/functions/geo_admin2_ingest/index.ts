// Ingest Philippine Admin2 GeoJSON
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
    const storageKey = url.searchParams.get('key') || 'geo/ph_admin2.geojson';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download GeoJSON from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('public')
      .download(storageKey);

    if (downloadError) throw downloadError;

    const geojsonText = await fileData.text();
    const geojson = JSON.parse(geojsonText);

    // Clear existing data
    const { error: deleteError } = await supabase
      .from('admin2')
      .delete()
      .neq('id', 0); // Delete all

    if (deleteError) throw deleteError;

    // Process and insert features
    const features = geojson.features || [];
    const records = features.map((feature: any) => {
      const props = feature.properties || {};
      
      // Extract region and province info
      // Adjust these based on your GeoJSON structure
      const regionName = props.NAME_1 || props.region || props.REGION || '';
      const provinceName = props.NAME_2 || props.province || props.PROVINCE || '';
      const provinceCode = props.HASC_2 || props.ADM2_PCODE || props.province_code || 
                          `PH-${provinceName.replace(/\s+/g, '').substring(0, 3).toUpperCase()}`;
      
      // Map region names to codes
      const regionMap: Record<string, string> = {
        'National Capital Region': 'NCR',
        'Ilocos Region': 'I',
        'Cagayan Valley': 'II',
        'Central Luzon': 'III',
        'CALABARZON': 'IV-A',
        'MIMAROPA': 'IV-B',
        'Bicol Region': 'V',
        'Western Visayas': 'VI',
        'Central Visayas': 'VII',
        'Eastern Visayas': 'VIII',
        'Zamboanga Peninsula': 'IX',
        'Northern Mindanao': 'X',
        'Davao Region': 'XI',
        'SOCCSKSARGEN': 'XII',
        'Caraga': 'XIII',
        'BARMM': 'BARMM',
        'Cordillera Administrative Region': 'CAR',
      };

      const regionCode = regionMap[regionName] || regionName.substring(0, 5);

      return {
        region_code: regionCode,
        region_name: regionName,
        province_code: provinceCode,
        province_name: provinceName,
        geometry: feature.geometry,
        properties: props,
      };
    });

    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('admin2')
        .insert(batch);

      if (insertError) throw insertError;
    }

    // Map stores to admin2 boundaries
    const { error: mapError } = await supabase.rpc('map_stores_to_admin2');
    if (mapError) throw mapError;

    // Refresh materialized view
    const { error: refreshError } = await supabase.rpc('refresh_admin2_metrics');
    if (refreshError) throw refreshError;

    return new Response(JSON.stringify({ 
      success: true,
      message: `Ingested ${records.length} admin2 boundaries`,
      regions: [...new Set(records.map((r: any) => r.region_name))].length,
      provinces: records.length,
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