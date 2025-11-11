# Custom Domain Router - Cloudflare Worker

This Cloudflare Worker handles routing for custom domains, enabling enterprise clients to use their own domains for the Gym Unity application.

## Features

- ✅ Automatic domain verification lookup
- ✅ Organization-specific branding injection
- ✅ SSL/TLS automatic certificate provisioning
- ✅ Seamless routing to application
- ✅ Custom headers for organization identification

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Set Environment Secrets

```bash
# Set your Supabase URL
wrangler secret put SUPABASE_URL --env production
# Enter your Supabase project URL when prompted

# Set your Supabase anonymous key
wrangler secret put SUPABASE_ANON_KEY --env production
# Enter your Supabase anonymous key when prompted
```

### 4. Deploy the Worker

```bash
# Deploy to production
wrangler deploy --env production

# Or deploy to staging
wrangler deploy --env staging
```

### 5. Configure Custom Domain in Cloudflare

1. Go to your Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Settings > Triggers > Custom Domains
5. Click "Add Custom Domain"
6. Add the wildcard domain that will catch all custom domains (e.g., `*.gym-unity.app`)

### 6. Configure DNS for Client Custom Domains

When a client wants to use their custom domain (e.g., `portal.mygym.com`):

1. Client adds a CNAME record:
   - **Type:** CNAME
   - **Name:** @ (or subdomain like 'portal')
   - **Value:** gym-unity.app (your main domain)
   - **Proxy status:** Proxied (orange cloud in Cloudflare)

2. Client adds a TXT record for verification:
   - **Type:** TXT
   - **Name:** @
   - **Value:** [verification token from database]

3. Once DNS is configured, they verify the domain in the application settings

## How It Works

1. **Request Interception:** When a request comes to a custom domain, the worker intercepts it
2. **Domain Lookup:** The worker queries the Supabase edge function to check if the domain is verified
3. **Organization Data:** If verified, it retrieves the organization's branding data
4. **Content Injection:** The worker injects organization-specific branding into the HTML
5. **Response:** The branded response is served to the client

## Architecture Flow

```
Client Request (portal.mygym.com)
         ↓
Cloudflare Worker
         ↓
Check Domain in Database → Supabase Edge Function
         ↓
Fetch Original Content → Origin Server (gym-unity.app)
         ↓
Inject Branding → Custom Colors, Logo, Name
         ↓
Return Branded Response → Client
```

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `DEFAULT_ORIGIN`: The default origin domain (default: gym-unity.app)

## Testing

### Test Locally

```bash
# Start local development server
wrangler dev
```

### Test with Custom Domain

1. Add a test entry to your hosts file:
   ```
   127.0.0.1 test-portal.local
   ```

2. Access `http://test-portal.local:8787` in your browser

3. The worker should intercept and handle the request

## Monitoring

View worker logs in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click on "Logs" tab
4. View real-time logs and analytics

## Troubleshooting

### Domain Not Found Error

- Verify the domain is added in the organization settings
- Check that the domain verification is complete
- Ensure DNS records are properly configured and propagated

### SSL Certificate Issues

- Cloudflare automatically provisions SSL certificates for custom domains
- Certificate provisioning can take a few minutes
- Ensure the domain is proxied through Cloudflare (orange cloud)

### Worker Not Triggering

- Verify the worker routes are properly configured
- Check that the custom domain is added to the worker triggers
- Ensure DNS is pointing to Cloudflare

## Security Considerations

- Worker runs on Cloudflare's edge network
- All traffic is automatically SSL/TLS encrypted
- Organization data is cached for performance
- Rate limiting can be added if needed

## Performance

- Worker executes at Cloudflare edge locations worldwide
- Minimal latency impact (<5ms typically)
- Content caching for improved performance
- Automatic DDoS protection

## Support

For issues or questions, contact the development team or check the main documentation.
