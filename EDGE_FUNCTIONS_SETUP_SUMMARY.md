# Edge Functions Setup Summary

## Problem

The original setup was trying to use `supabase functions serve` command in a Docker container, which requires Docker-in-Docker access. This was failing because:

1. The CLI command expects to manage Docker containers itself
2. It was designed for local development, not production deployment
3. The healthcheck was failing due to Docker daemon access issues

## Solution

We created a **custom production-ready edge runtime** that:

1. Uses Deno directly (no CLI wrapper)
2. Dynamically loads and serves all edge functions
3. Provides proper healthcheck endpoints
4. Handles CORS automatically
5. Works with Coolify's deployment model

## Files Created/Modified

### ✅ New Files

#### 1. `edge-runtime-server.ts`

**Purpose**: Custom Deno server that serves all edge functions

**Features**:

- Automatically discovers all functions in `supabase/functions/`
- Routes requests to appropriate function handlers
- Provides health check endpoints at `/health`
- Lists available functions at root `/`
- Handles CORS automatically
- Comprehensive error handling and logging
- Support for function pre-loading

**How it works**:

```
Request → edge-runtime-server.ts → Load function → Execute → Return response
   ↓
/ai-generate → supabase/functions/ai-generate/index.ts
/health → Built-in health check
/ → List all functions
```

#### 2. `docker-compose.yaml`

**Purpose**: Coolify-compatible Docker Compose configuration

**Key settings**:

- Uses `Dockerfile.functions` for build
- Exposes port 8000
- Loads all required environment variables
- Includes healthcheck configuration
- Supports Coolify metadata injection

#### 3. `.dockerignore`

**Purpose**: Optimize Docker build by excluding unnecessary files

**Excludes**:

- Node modules and build artifacts
- Source code (we only need compiled functions)
- Documentation files
- IDE configuration
- Local development files

#### 4. `EDGE_FUNCTIONS_DEPLOYMENT.md`

**Purpose**: Comprehensive deployment and usage guide

**Covers**:

- Architecture overview
- Environment variable configuration
- Coolify setup instructions
- Testing procedures
- Troubleshooting guide
- Adding new functions
- Performance and security tips

#### 5. `test-edge-functions-local.sh` (Linux/Mac)

**Purpose**: Local testing script

**Features**:

- Creates `.env` template if missing
- Checks for Deno installation
- Starts local edge runtime server
- Displays helpful testing URLs

#### 6. `test-edge-functions-local.bat` (Windows)

**Purpose**: Windows version of local testing script

Same features as the shell script but for Windows.

### ✏️ Modified Files

#### 1. `Dockerfile.functions`

**Changes**:

- Removed Supabase CLI installation
- Changed to use custom edge runtime server
- Updated CMD to run Deno directly
- Improved healthcheck configuration
- Added proper caching for dependencies

**Before**:

```dockerfile
CMD ["supabase", "functions", "serve", "--no-verify-jwt"]
```

**After**:

```dockerfile
CMD ["deno", "run", "--allow-all", "--unstable", "edge-runtime-server.ts"]
```

#### 2. `supabase/functions/health/index.ts`

**Changes**:

- Converted from `Deno.serve()` to `export default` pattern
- Added more metadata to response

**Before**:

```typescript
Deno.serve(() => { ... });
```

**After**:

```typescript
export default async (req: Request): Promise<Response> => { ... };
```

#### 3. `supabase/functions/health-check/index.ts`

**Changes**:

- Converted from `serve()` to `export default` pattern
- Removed `serve` import (no longer needed)

### 🗑️ Can Be Removed (Optional)

- `docker-compose.functions.yml` - Replaced by `docker-compose.yaml`

## How It Works

### Request Flow

```
User Request
    ↓
Coolify (functions.repclub.net)
    ↓
Docker Container (edge-runtime-server.ts)
    ↓
Function Router
    ↓
Load Function Module (supabase/functions/<name>/index.ts)
    ↓
Execute Function Handler
    ↓
Return Response (with CORS headers)
    ↓
User receives response
```

### Function Loading

1. Server starts and scans `supabase/functions/` directory
2. Finds all subdirectories with `index.ts` files
3. Logs discovered functions
4. On request, dynamically imports the function module
5. Caches the module for subsequent requests
6. Invokes the default export with the request object

### Health Check Flow

```
Docker Healthcheck (every 30s)
    ↓
curl http://localhost:8000/health
    ↓
edge-runtime-server.ts (built-in handler)
    ↓
Returns { status: "ok", timestamp: "..." }
    ↓
Docker marks container as healthy
```

## Environment Variables Flow

```
Coolify UI (Environment Variables)
    ↓
Docker Container (ENV vars)
    ↓
edge-runtime-server.ts (Deno.env.get())
    ↓
Function Handlers (Deno.env.get())
    ↓
External APIs (Supabase, OpenAI, Stripe, etc.)
```

## Deployment Process

