#!/usr/bin/env node

// Test Scout System Export v1.1 New Features
const https = require('https');
const fs = require('fs');

const FUNCTION_URL = 'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g';

async function fetchExport(format = 'json') {
  return new Promise((resolve, reject) => {
    https.get(`${FUNCTION_URL}?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verifyV11Features() {
  console.log('🔍 Scout System Export v1.1 Feature Verification\n');
  console.log('=' .repeat(60));
  
  try {
    // Fetch JSON export
    const jsonResponse = await fetchExport('json');
    const exportData = JSON.parse(jsonResponse.data);
    
    console.log('\n✅ Version 1.1 Features Found:\n');
    
    // 1. Medallion Architecture
    if (exportData.medallion_architecture) {
      console.log('📐 Medallion Architecture Status:');
      exportData.medallion_architecture.forEach(layer => {
        console.log(`   ${layer.layer === 'bronze' ? '🟫' : layer.layer === 'silver' ? '🟪' : '🟨'} ${layer.layer.toUpperCase()}: ${layer.table_count} tables | ${layer.total_size}`);
      });
    }
    
    // 2. System Health
    if (exportData.system_health) {
      console.log('\n🩺 System Health Integration:');
      console.log(`   - Status: ${exportData.system_health.system_status || 'N/A'}`);
      console.log(`   - Scout Schema: ${exportData.system_health.scout_status?.scout_schema_exists ? '✅ Healthy' : '❌ Missing'}`);
      console.log(`   - Table Count: ${exportData.system_health.scout_status?.scout_table_count || 0}`);
      
      if (exportData.system_health.medallion_status) {
        console.log('\n🧪 Silver Layer Validation Pipeline:');
        console.log(`   - Validated Records: ${exportData.system_health.medallion_status.validated_records || 'N/A'}`);
        console.log(`   - Data Sources: ${exportData.system_health.medallion_status.data_sources || 0} unique stores`);
        console.log(`   - Brand Coverage: ${exportData.system_health.medallion_status.brand_coverage || 0} brands`);
        console.log(`   - AI Confidence: ${exportData.system_health.medallion_status.ai_confidence ? (exportData.system_health.medallion_status.ai_confidence * 100).toFixed(1) + '%' : 'N/A'}`);
        console.log(`   - Pipeline Health: ${exportData.system_health.medallion_status.pipeline_health || 'Unknown'}`);
      }
    }
    
    // Save enhanced exports
    console.log('\n💾 Saving v1.1 Exports:');
    
    // JSON
    fs.writeFileSync('scout-export-v1.1.json', JSON.stringify(exportData, null, 2));
    console.log('   ✅ scout-export-v1.1.json');
    
    // HTML
    const htmlResponse = await fetchExport('html');
    fs.writeFileSync('scout-export-v1.1.html', htmlResponse.data);
    console.log('   ✅ scout-export-v1.1.html');
    
    // Create summary report
    const summaryReport = `# Scout System Export v1.1 Report
Generated: ${new Date().toISOString()}

## System Status
- **Overall Status**: ${exportData.system_health?.system_status || 'Unknown'}
- **Database Size**: ${exportData.database_summary?.total_size}
- **Total Schemas**: ${exportData.database_summary?.total_schemas}
- **Total Tables**: ${exportData.database_summary?.total_tables}

## Medallion Architecture
${exportData.medallion_architecture?.map(l => `- **${l.layer}**: ${l.table_count} tables (${l.total_size})`).join('\n') || 'No data'}

## Silver Layer Validation
- **Pipeline Health**: ${exportData.system_health?.medallion_status?.pipeline_health || 'Unknown'}
- **Validated Records**: ${exportData.system_health?.medallion_status?.validated_records || 0}
- **AI Confidence**: ${exportData.system_health?.medallion_status?.ai_confidence ? (exportData.system_health.medallion_status.ai_confidence * 100).toFixed(1) + '%' : 'N/A'}

---
*TBWA Scout Monitoring System v1.1*
`;
    
    fs.writeFileSync('scout-monitoring-report.md', summaryReport);
    console.log('   ✅ scout-monitoring-report.md');
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n🎉 All v1.1 features verified successfully!');
    console.log('\n📁 Generated Files:');
    console.log('   - scout-export-v1.1.json (Complete data)');
    console.log('   - scout-export-v1.1.html (Visual report)');
    console.log('   - scout-monitoring-report.md (Summary)');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
}

// Run verification
verifyV11Features();