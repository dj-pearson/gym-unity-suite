# 🚀 Edge Functions Setup - Quick Start

> **Production-ready Supabase Edge Functions for Coolify/Self-Hosted Deployment**

## 📋 What We Built

A complete, production-ready edge functions runtime that:
- ✅ Works perfectly with Coolify
- ✅ No Docker-in-Docker issues
- ✅ Automatic function discovery
- ✅ Built-in health checks
- ✅ Comprehensive logging
- ✅ CORS handling
- ✅ Local development support

## 🎯 Quick Deploy to Coolify

### 1. Set Environment Variables in Coolify

**Required** (functions won't work without these):
```env
SUPABASE_URL=https://api.repclub.net
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1Q...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1Q...
```

**Optional** (only if you use these functions):
```env
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

See `env.example` for full list with descriptions.

### 2. Configure Coolify Service

1. Create new Docker Compose service
2. Point to your Git repository
3. Set `docker-compose.yaml` as compose file
4. Configure domain (e.g., `functions.repclub.net`)
5. Click **Deploy**

### 3. Verify Deployment

```bash
# Health check
curl https://functions.repclub.net/health

# List all functions
curl https://functions.repclub.net/

# Test a function
curl -X POST https://functions.repclub.net/check-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"user_id":"123"}'
```

## 🧪 Local Development

### Prerequisites
- [Deno](https://deno.land/#installation) installed
- Create `.env` file from `env.example`

### Start Local Server

**Linux/Mac**:
```bash
chmod +x test-edge-functions-local.sh
./test-edge-functions-local.sh
```

**Windows**:
```cmd
test-edge-functions-local.bat
```

Server will start on `http://localhost:8000`

### Test Locally

```bash
# Health check
curl http://localhost:8000/health

# List functions
curl http://localhost:8000/

# Call a function
curl -X POST http://localhost:8000/your-function \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

## 📁 Project Structure

```
.
├── Dockerfile.functions              # Docker image for edge runtime
├── docker-compose.yaml              # Coolify deployment config
├── edge-runtime-server.ts           # Custom edge runtime (the magic!)
├── .dockerignore                    # Build optimization
├── env.example                      # Environment variables template
│
├── test-edge-functions-local.sh     # Local dev script (Unix)
├── test-edge-functions-local.bat    # Local dev script (Windows)
│
├── README.EDGE_FUNCTIONS.md         # This file
├── EDGE_FUNCTIONS_DEPLOYMENT.md     # Comprehensive deployment guide
├── EDGE_FUNCTIONS_SETUP_SUMMARY.md  # Technical details & architecture
│
└── supabase/
    ├── config.toml                  # Function-specific JWT settings
    └── functions/                   # Your edge functions
        ├── ai-generate/
        ├── check-subscription/
        ├── create-checkout/
        ├── health/
        ├── health-check/
        └── ... (16 functions total)
```

## ✨ Available Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `ai-generate` | `/ai-generate` | AI content generation |
| `check-subscription` | `/check-subscription` | Verify user subscriptions |
| `create-checkout` | `/create-checkout` | Stripe checkout sessions |
| `create-one-time-payment` | `/create-one-time-payment` | One-time payments |
| `customer-portal` | `/customer-portal` | Stripe customer portal |
| `generate-sitemap` | `/generate-sitemap` | SEO sitemap |
| `generate-wallet-pass` | `/generate-wallet-pass` | Apple Wallet passes |
| `get-org-by-domain` | `/get-org-by-domain` | Custom domain lookup |
| `health` | `/health` | Simple healthcheck |
| `health-check` | `/health-check` | Comprehensive healthcheck |
| `rate-limit` | `/rate-limit` | Rate limiting |
| `receive-email` | `/receive-email` | Inbound email webhook |
| `send-email-response` | `/send-email-response` | Send emails |
| `setup-new-user` | `/setup-new-user` | User onboarding |
| `verify-custom-domain` | `/verify-custom-domain` | Domain verification |
| `verify-payment` | `/verify-payment` | Payment verification |

## 🔧 Adding New Functions

1. **Create function directory**:
   ```bash
   mkdir -p supabase/functions/my-function
   ```

2. **Create handler** (`supabase/functions/my-function/index.ts`):
   ```typescript
   export default async (req: Request): Promise<Response> => {
     const { data } = await req.json();
     
     // Your logic here
     
     return new Response(
       JSON.stringify({ success: true, data }),
       {
         headers: { "Content-Type": "application/json" },
         status: 200,
       }
     );
   };
   ```

3. **Deploy**:
   ```bash
   git add supabase/functions/my-function
   git commit -m "feat: Add my-function"
   git push
   ```

   Function will be automatically discovered and available at `/my-function`

## 📚 Documentation

- **Quick Start**: This file (you are here!)
- **Deployment Guide**: See [EDGE_FUNCTIONS_DEPLOYMENT.md](./EDGE_FUNCTIONS_DEPLOYMENT.md)
  - Complete Coolify setup instructions
  - Environment variables reference
  - Testing procedures
  - Troubleshooting guide
  - Performance tips
  
- **Technical Details**: See [EDGE_FUNCTIONS_SETUP_SUMMARY.md](./EDGE_FUNCTIONS_SETUP_SUMMARY.md)
  - Architecture explanation
  - How the runtime works
  - File-by-file breakdown
  - Request flow diagrams

## ❓ Troubleshooting

### Container is unhealthy
- Check Coolify logs for errors
- Verify environment variables are set
- Ensure `SUPABASE_URL` is accessible

### Function returns 404
- Verify function directory has `index.ts`
- Check function exports `default` handler
- Look for errors in logs

### Database connection errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check `SUPABASE_URL` is accessible from container
- Review RLS policies in database

**See full troubleshooting guide in [EDGE_FUNCTIONS_DEPLOYMENT.md](./EDGE_FUNCTIONS_DEPLOYMENT.md)**

## 🎉 Success Checklist

After deployment, verify:

- [ ] Health check returns 200: `curl https://your-domain.com/health`
- [ ] Functions list loads: `curl https://your-domain.com/`
- [ ] Comprehensive health check passes: `curl https://your-domain.com/health-check`
- [ ] Individual function works: Test one with actual request
- [ ] Logs show function invocations in Coolify
- [ ] Container stays healthy (not restarting)

## 🚨 Important Notes

1. **Function Pattern**: All functions must use `export default` pattern (not `Deno.serve`)
2. **Environment Variables**: Set in Coolify UI, not in code
3. **Secrets**: Mark API keys as "Secret" in Coolify
4. **Health Checks**: Allow 30-60 seconds for first healthcheck to pass
5. **CORS**: Automatically handled by the runtime

## 🆘 Need Help?

1. Check logs in Coolify
2. Review [EDGE_FUNCTIONS_DEPLOYMENT.md](./EDGE_FUNCTIONS_DEPLOYMENT.md)
3. Test locally with development scripts
4. Check environment variables are correct

## 🎊 What's Different from Supabase Hosted?

| Feature | Supabase Hosted | Self-Hosted (This Setup) |
|---------|----------------|--------------------------|
| **Deployment** | Automatic | Via Coolify/Docker |
| **Custom Domain** | Limited | Full control |
| **Environment Vars** | Supabase Dashboard | Coolify UI |
| **Monitoring** | Supabase Logs | Your own tools |
| **Cost** | Per invocation | Flat hosting cost |
| **Control** | Limited | Full control |

## 📝 License

Same as main project.

---

**Ready to deploy?** Follow the steps above and you'll be up and running in minutes! 🚀

