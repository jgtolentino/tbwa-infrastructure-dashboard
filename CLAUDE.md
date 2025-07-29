# CLAUDE.md - Project Context for AI Assistants

## Project Overview
**TBWA Infrastructure Dashboard** - A comprehensive monitoring system for the Scout data platform with medallion architecture (Bronze → Silver → Gold) data flow.

## Supabase MCP Configuration

### Model Context Protocol (MCP) Setup
The project has MCP configured for Claude Code CLI and other AI tools to interact directly with the Supabase database.

**Configuration File**: `.mcp.json`
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=cxzllzyxwpyptfretryc"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f"
      }
    }
  }
}
```

### MCP Capabilities
- **Full read-write access** to Supabase project
- **Project Reference**: `cxzllzyxwpyptfretryc`
- **Available Tools**:
  - Database operations (CREATE, ALTER, DROP tables)
  - SQL query execution
  - Migration management
  - Edge Function deployment
  - Storage bucket management
  - Schema inspection and modification

### Usage Examples
```
"List all tables in the scout schema"
"Create a migration for medallion architecture"
"Deploy the scout-system-export Edge Function"
"Show me the silver layer validation pipeline status"
"Create a function to refresh medallion statistics"
```

## Database Architecture

### Schema Structure
- **Public Schema**: Contains scout-prefixed tables (e.g., `scout_transactions`, `scout_customers`)
- **Scout Schema**: Dedicated schema for Scout-specific tables
- **Bronze Schema**: Raw data ingestion layer
- **Silver Schema**: Validated and cleansed data layer (45 transactions, 85.4% AI confidence)
- **Gold Schema**: Business-ready aggregated data layer

### Monitoring Functions
The system uses hybrid detection to find Scout tables in both:
1. Tables in the `scout` schema
2. Tables in the `public` schema with `scout_` prefix

Key monitoring functions:
- `get_database_summary()` - Returns database statistics
- `check_scout_schema_status()` - Validates Scout schema health
- `get_storage_report()` - Provides storage usage details
- `analyze_scout_schema()` - Analyzes schema structure
- `get_medallion_architecture_stats()` - Returns Bronze/Silver/Gold layer statistics
- `check_medallion_pipeline_health()` - Monitors data pipeline health

### Edge Functions
- **scout-system-export**: Exports system status in JSON/HTML/PDF formats
- **infrastructure-tools**: Provides infrastructure monitoring endpoints
- **project-inspector**: Inspects project configuration and health

## Development Guidelines

### Running the Project
```bash
# Start the development server
npm run dev

# The server runs on port 3002
# Access at: http://localhost:3002
```

### Key Features
1. **Infrastructure Dashboard** with 4 main tabs:
   - Overview: Database summary and statistics
   - Health: System health checks and Scout schema status
   - Storage: Storage usage by schema and largest tables
   - Schema: Detailed schema analysis with tables and columns

2. **Medallion Architecture Support**:
   - Bronze → Silver → Gold data flow
   - AI validation with confidence scoring
   - Pipeline health monitoring
   - Automated data quality checks

### Known Issues and Fixes
- **Scout Schema Detection**: The system uses hybrid detection to find Scout tables in both dedicated schema and public schema with prefix
- **Duplicate Tables**: Some tables may exist in multiple schemas (e.g., `scout_transactions` with different column counts)

## Security Considerations
- All monitoring functions have `SECURITY DEFINER` to ensure proper access
- RLS (Row Level Security) is enabled on sensitive tables
- Functions are granted to both `authenticated` and `anon` roles for dashboard access

## Recent Updates
- Added medallion architecture monitoring
- Implemented hybrid schema detection for Scout tables
- Created comprehensive system export functionality
- Fixed SQL function dependencies with CASCADE
- Enhanced monitoring to include Silver layer validation pipeline

## Contact
For questions about this infrastructure dashboard, contact the TBWA development team.