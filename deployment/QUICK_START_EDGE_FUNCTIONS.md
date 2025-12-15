# Quick Start: Deploy Edge Functions

Your database is already set up! Now you just need to deploy the edge functions.

## 🎯 Quick Deploy (3 Commands)

### Option 1: From Your Local Machine (Windows)

```powershell
# 1. Go to deployment folder
cd C:\Users\dpearson\Documents\Rep-Club\gym-unity-suite\deployment

# 2. Run the automated deployment
.\deploy-edge-functions.ps1
```

That's it! The script will:
- ✅ Detect if you have edge functions already set up in Coolify
- ✅ Upload your 13 functions to the server
- ✅ Deploy them using the appropriate method
- ✅ Verify everything is working

### Option 2: Manual Discovery First

If you want to see what's already set up before deploying:

```powershell
# Upload the discovery script
scp deployment\check-edge-functions.sh root@209.145.59.219:/tmp/

# In your SSH session, run it
chmod +x /tmp/check-edge-functions.sh
/tmp/check-edge-functions.sh
```

This will show you:
- What Supabase containers are running
- Whether edge functions are already configured
- What Docker networks exist
- Kong (API Gateway) configuration

## 📋 Your 13 Functions Being Deployed

1. `ai-generate` - AI content generation
2. `check-subscription` - Subscription verification
3. `create-checkout` - Checkout session creation
4. `create-one-time-payment` - One-time payments
5. `customer-portal` - Customer portal access
6. `generate-sitemap` - Sitemap generation
7. `generate-wallet-pass` - Wallet pass generation
8. `get-org-by-domain` - Custom domain org lookup
9. `receive-email` - Inbound email handling
10. `send-email-response` - Email responses
11. `setup-new-user` - New user initialization
12. `verify-custom-domain` - Domain verification
13. `verify-payment` - Payment verification

## 🔍 Testing After Deployment

Once deployed, test the functions:

```bash
# Health check (should return "OK")
curl http://209.145.59.219:9000/_internal/health

# Test a specific function
curl -X POST http://209.145.59.219:9000/generate-sitemap \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## 🌐 Configure API Gateway (Kong)

After functions are running, you may need to configure Kong to route public requests:

```bash
# Check if Kong is already routing functions
curl https://api.repclub.net/functions/v1/_internal/health
```

If that returns 404, you need to add the route to Kong. This is usually done through:
1. Coolify dashboard (if it manages Kong)
2. Kong configuration files
3. Kong Admin API

## ⚙️ Environment Variables

Your functions will need these environment variables. The deployment script automatically sets:
- `SUPABASE_URL` (from .env)
- `SUPABASE_ANON_KEY` (from .env)
- `SUPABASE_SERVICE_ROLE_KEY` (from .env)
- `DATABASE_URL` (constructed from .env)

You may need to add:
- `STRIPE_SECRET_KEY` - For payment functions
- `STRIPE_WEBHOOK_SECRET` - For payment webhooks
- `RESEND_API_KEY` - For email functions
- `OPENAI_API_KEY` - For AI functions

To add these, update the container:

```bash
# SSH into server
ssh root@209.145.59.219

# Find container name
docker ps | grep functions

# Stop container
docker stop supabase-functions

# Update and restart with env vars
docker start supabase-functions
```

Or add them through Coolify's environment variable UI.

## 🚨 Troubleshooting

### Functions not starting?
```bash
# Check logs
docker logs -f supabase-functions
```

### Functions returning errors?
```bash
# Check environment variables
docker exec supabase-functions env | grep SUPABASE
```

### Can't connect to database?
```bash
# Test database connection
docker exec supabase-functions deno eval "console.log(Deno.env.get('DATABASE_URL'))"
```

## 📊 Current Status

Based on your terminal output:

✅ **Database**: Running with all tables created
✅ **Schema**: Applied (saw tables like certification_requirements, check_ins, etc.)
✅ **Data**: Appears to be loaded (you can verify with the corrected row count query)
⏳ **Edge Functions**: Need to deploy (use the script above)

## Next Command to Run

In your SSH session, run this to check your data:

```bash
docker exec supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres -c "
SELECT 
  schemaname,
  relname AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC
LIMIT 30;"
```

Then deploy the edge functions:

```powershell
# From Windows PowerShell
cd C:\Users\dpearson\Documents\Rep-Club\gym-unity-suite\deployment
.\deploy-edge-functions.ps1
```

That's it! 🚀
