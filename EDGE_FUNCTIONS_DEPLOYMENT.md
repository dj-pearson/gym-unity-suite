# Supabase Edge Functions Deployment Guide

## Overview

This guide covers deploying Supabase Edge Functions to Coolify/self-hosted infrastructure using Docker.

## Architecture

Our edge functions deployment uses:
- **Base Image**: `denoland/deno:1.40.0` - Official Deno runtime
- **Custom Server**: `edge-runtime-server.ts` - Custom edge function router
- **Docker Compose**: `docker-compose.yaml` - Service orchestration
- **Healthcheck**: Built-in Docker healthcheck for monitoring

## Files Overview

### Core Files

- **`Dockerfile.functions`** - Docker image for edge functions runtime
- **`edge-runtime-server.ts`** - Custom Deno server that routes requests to individual functions
- **`docker-compose.yaml`** - Docker Compose configuration for Coolify
- **`supabase/functions/`** - Directory containing all edge functions
- **`supabase/config.toml`** - Supabase configuration (JWT verification settings)

### Function Structure

Each function must follow this pattern:

```typescript
// supabase/functions/my-function/index.ts
export default async (req: Request): Promise<Response> => {
  // Handle the request
  return new Response(
    JSON.stringify({ message: "Success" }),
    { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    }
  );
};
```

**Important**: Functions must use `export default` pattern, not `Deno.serve()` pattern.

## Environment Variables

### Required Variables

These **must** be set in Coolify for the deployment to work:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase API URL | `https://api.repclub.net` |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJ0eXAiOiJKV1Q...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) | `eyJ0eXAiOiJKV1Q...` |

### Optional Variables (for specific functions)

| Variable | Used By | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | ai-generate | OpenAI API key for AI features |
| `STRIPE_SECRET_KEY` | Payment functions | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | verify-payment | Stripe webhook signing secret |
| `RESEND_API_KEY` | Email functions | Resend API key for emails |
| `SUPABASE_DB_HOST` | Various | Direct database host (if needed) |
| `SUPABASE_DB_PORT` | Various | Database port (default: 5432) |
| `SUPABASE_DB_PASSWORD` | Various | Database password (if direct access needed) |

### Runtime Variables (auto-set by Coolify)

These are automatically provided by Coolify:

- `SOURCE_COMMIT` - Git commit SHA
- `COOLIFY_URL` - Full URL with protocol
- `COOLIFY_FQDN` - Just the domain
- `COOLIFY_BRANCH` - Git branch name
- `COOLIFY_CONTAINER_NAME` - Container name

## Coolify Setup

### 1. Create New Service

1. Go to Coolify dashboard
2. Click **"+ New Resource"**
3. Select **"Docker Compose"**
4. Choose your project and server
5. Set the following:
   - **Name**: `edge-functions` or `repclub-edge-functions`
   - **Git Repository**: Your repo URL (e.g., `https://github.com/dj-pearson/gym-unity-suite`)
   - **Branch**: `main` (or your working branch)
   - **Base Directory**: Leave empty (uses repo root)
   - **Docker Compose Location**: `docker-compose.yaml`

### 2. Configure Domain

1. In the service settings, go to **"Domains"**
2. Add your domain: `functions.repclub.net` (or your preferred subdomain)
3. Enable **"Generate Let's Encrypt Certificate"**
4. Save changes

### 3. Configure Environment Variables

1. Go to **"Environment Variables"** tab
2. Add the required variables listed above
3. **Important**: Mark sensitive keys as **"Secret"** (encrypted)
4. Save changes

Example configuration:

```env
# Core Supabase (REQUIRED)
SUPABASE_URL=https://api.repclub.net
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Third-party APIs (OPTIONAL - only if you use these functions)
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...

# Optional runtime config
PRELOAD_FUNCTIONS=false
```

### 4. Deploy

1. Click **"Deploy"** button
2. Monitor the build logs
3. Wait for healthcheck to pass (may take 30-60 seconds)
4. Verify deployment is successful

