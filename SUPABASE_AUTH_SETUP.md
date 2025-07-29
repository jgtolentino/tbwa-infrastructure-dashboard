# Supabase CLI Authentication Setup

To download Edge Functions from your Supabase project, you need to authenticate the CLI first.

## Steps to Authenticate:

### 1. Login to Supabase CLI
```bash
supabase login
```
This will open your browser to authenticate.

### 2. Link Your Project
```bash
cd "/Users/tbwa/Library/CloudStorage/GoogleDrive-jgtolentino.rn@gmail.com/My Drive/GitHub/GitHub/tbwa-infrastructure-dashboard"
supabase link --project-ref cxzllzyxwpyptfretryc
```

### 3. Download the Edge Function
Once authenticated and linked:
```bash
supabase functions download scout-system-export
```

## Alternative: Manual Download via Dashboard

If CLI authentication is not working, you can:

1. Go to your [Supabase Dashboard](https://app.supabase.com/project/cxzllzyxwpyptfretryc/functions)
2. Navigate to Edge Functions
3. Find `scout-system-export`
4. Download the source code manually

## Expected Function Structure

The downloaded function should create:
```
supabase/functions/scout-system-export/
├── index.ts          # Main function code
└── deno.json         # Dependencies (if any)
```

## Access Token Format
If you have a personal access token, it should look like:
```
sbp_0102030405060708091011121314151617181920
```

You can create one at: https://app.supabase.com/account/tokens