1. **Coolify detects Git push** → Triggers deployment
2. **Clone repository** → Gets latest code
3. **Build Docker image** → Uses `Dockerfile.functions`
   - Installs Deno
   - Copies function files
   - Copies edge runtime server
   - Caches dependencies
4. **Create container** → Uses `docker-compose.yaml`
   - Injects environment variables
   - Maps port 8000
   - Sets up healthcheck
5. **Start container** → Runs `edge-runtime-server.ts`
   - Discovers functions
   - Starts HTTP server
   - Logs startup info
6. **Healthcheck** → Polls `/health` endpoint
   - Waits for "start period" (30s)
   - Checks every 30s
   - Marks healthy/unhealthy
7. **Traffic routing** → Coolify routes traffic if healthy
   - HTTPS via Let's Encrypt
   - Domain: `functions.repclub.net`
   - Routes to port 8000

## Function Requirements

All functions must follow this pattern:

```typescript
// ✅ CORRECT - Default export with Request → Response
export default async (req: Request): Promise<Response> => {
  // Your logic here
  return new Response(JSON.stringify({ result: "success" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
};
```

```typescript
// ❌ INCORRECT - Deno.serve pattern (won't work with our runtime)
Deno.serve((req) => {
  return new Response("...");
});
```

## Testing Checklist

After deployment, test these endpoints:

- [ ] `GET /` - List functions
- [ ] `GET /health` - Simple health check
- [ ] `GET /health-check` - Comprehensive health check
- [ ] `POST /<function-name>` - Test a specific function

## Key Benefits

1. **Production-Ready**: No development-only CLI tools
2. **Lightweight**: Only Deno runtime, no extra dependencies
3. **Fast**: Direct function execution, no subprocess spawning
4. **Observable**: Comprehensive logging and health checks
5. **Flexible**: Easy to add new functions, just create directory + index.ts
6. **Coolify-Compatible**: Works perfectly with Coolify's deployment model
7. **Self-Documenting**: Root endpoint lists all available functions
8. **CORS-Enabled**: Automatic CORS handling for web clients

## Environment Variables Checklist

Before deploying, ensure these are set in Coolify:

### Required (Functions won't work without these):

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Optional (Only if you use these functions):

- [ ] `OPENAI_API_KEY` - For ai-generate function
- [ ] `STRIPE_SECRET_KEY` - For payment functions
- [ ] `STRIPE_WEBHOOK_SECRET` - For payment webhooks
- [ ] `RESEND_API_KEY` - For email functions

## Next Steps

1. **Deploy to Coolify**:

   - Push changes to Git
   - Configure environment variables in Coolify
   - Deploy and monitor logs

2. **Test Functions**:

   - Use the testing checklist
   - Verify each function works as expected
   - Check health endpoints

3. **Monitor**:

   - Set up uptime monitoring (Uptime Kuma, Better Stack, etc.)
   - Configure alerts for healthcheck failures
   - Monitor function execution logs

4. **Update Frontend**:

   - Update frontend to use new edge functions URL
   - Change from Supabase hosted functions to self-hosted
   - Test all integrations

5. **Documentation**:
   - Document each function's API
   - Add usage examples
   - Create API reference

## Troubleshooting Quick Reference

| Issue               | Check                 | Solution                                          |
| ------------------- | --------------------- | ------------------------------------------------- |
| Container unhealthy | Logs                  | Verify env vars, check SUPABASE_URL accessibility |
| Function not found  | Function structure    | Ensure `index.ts` exists, has default export      |
| Database errors     | Health check endpoint | Verify SUPABASE_SERVICE_ROLE_KEY                  |
| CORS errors         | Browser console       | Already handled, check function response          |
| Slow responses      | Function logs         | Optimize function code, check API latencies       |

## Files Reference

```
gym-unity-suite/
├── Dockerfile.functions              # Docker image definition
├── docker-compose.yaml              # Coolify deployment config
├── edge-runtime-server.ts           # Custom edge runtime
├── .dockerignore                    # Docker build optimization
├── test-edge-functions-local.sh     # Local testing (Linux/Mac)
├── test-edge-functions-local.bat    # Local testing (Windows)
├── EDGE_FUNCTIONS_DEPLOYMENT.md     # Deployment guide
├── EDGE_FUNCTIONS_SETUP_SUMMARY.md  # This file
└── supabase/
    ├── config.toml                  # Supabase config
    └── functions/                   # All edge functions
        ├── ai-generate/
        │   └── index.ts
        ├── check-subscription/
        │   └── index.ts
        ├── health/
        │   └── index.ts
        └── ... (16 total functions)
```

## Success Criteria

✅ Deployment succeeds without "Docker daemon" errors  
✅ Healthcheck passes and container stays healthy  
✅ `/health` endpoint returns 200 OK  
✅ `/health-check` endpoint shows all services healthy  
✅ Individual functions can be called successfully  
✅ CORS works for web clients  
✅ Logs show function invocations

---

**Status**: ✅ Ready for deployment  
**Created**: 2025-12-16  
**Version**: 1.0.0