## Available Functions

Your deployment includes these functions:

| Function | Path | Description |
|----------|------|-------------|
| `ai-generate` | `/ai-generate` | AI content generation |
| `check-subscription` | `/check-subscription` | Subscription verification |
| `create-checkout` | `/create-checkout` | Stripe checkout creation |
| `create-one-time-payment` | `/create-one-time-payment` | One-time payment processing |
| `customer-portal` | `/customer-portal` | Stripe customer portal access |
| `generate-sitemap` | `/generate-sitemap` | SEO sitemap generation |
| `generate-wallet-pass` | `/generate-wallet-pass` | Apple Wallet pass generation |
| `get-org-by-domain` | `/get-org-by-domain` | Custom domain organization lookup |
| `health` | `/health` | Simple health check |
| `health-check` | `/health-check` | Comprehensive health check with dependencies |
| `rate-limit` | `/rate-limit` | Rate limiting middleware |
| `receive-email` | `/receive-email` | Inbound email webhook |
| `send-email-response` | `/send-email-response` | Outbound email sending |
| `setup-new-user` | `/setup-new-user` | New user onboarding |
| `verify-custom-domain` | `/verify-custom-domain` | Custom domain verification |
| `verify-payment` | `/verify-payment` | Payment verification |

## Testing Deployment

### 1. Health Check

Test the basic health endpoint:

```bash
curl https://functions.repclub.net/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-16T00:00:00.000Z",
  "service": "edge-functions",
  "method": "GET"
}
```

### 2. Comprehensive Health Check

Test the detailed health check:

```bash
curl https://functions.repclub.net/health-check
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-12-16T00:00:00.000Z",
  "uptime": 123456,
  "environment": "production",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "latency": 45.2,
      "message": "Database is responding normally"
    },
    {
      "name": "auth",
      "status": "healthy",
      "latency": 23.1,
      "message": "Auth service is responding"
    },
    {
      "name": "storage",
      "status": "healthy",
      "latency": 67.8,
      "message": "Storage service is responding"
    }
  ]
}
```

### 3. List All Functions

Get a list of available functions:

```bash
curl https://functions.repclub.net/
```

Expected response:
```json
{
  "message": "Supabase Edge Functions Runtime",
  "version": "1.0.0",
  "functions": [
    "ai-generate",
    "check-subscription",
    "create-checkout",
    ...
  ],
  "usage": "POST /<function-name> to invoke a function"
}
```

### 4. Test a Specific Function

Example - Test the `get-org-by-domain` function:

```bash
curl -X POST https://functions.repclub.net/get-org-by-domain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"domain": "example.com"}'
```

## Monitoring

### Docker Healthcheck

The deployment includes a built-in Docker healthcheck that runs every 30 seconds:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

### Logs

View real-time logs in Coolify:

1. Go to your service in Coolify
2. Click **"Logs"** tab
3. Enable **"Follow Logs"**

Or via Docker CLI:

```bash
docker logs -f repclub-edge-functions
```

Look for:
- `📦 Found function: <name>` - Function discovery
- `✅ Loaded function: <name>` - Function loaded successfully
- `🚀 Invoking function: <name>` - Function invocation
- `❌ Error` - Any errors

### Health Check Status

The health check endpoint returns these statuses:

- **`healthy`** - All systems operational (200)
- **`degraded`** - Operational but slow (200)
- **`unhealthy`** - Service unavailable (503)

## Troubleshooting

### Common Issues

#### 1. Container is Unhealthy

**Symptom**: Deployment shows "unhealthy" status

**Solutions**:
- Check if environment variables are set correctly
- Verify `SUPABASE_URL` is accessible from the container
- Check logs for specific errors
- Ensure healthcheck endpoint is responding

#### 2. Function Not Found

**Symptom**: `404` error when calling a function

