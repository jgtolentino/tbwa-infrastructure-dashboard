# Scout System Export Edge Function

## Overview
This Edge Function provides a comprehensive export of the Scout Monitoring System status in multiple formats (JSON, HTML, PDF).

## Endpoint
```
https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export?format=json|html|pdf
```

## Formats Supported
- **JSON** (default): Raw data in JSON format
- **HTML**: Formatted HTML report with tables and styling
- **PDF**: HTML report with PDF conversion note (full PDF implementation pending)

## Data Included
The export includes data from all infrastructure monitoring functions:

1. **Database Summary**
   - Total schemas count
   - Total tables count
   - Total database size
   - Scout-specific table count

2. **Scout Schema Status**
   - Schema health status (✅ Healthy / ❌ Missing)
   - Table count in Scout schema

3. **Storage Report**
   - Total database size
   - Scout schema size
   - List of largest tables with sizes

4. **Schema Analysis**
   - Complete schema structure (from `analyze_scout_schema`)

## Usage Examples

### Get JSON Export
```bash
curl https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export
```

### Get HTML Report
```bash
curl https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export?format=html
```

### Get PDF Report (returns HTML with note)
```bash
curl https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export?format=pdf
```

## Response Format (JSON)
```json
{
  "timestamp": "2025-01-29T14:24:00.000Z",
  "database_summary": {
    "total_schemas": 82,
    "total_tables": 93,
    "total_size": "52 MB",
    "scout_tables": 24
  },
  "scout_status": {
    "schema_exists": true,
    "table_count": 19,
    "tables": [...]
  },
  "storage_report": {
    "total_database_size": "52 MB",
    "scout_schema_size": "4560 kB",
    "largest_tables": [...]
  },
  "schema_analysis": {
    "schema_name": "scout",
    "tables": [...],
    "indexes": [...],
    "constraints": [...]
  }
}
```

## Authentication
This function uses the service role key, so it should be called from server-side applications or with appropriate authentication headers.

## Error Handling
Returns a 500 status code with error details if any of the monitoring functions fail:
```json
{
  "error": "Failed to generate system status report",
  "details": "Error message here"
}
```

## Local Testing
To test locally:
```bash
supabase functions serve scout-system-export
```

Then access:
```
http://localhost:54321/functions/v1/scout-system-export
```