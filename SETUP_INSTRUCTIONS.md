# TBWA Infrastructure Dashboard Setup Instructions

## ✅ Current Status

The infrastructure dashboard is now running at: **http://localhost:3002/infrastructure**

## 📋 Next Steps

### 1. Add SQL Functions to Supabase

The dashboard needs monitoring functions to work properly. Copy the contents of `infrastructure-monitoring-functions.sql` and run it in your Supabase SQL Editor:

1. Open [Supabase SQL Editor](https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new)
2. Paste the SQL from `infrastructure-monitoring-functions.sql`
3. Click "Run" to create the functions

### 2. Update Service Role Key (Optional)

If you need advanced features, update the service role key in `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### 3. Access the Dashboard

Open your browser and navigate to: **http://localhost:3002/infrastructure**

## 🎯 Features

The infrastructure dashboard provides:

- **Overview Tab**: Database summary, schema statistics, and table counts
- **Health Tab**: Connection status and schema health checks
- **Storage Tab**: Database size, largest tables, and storage by schema
- **Schema Tab**: Detailed analysis of the Scout schema including tables, indexes, and constraints

## 🚀 Dashboard Tabs

1. **Overview**: High-level metrics about your database
2. **Health Check**: Real-time database connection and schema status
3. **Storage Report**: Storage usage analysis and largest tables
4. **Schema Analysis**: Detailed information about Scout schema structure

## 🛠️ Troubleshooting

If you see a loading spinner that doesn't go away:
1. Check the browser console for errors (F12)
2. Ensure the SQL functions are created in Supabase
3. Verify your Supabase credentials in `.env.local`

## 📝 Notes

- The dashboard uses the anon key by default, which is sufficient for read-only monitoring
- All functions are designed to work within Supabase's security model
- The dashboard auto-refreshes data when switching between tabs