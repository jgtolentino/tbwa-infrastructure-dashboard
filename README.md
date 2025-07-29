# TBWA Infrastructure Dashboard 🚀

A comprehensive real-time monitoring system for the Scout data platform with geographic analytics, medallion architecture support, and automated deployment workflows.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Enabled-orange)](https://postgis.net/)

## 🌟 Features

### Infrastructure Monitoring
- **4-Tab Dashboard**: Overview, Health, Storage, and Schema analytics
- **Real-time Metrics**: Database size, table counts, schema health
- **Scout System Status**: Comprehensive monitoring of Scout tables and schemas
- **Storage Analysis**: Detailed storage usage by schema and table

### Geographic Analytics 🗺️
- **Philippine Admin-2 Polygons**: Real province boundaries instead of demo squares
- **Live Data Visualization**: Choropleth maps with actual Scout metrics
- **Regional Rankings**: Top-performing regions with dot-strip visualization
- **Smart Store Mapping**: Geometric joins and fuzzy matching for location data

### Medallion Architecture
- **Bronze → Silver → Gold**: Complete data flow monitoring
- **Data Quality Metrics**: AI confidence scores and validation stats
- **Pipeline Health**: Real-time status of data transformations
- **Automated Refresh**: Scheduled updates via Edge Functions

### Deployment Automation
- **Edge Functions Auto-Deploy**: File watcher with automatic deployment
- **Git Integration**: Auto-commit successful deployments
- **CI/CD Ready**: GitHub Actions workflow included
- **Deployment Dashboard**: Real-time deployment monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- PostgreSQL with PostGIS extension

### Installation

```bash
# Clone the repository
git clone https://github.com/jgtolentino/tbwa-infrastructure-dashboard.git
cd tbwa-infrastructure-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Deploy Geographic Analytics

```bash
# Run the deployment script
./scripts/deploy-geo-analytics.sh
```

This will:
1. Apply database migrations
2. Deploy Edge Functions
3. Download Philippine boundaries
4. Set up geographic analytics

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                     │
├─────────────────────────────────────────────────────────┤
│                    Supabase Edge Functions               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ scout-export │  │geo_choropleth│  │ geo_dotstrip │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  PostgreSQL + PostGIS                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Bronze    │→ │    Silver    │→ │     Gold     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Configuration

### MCP (Model Context Protocol)
The project includes MCP configuration for AI-assisted development:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest", "--project-ref=YOUR_PROJECT_REF"]
    }
  }
}
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ACCESS_TOKEN=your_access_token
SUPABASE_PROJECT_REF=your_project_ref
```

## 📁 Project Structure

```
tbwa-infrastructure-dashboard/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   └── geo/         # Geographic analytics components
│   └── lib/             # Utilities and helpers
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
├── scripts/             # Deployment and automation scripts
└── public/             # Static assets
```

## 🔧 Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Automated Deployment
```bash
# Start file watcher for auto-deployment
./scripts/watch-and-deploy.sh

# Deploy all Edge Functions
./scripts/deploy-all-functions.sh
```

## 📚 Documentation

- [Geographic Analytics Setup](./GEOGRAPHIC_ANALYTICS_SETUP.md)
- [Edge Functions Guide](./README_EDGE_FUNCTIONS.md)
- [Deployment Guide](./DEPLOYMENT_STATUS.md)
- [MCP Configuration](./CLAUDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential to TBWA.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Geographic data from [GADM](https://gadm.org/)
- Icons by [Lucide](https://lucide.dev/)