# Edge Functions Deployment Guide

## Overview
This project includes automated deployment workflows for Supabase Edge Functions. We have three main Edge Functions:
- **project-inspector**: Analyzes project components and provides detailed statistics
- **scout-system-export**: Exports system status in JSON/HTML/PDF formats
- **infrastructure-tools**: Provides infrastructure monitoring endpoints

## Deployment Methods

### 1. Manual Deployment
Deploy a single function:
```bash
supabase functions deploy project-inspector
```

Deploy all functions:
```bash
./scripts/deploy-all-functions.sh
```

### 2. Automated Deployment with File Watching
Watch for changes and auto-deploy:
```bash
./scripts/watch-and-deploy.sh
```
This script uses `fswatch` to monitor changes in the Edge Functions directory and automatically deploys affected functions.

### 3. Git Hook Deployment
The pre-push hook automatically deploys changed Edge Functions before pushing to remote. This ensures deployed functions match the code in the repository.

### 4. GitHub Actions CI/CD
Push to the main branch triggers automatic deployment via GitHub Actions. See `.github/workflows/deploy-edge-functions.yml`.

## Setup Requirements

### Environment Variables
Create a `.env` file with:
```env
SUPABASE_PROJECT_REF=cxzllzyxwpyptfretryc
SUPABASE_ACCESS_TOKEN=your_access_token_here
```

### GitHub Secrets (for CI/CD)
Add these secrets to your GitHub repository:
- `SUPABASE_PROJECT_REF`: Your project reference
- `SUPABASE_ACCESS_TOKEN`: Your personal access token

### Local Development
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref cxzllzyxwpyptfretryc
   ```

3. Test functions locally:
   ```bash
   supabase functions serve project-inspector
   ```

## Function URLs
After deployment, your functions are available at:
- `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/project-inspector`
- `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-system-export`
- `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/infrastructure-tools`

## Troubleshooting

### Deployment Failures
1. Check your access token is valid
2. Ensure you're linked to the correct project
3. Verify function code has no syntax errors
4. Check Supabase dashboard for error logs

### File Watching Issues
If `fswatch` is not installed:
- macOS: `brew install fswatch`
- Ubuntu/Debian: `sudo apt-get install fswatch`
- RHEL/CentOS: `sudo yum install fswatch`

## Best Practices
1. Always test functions locally before deploying
2. Use environment variables for sensitive data
3. Monitor function logs in Supabase dashboard
4. Keep functions small and focused
5. Use proper error handling in function code