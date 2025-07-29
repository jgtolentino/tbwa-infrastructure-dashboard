# TBWA Enterprise Infrastructure Dashboard

Real-time monitoring and analytics for TBWA enterprise data platform.

## Quick Start

```bash
# Navigate to project directory
cd "/Users/tbwa/Library/CloudStorage/GoogleDrive-jgtolentino.rn@gmail.com/My Drive/GitHub/GitHub/tbwa-infrastructure-dashboard"

# Install dependencies
npm install

# Start development server on port 3002
npm run dev
```

**Dashboard will be available at:** http://localhost:3002

## Environment Setup

1. Copy your Supabase credentials to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Features

- **Overview Dashboard**: Real-time metrics across all enterprise domains
- **Health Monitoring**: RLS, storage, database, and backup status
- **Storage Analysis**: Bucket-by-bucket breakdown with security status
- **Schema Performance**: Cross-domain analytics and query performance
- **Activity Logs**: Real-time operations and system events

## Architecture Integration

- **Schemas**: hr_admin, financial_ops, operations, corporate, creative_insights
- **MCP Integration**: Connects to your enterprise MCP server configuration
- **Real-time Updates**: Live monitoring of Supabase enterprise project
- **Security**: Full RLS policy compliance and audit trails

## Development

```bash
# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Infrastructure Monitoring

The dashboard monitors:
- 5 enterprise schemas with 45+ tables
- 12 storage buckets (2.4TB total)
- 67 RLS policies (98.2% coverage)
- Real-time activity across all domains
- Cross-schema performance analytics

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Tailwind CSS, Recharts
- **Backend**: Supabase Enterprise
- **Monitoring**: Real-time metrics and health checks