**Solutions**:
- Verify function exists in `supabase/functions/` directory
- Check function has `index.ts` file
- Ensure function exports default handler
- Check logs for function loading errors

#### 3. Database Connection Errors

**Symptom**: Health check shows database as unhealthy

**Solutions**:
- Verify `SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is valid
- Ensure database is accessible from container
- Check Row-Level Security (RLS) policies

#### 4. CORS Errors

**Symptom**: Browser shows CORS errors

**Solution**: The edge runtime server automatically handles CORS. If you still see errors:
- Check the origin is allowed
- Verify function returns proper Response object
- Add custom CORS headers if needed

#### 5. Function Timeout

**Symptom**: Function takes too long to respond

**Solutions**:
- Optimize function code
- Check external API dependencies
- Increase timeout if needed (default: 10s for healthcheck)
- Use background jobs for long-running tasks

### Debug Mode

Enable detailed logging by setting:

```env
DENO_ENV=development
```

This will include stack traces in error responses.

### Pre-loading Functions

To speed up cold starts, enable function pre-loading:

```env
PRELOAD_FUNCTIONS=true
```

This loads all functions into memory at startup (increases startup time but reduces first-request latency).

## Updating Functions

### 1. Update Function Code

Edit the function file locally:

```bash
# Example: Update ai-generate function
code supabase/functions/ai-generate/index.ts
```

### 2. Commit and Push

```bash
git add supabase/functions/
git commit -m "feat: Update ai-generate function"
git push origin main
```

### 3. Deploy

Coolify will automatically detect the change and redeploy (if auto-deploy is enabled).

Or manually trigger deployment:
1. Go to Coolify dashboard
2. Select your service
3. Click **"Deploy"**

### 4. Verify

Test the updated function:

```bash
curl -X POST https://functions.repclub.net/ai-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"prompt": "test"}'
```

## Adding New Functions

### 1. Create Function Directory

```bash
mkdir -p supabase/functions/my-new-function
```

### 2. Create Function Handler

```typescript
// supabase/functions/my-new-function/index.ts
export default async (req: Request): Promise<Response> => {
  try {
    // Parse request
    const { data } = await req.json();
    
    // Your logic here
    const result = processData(data);
    
    // Return response
    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};
```

### 3. Test Locally (Optional)

You can test with Deno locally:

```bash
deno run --allow-all edge-runtime-server.ts
curl -X POST http://localhost:8000/my-new-function -d '{"data":"test"}'
```

### 4. Deploy

Commit and push your changes - the function will be automatically discovered and loaded.

## Performance Tips

1. **Cache Dependencies**: Dependencies are cached in the Docker image at build time
2. **Use Environment Variables**: Store API keys and config in env vars, not code
3. **Enable Pre-loading**: Set `PRELOAD_FUNCTIONS=true` for high-traffic scenarios
4. **Optimize Function Code**: Keep functions lean and fast
5. **Use Connection Pooling**: Reuse Supabase client instances when possible
6. **Monitor Logs**: Watch for slow queries and optimize accordingly

## Security Best Practices

1. **Never commit secrets**: Use environment variables for all API keys
2. **Use service role key carefully**: Only use for admin operations
3. **Validate inputs**: Always validate and sanitize user inputs
4. **Rate limiting**: Implement rate limiting for public endpoints
5. **HTTPS only**: Always use HTTPS in production (handled by Coolify)
6. **JWT verification**: Enable in `supabase/config.toml` for protected functions

## Next Steps

- [ ] Set up monitoring/alerting (Uptime Kuma, Better Stack, etc.)
- [ ] Configure rate limiting rules
- [ ] Set up error tracking (Sentry)
- [ ] Create staging environment
- [ ] Document function-specific usage
- [ ] Set up automated testing

## Support

For issues or questions:
- Check Coolify logs first
- Review this documentation
- Check Supabase Edge Functions docs
- Review Deno documentation

---

**Last Updated**: 2025-12-16  
**Version**: 1.0.0  
**Maintainer**: Development Team

