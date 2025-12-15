# Edge Functions Setup for Self-Hosted Supabase (Coolify)

This guide helps you deploy your 13 edge functions to your self-hosted Supabase instance running on Coolify.

## Your Edge Functions

You have 13 functions to deploy:
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

## Prerequisites

- Self-hosted Supabase running on Coolify
- Docker installed on your server
- SSH access to your server (already configured)
- Deno runtime (for edge functions)

## Architecture

Self-hosted Supabase edge functions run in a separate container using Deno. The typical setup:

```
┌─────────────────┐
│  Supabase API   │ ← REST API Gateway
│  (Kong)         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Edge Functions  │ ← Deno runtime
│  Container      │   Your functions here
└─────────────────┘
         │
         ↓
┌─────────────────┐
│  PostgreSQL     │ ← Database
└─────────────────┘
```

## Method 1: Deploy via Coolify (Recommended)

### Step 1: Check Current Coolify Setup

On your server, check what Supabase services are running:

```bash
cd /data/coolify/services
ls -la | grep supabase
```

Look for a functions directory or edge-functions service.

### Step 2: Locate Functions Volume

Coolify usually mounts edge functions at:

```bash
# Find your functions path
docker inspect supabase-functions-xxxxx | grep -A 5 "Mounts"
```

Or check your Coolify dashboard for the functions service volume path.

### Step 3: Upload Your Functions

From your local machine:

```powershell
# Upload all functions to server
scp -r supabase\functions root@209.145.59.219:/tmp/functions

# On server, copy to Coolify volume
ssh root@209.145.59.219 "
  # Replace with your actual functions path
  FUNCTIONS_PATH=/data/coolify/services/YOUR_SERVICE_ID/volumes/functions
  cp -r /tmp/functions/* \$FUNCTIONS_PATH/
  rm -rf /tmp/functions
"
```

### Step 4: Restart Functions Container

```bash
# On server
docker restart supabase-functions-xxxxx
```

## Method 2: Manual Docker Deployment

If Coolify doesn't have edge functions set up, deploy manually:

### Step 1: Create Dockerfile for Edge Functions

Create `supabase/functions/Dockerfile`:

```dockerfile
FROM denoland/deno:1.38.0

WORKDIR /app

# Copy all functions
COPY . .

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD deno eval "fetch('http://localhost:9000/_internal/health').then(() => Deno.exit(0)).catch(() => Deno.exit(1))"

# Start functions server
CMD ["deno", "run", "--allow-all", "--unstable", "serve.ts"]
```

### Step 2: Create Functions Server (serve.ts)

Create `supabase/functions/serve.ts`:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const FUNCTION_ROUTES: Record<string, string> = {
  "/ai-generate": "./ai-generate/index.ts",
  "/check-subscription": "./check-subscription/index.ts",
  "/create-checkout": "./create-checkout/index.ts",
  "/create-one-time-payment": "./create-one-time-payment/index.ts",
  "/customer-portal": "./customer-portal/index.ts",
  "/generate-sitemap": "./generate-sitemap/index.ts",
  "/generate-wallet-pass": "./generate-wallet-pass/index.ts",
  "/get-org-by-domain": "./get-org-by-domain/index.ts",
  "/receive-email": "./receive-email/index.ts",
  "/send-email-response": "./send-email-response/index.ts",
  "/setup-new-user": "./setup-new-user/index.ts",
  "/verify-custom-domain": "./verify-custom-domain/index.ts",
  "/verify-payment": "./verify-payment/index.ts",
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  
  // Health check endpoint
  if (url.pathname === "/_internal/health") {
    return new Response("OK", { status: 200 });
  }

  // Find matching function
  const functionPath = FUNCTION_ROUTES[url.pathname];
  
  if (!functionPath) {
    return new Response("Function not found", { status: 404 });
  }

  try {
    const module = await import(functionPath);
    return await module.default(req);
  } catch (error) {
    console.error(`Error in ${url.pathname}:`, error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, { port: 9000 });

console.log("Edge Functions server running on port 9000");
```

### Step 3: Build and Deploy

```powershell
# From local machine
cd supabase\functions

# Upload to server
scp -r . root@209.145.59.219:/root/supabase-functions/

# On server
ssh root@209.145.59.219
cd /root/supabase-functions

# Build image
docker build -t supabase-edge-functions:latest .

# Run container
docker run -d \
  --name supabase-functions \
  --network supabase-network \
  -p 9000:9000 \
  -e SUPABASE_URL=http://supabase-kong:8000 \
  -e SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  -e DATABASE_URL=postgresql://postgres:password@supabase-db:5432/postgres \
  supabase-edge-functions:latest
```

## Method 3: Use Supabase CLI (Recommended for Development)

### Step 1: Install Supabase CLI

```powershell
# Windows (using Scoop)
scoop install supabase

# Or download from: https://github.com/supabase/cli/releases
```

### Step 2: Link to Your Self-Hosted Instance

```powershell
cd C:\Users\dpearson\Documents\Rep-Club\gym-unity-suite

# Initialize (if not already done)
supabase init

# Link to your self-hosted instance
supabase link --project-ref your-project-ref --db-url "postgresql://postgres:X1lgH1gPA1jpfUzcMMYYiPZJcLhqZD4U@209.145.59.219:5434/postgres"
```

### Step 3: Deploy Functions

```powershell
# Deploy all functions
supabase functions deploy --project-ref your-project-ref

# Or deploy individual functions
supabase functions deploy ai-generate
supabase functions deploy check-subscription
# ... etc
```

## Environment Variables

Your functions need these environment variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@supabase-db:5432/postgres

# Supabase
SUPABASE_URL=https://api.repclub.net
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (for payment functions)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Email (for email functions)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@repclub.net

# AI (for ai-generate)
OPENAI_API_KEY=your-openai-key
```

## Testing Functions

### Test Locally First

```powershell
# Serve functions locally
supabase functions serve ai-generate --env-file .env

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ai-generate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

### Test on Server

```bash
# From server
curl -X POST http://localhost:9000/ai-generate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

### Test via API Gateway

```powershell
# From anywhere
curl -X POST https://api.repclub.net/functions/v1/ai-generate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

## Troubleshooting

### Functions Not Starting

```bash
# Check container logs
docker logs supabase-functions-xxxxx

# Check if Deno is installed
docker exec supabase-functions-xxxxx deno --version
```

### Functions Returning 404

Check Kong (API Gateway) routing:

```bash
# Check Kong configuration
docker exec supabase-kong kong config db_export /tmp/kong-config.yml
docker exec supabase-kong cat /tmp/kong-config.yml | grep functions
```

### Functions Timing Out

Increase timeout in Kong configuration or check function logs:

```bash
docker logs -f supabase-functions-xxxxx
```

### Database Connection Issues

Ensure functions can reach the database:

```bash
# Test from functions container
docker exec supabase-functions-xxxxx \
  deno eval "console.log(Deno.env.get('DATABASE_URL'))"
```

## Next Steps

1. **Choose a deployment method** (Coolify is easiest if set up)
2. **Upload your functions** to the server
3. **Configure environment variables**
4. **Test each function** individually
5. **Update your frontend** to use new functions URL

## Quick Reference Commands

```bash
# List all Docker containers
docker ps | grep supabase

# Restart functions
docker restart supabase-functions-xxxxx

# View logs
docker logs -f supabase-functions-xxxxx

# Execute command in container
docker exec -it supabase-functions-xxxxx bash

# Check network connectivity
docker network inspect supabase-network
```

## PowerShell Deployment Script

Want me to create an automated PowerShell script to handle all of this? Let me know!
