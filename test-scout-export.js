#!/usr/bin/env node

// Test scout-system-export Edge Function
const https = require('https');

const FUNCTION_URL = 'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g';

async function testExport(format = 'json') {
  console.log(`\n🔍 Testing scout-system-export with format: ${format}\n`);
  
  const url = `${FUNCTION_URL}?format=${format}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}`);
        console.log(`📄 Content-Type: ${res.headers['content-type']}`);
        console.log(`📏 Response Size: ${data.length} bytes\n`);
        
        if (res.statusCode === 200) {
          if (format === 'json') {
            try {
              const parsed = JSON.parse(data);
              console.log('✅ JSON Response Summary:');
              console.log(`   - Timestamp: ${parsed.timestamp}`);
              console.log(`   - Database Summary: ${parsed.database_summary?.total_schemas} schemas, ${parsed.database_summary?.total_tables} tables`);
              console.log(`   - Scout Status: ${parsed.scout_status?.schema_exists ? '✅ Healthy' : '❌ Missing'} (${parsed.scout_status?.table_count} tables)`);
              console.log(`   - Database Size: ${parsed.database_summary?.total_size}`);
              console.log(`   - Scout Schema Size: ${parsed.storage_report?.scout_schema_size}`);
              
              // Save JSON to file
              require('fs').writeFileSync('scout-export.json', JSON.stringify(parsed, null, 2));
              console.log('\n💾 JSON saved to: scout-export.json');
            } catch (e) {
              console.error('❌ Failed to parse JSON:', e.message);
            }
          } else if (format === 'html') {
            console.log('✅ HTML Response received');
            // Save HTML to file
            require('fs').writeFileSync('scout-export.html', data);
            console.log('💾 HTML saved to: scout-export.html');
            console.log('🌐 Open scout-export.html in your browser to view the report');
          }
        } else {
          console.error('❌ Error Response:', data);
        }
        
        resolve();
      });
    }).on('error', (err) => {
      console.error('❌ Request failed:', err.message);
      reject(err);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Testing Scout System Export Function\n');
  console.log(`🔗 Function URL: ${FUNCTION_URL}`);
  console.log('=' .repeat(60));
  
  try {
    // Test JSON format
    await testExport('json');
    console.log('\n' + '=' .repeat(60));
    
    // Test HTML format
    await testExport('html');
    console.log('\n' + '=' .repeat(60));
    
    console.log('\n✨ All tests completed!');
    console.log('\n📁 Check the following files:');
    console.log('   - scout-export.json (JSON data)');
    console.log('   - scout-export.html (HTML report)');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run tests
runAllTests();