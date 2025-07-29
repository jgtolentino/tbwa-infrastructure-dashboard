#!/bin/bash

echo "🚀 Scout System Export v1.1 - Complete Test Suite"
echo "================================================="
echo ""

# Test 1: Verify Medallion Architecture Stats
echo "📊 Test 1: Medallion Architecture Stats"
echo "--------------------------------------"
curl -s -X POST \
  https://cxzllzyxwpyptfretryc.supabase.co/rest/v1/rpc/get_medallion_architecture_stats \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""

# Test 2: Export JSON with all features
echo "📋 Test 2: Full JSON Export"
echo "--------------------------"
curl -s https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export?format=json \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g" \
  > scout-v1.1-complete.json

# Extract key metrics
echo "Key Metrics:"
cat scout-v1.1-complete.json | python3 -c "
import json, sys
data = json.load(sys.stdin)

# Database Summary
db = data.get('database_summary', {})
print(f'  - Database Size: {db.get(\"total_size\", \"N/A\")}')
print(f'  - Total Tables: {db.get(\"total_tables\", \"N/A\")}')

# Medallion Architecture
medallion = data.get('medallion_architecture', [])
if medallion:
    print('\\n  Medallion Layers:')
    for layer in medallion:
        print(f'    - {layer[\"layer\"].upper()}: {layer[\"table_count\"]} tables ({layer[\"total_size\"]})')

# System Health
health = data.get('system_health', {})
if health:
    print(f'\\n  System Status: {health.get(\"system_status\", \"Unknown\")}')
    medallion_status = health.get('medallion_status', {})
    if medallion_status:
        print(f'  Pipeline Health: {medallion_status.get(\"pipeline_health\", \"Unknown\")}')
        print(f'  Validated Records: {medallion_status.get(\"validated_records\", 0)}')
        print(f'  AI Confidence: {medallion_status.get(\"ai_confidence\", 0) * 100:.1f}%')
"

echo ""
echo ""

# Test 3: HTML Export
echo "🌐 Test 3: HTML Export"
echo "---------------------"
curl -s https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export?format=html \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g" \
  > scout-v1.1-complete.html

echo "✅ HTML report saved to: scout-v1.1-complete.html"
echo ""

# Summary
echo "📁 Generated Files:"
echo "  - scout-v1.1-complete.json (Full data export)"
echo "  - scout-v1.1-complete.html (Visual report)"
echo ""
echo "✨ Scout System Export v1.1 Test Complete!"
echo ""
echo "🔗 Pulser Commands Available:"
echo "  :pulser scout report"
echo "  :pulser scout export json"
echo "  :pulser scout export html"