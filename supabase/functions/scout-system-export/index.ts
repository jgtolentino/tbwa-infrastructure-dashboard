// Scout Monitoring System Export Function
// Endpoint: /scout-system-export?format=json|html|pdf
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// HTML template for PDF/HTML exports
const htmlTemplate = (data)=>`
<!DOCTYPE html>
<html>
<head>
  <title>Scout Monitoring System Status</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .status-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .status-good { border-left: 5px solid #4CAF50; }
    .status-warning { border-left: 5px solid #FF9800; }
    .status-error { border-left: 5px solid #F44336; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .metric { font-weight: bold; }
    .value { font-family: monospace; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
    .medallion-card { 
      display: flex; 
      justify-content: space-between; 
      margin: 20px 0;
    }
    .medallion-layer {
      flex: 1;
      margin: 0 10px;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .bronze { background-color: #cd7f32; color: white; }
    .silver { background-color: #C0C0C0; color: black; }
    .gold { background-color: #FFD700; color: black; }
  </style>
</head>
<body>
  <h1>Scout Monitoring System Status</h1>
  <div class="status-card ${data.system_health.system_status === 'OPERATIONAL' ? 'status-good' : data.system_health.system_status === 'DEGRADED' ? 'status-warning' : 'status-error'}">
    <h2>System Status: ${data.system_health.system_status}</h2>
    <p>Report generated: ${new Date().toISOString()}</p>
  </div>
  
  <h2>Medallion Architecture Status</h2>
  <div class="medallion-card">
    ${data.medallion_architecture.map((layer)=>`
      <div class="medallion-layer ${layer.layer.toLowerCase()}">
        <h3>${layer.layer.toUpperCase()}</h3>
        <p>${layer.table_count} tables | ${layer.total_size}</p>
      </div>
    `).join('')}
  </div>
  
  <h2>Silver Layer Validation Pipeline</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td class="metric">Status</td><td class="value">${data.system_health.medallion_status.status}</td></tr>
    <tr><td class="metric">Validated Records</td><td class="value">${data.system_health.medallion_status.validated_records}</td></tr>
    <tr><td class="metric">Data Sources</td><td class="value">${data.system_health.medallion_status.data_sources} unique stores</td></tr>
    <tr><td class="metric">Brand Coverage</td><td class="value">${data.system_health.medallion_status.brand_coverage} brands</td></tr>
    <tr><td class="metric">AI Confidence</td><td class="value">${data.system_health.medallion_status.ai_confidence?.toFixed(1)}% average</td></tr>
    <tr><td class="metric">Latest Validation</td><td class="value">${new Date(data.system_health.medallion_status.latest_validation).toLocaleString()}</td></tr>
    <tr><td class="metric">Pipeline Health</td><td class="value">${data.system_health.medallion_status.pipeline_health}</td></tr>
  </table>
  
  <h2>Database Summary</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td class="metric">Total Schemas</td><td class="value">${data.database_summary.total_schemas}</td></tr>
    <tr><td class="metric">Total Tables</td><td class="value">${data.database_summary.total_tables}</td></tr>
    <tr><td class="metric">Total Size</td><td class="value">${data.database_summary.total_size}</td></tr>
    <tr><td class="metric">Scout Tables</td><td class="value">${data.database_summary.scout_tables}</td></tr>
  </table>
  
  <h2>Scout Schema Status</h2>
  <table>
    <tr><th>Status</th><th>Table Count</th></tr>
    <tr>
      <td>${data.system_health.scout_status.scout_schema_exists ? '✅ Healthy' : '❌ Missing'}</td>
      <td>${data.system_health.scout_status.scout_table_count} tables</td>
    </tr>
  </table>
  
  <h2>Storage Report</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td class="metric">Total Database Size</td><td class="value">${data.storage_report.total_database_size}</td></tr>
    <tr><td class="metric">Scout Schema Size</td><td class="value">${data.storage_report.scout_schema_size}</td></tr>
  </table>
  
  <h2>Largest Tables</h2>
  <table>
    <tr><th>Table Name</th><th>Size</th></tr>
    ${data.storage_report.largest_tables.map((table)=>`<tr><td>${table.table_name}</td><td>${table.total_size}</td></tr>`).join('')}
  </table>
  
  <div class="footer">
    <p>TBWA Scout Monitoring System | Version 1.1 | Confidential</p>
  </div>
</body>
</html>
`;
serve(async (req)=>{
  try {
    // Get format from query params
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Collect all system data
    const [{ data: dbSummary }, { data: scoutStatus }, { data: storageReport }, { data: medallionArchitecture }, { data: systemHealth }] = await Promise.all([
      supabase.rpc('get_database_summary').single(),
      supabase.rpc('check_scout_schema_status').single(),
      supabase.rpc('get_storage_report').single(),
      supabase.rpc('get_medallion_architecture_stats'),
      supabase.from('scout_system_health').select('*').single()
    ]);
    // Combine all data
    const systemStatus = {
      timestamp: new Date().toISOString(),
      database_summary: dbSummary,
      scout_status: scoutStatus,
      storage_report: storageReport,
      medallion_architecture: medallionArchitecture,
      system_health: systemHealth
    };
    // Return data in requested format
    switch(format.toLowerCase()){
      case 'html':
        return new Response(htmlTemplate(systemStatus), {
          headers: {
            'Content-Type': 'text/html'
          }
        });
      case 'pdf':
        // In a real implementation, you would use a PDF generation library
        // For this example, we'll just return HTML with a note
        return new Response(htmlTemplate(systemStatus) + '<script>alert("In production, this would be converted to PDF");</script>', {
          headers: {
            'Content-Type': 'text/html'
          }
        });
      case 'json':
      default:
        return new Response(JSON.stringify(systemStatus, null, 2), {
          headers: {
            'Content-Type': 'application/json'
          }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to generate system status report',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
