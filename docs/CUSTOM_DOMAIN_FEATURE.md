# Custom Domain Feature - Complete Documentation

## Overview

The Custom Domain feature allows enterprise-tier organizations to use their own domain for their member portal and booking pages, maintaining consistent branding across all member touchpoints.

## Features

✅ **Custom Domain Routing** - Use your own domain (e.g., portal.yourgym.com)
✅ **Automatic SSL/TLS** - Free SSL certificates automatically provisioned
✅ **DNS Verification** - Secure domain ownership verification
✅ **Custom Branding** - Apply your organization's colors and logo
✅ **Enterprise Only** - Available exclusively for enterprise tier subscribers
✅ **Edge Routing** - Fast, global CDN-powered routing via Cloudflare

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client Request: https://portal.mygym.com                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Worker (Custom Domain Router)                   │
│  • Intercepts request                                        │
│  • Validates domain ownership                                │
│  • Fetches organization data                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌────────────────────────┐
│  Supabase Edge   │    │  Origin Server         │
│  Function        │    │  (gym-unity.app)       │
│  • Domain lookup │    │  • Application content │
└──────────────────┘    └────────────────────────┘
        │                         │
        └────────────┬────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Response with Custom Branding                               │
│  • Organization colors injected                              │
│  • Organization name in title                                │
│  • Custom domain headers                                     │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database Schema

**New Fields in `organizations` table:**
- `subscription_tier` - Tier level (studio, boutique, enterprise)
- `custom_domain` - The custom domain (e.g., portal.mygym.com)
- `custom_domain_verified` - Verification status (boolean)
- `domain_verification_token` - Token for DNS verification
- `domain_ssl_enabled` - SSL status (boolean)

**Migration File:** `supabase/migrations/20251111050358_add_custom_domain_support.sql`

### 2. Edge Functions

#### verify-custom-domain
Verifies domain ownership via DNS records.

**Location:** `supabase/functions/verify-custom-domain/index.ts`

**Features:**
- DNS TXT record verification
- CNAME/A record validation
- Organization tier check
- Automatic verification status update

#### get-org-by-domain
Retrieves organization data by custom domain.

**Location:** `supabase/functions/get-org-by-domain/index.ts`

**Features:**
- Fast domain lookup with caching
- Returns only verified domains
- Organization branding data included

### 3. Frontend Components

#### Custom Domain Settings UI
Full-featured UI for managing custom domains.

**Location:** `src/pages/OrganizationSettingsPage.tsx`

**Features:**
- Domain input and validation
- DNS configuration instructions
- Real-time verification
- Status indicators
- Copy-to-clipboard for DNS values

#### Custom Domain Context
React context for custom domain detection.

**Location:** `src/contexts/CustomDomainContext.tsx`

**Features:**
- Automatic domain detection
- Organization data loading
- Branding application
- Loading states

#### Custom Domain Hook
React hook for custom domain functionality.

**Location:** `src/hooks/useCustomDomain.ts`

**Features:**
- Domain detection on mount
- Organization API calls
- CSS variable injection
- Error handling

### 4. Cloudflare Worker

**Location:** `workers/custom-domain-router/`

**Features:**
- Custom domain interception
- Organization lookup
- HTML content injection
- CORS handling
- SSL termination

## User Journey

### For Organization Administrators

1. **Upgrade to Enterprise**
   - Navigate to pricing/billing
   - Select Enterprise tier
   - Complete payment

2. **Configure Custom Domain**
   - Go to Settings > Organization Settings > Custom Domain
   - Enter custom domain (e.g., portal.mygym.com)
   - Click "Save Domain"
   - Receive verification token

3. **Configure DNS**
   - Log in to DNS provider
   - Add TXT record with verification token
   - Add CNAME record pointing to gym-unity.app
   - Wait for DNS propagation (5-60 minutes)

4. **Verify Domain**
   - Return to Custom Domain settings
   - Click "Verify Domain"
   - Wait for verification (5-30 seconds)
   - See success confirmation

5. **Access Custom Domain**
   - Navigate to custom domain
   - See branded portal
   - Share with members

### For Members

1. **Receive Custom Domain**
   - Organization shares custom domain link
   - Example: https://portal.mygym.com

2. **Access Portal**
   - Visit custom domain
   - See gym's branding
   - Seamless experience

3. **Bookings and Check-ins**
   - Use portal normally
   - All features work identically
   - Consistent branding throughout

## Setup Guides

### For Developers

1. **Database Setup**
   ```bash
   # Run migration
   supabase db push
   ```

2. **Deploy Edge Functions**
   ```bash
   # Deploy verification function
   supabase functions deploy verify-custom-domain

   # Deploy domain lookup function
   supabase functions deploy get-org-by-domain
   ```

3. **Deploy Cloudflare Worker**
   ```bash
   cd workers/custom-domain-router
   wrangler login
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_ANON_KEY
   wrangler deploy --env production
   ```

4. **Update Frontend**
   ```bash
   # Install dependencies
   npm install

   # Build application
   npm run build

   # Deploy
   npm run deploy
   ```

### For End Users

See [DNS Setup Guide](./CUSTOM_DOMAIN_DNS_SETUP.md) for detailed instructions.

## Configuration

### Environment Variables

**Supabase Edge Functions:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_DOMAIN=gym-unity.app  # Optional
APP_IP_ADDRESS=your-ip    # Optional for A record validation
```

**Cloudflare Worker:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DEFAULT_ORIGIN=gym-unity.app
```

### DNS Configuration

**Required DNS Records:**

1. **TXT Record (Verification):**
   ```
   Type: TXT
   Name: @
   Value: gym-unity-verify-[token]
   ```

2. **CNAME Record (Routing):**
   ```
   Type: CNAME
   Name: portal (or subdomain)
   Value: gym-unity.app
   ```

## Security

### Domain Verification

- Verification tokens are randomly generated (32 characters)
- Tokens are unique per organization
- Tokens regenerate on domain change
- DNS TXT records prevent domain hijacking

### SSL/TLS

- Automatic SSL certificate provisioning via Cloudflare
- TLS 1.2+ required
- HTTPS-only (HTTP redirects to HTTPS)
- HSTS headers for security

### Access Control

- Only enterprise tier can set custom domains
- Database trigger enforces tier restriction
- RLS policies protect organization data
- Only owners/managers can manage domains

### CORS

- Dynamic CORS validation
- Verified domains allowed
- Preflight requests handled
- See [CORS Documentation](./CUSTOM_DOMAIN_CORS.md)

## Monitoring

### Cloudflare Analytics

Monitor in Cloudflare Dashboard:
- Request volume
- Error rates
- Response times
- Geographic distribution

### Supabase Logs

Monitor in Supabase Dashboard:
- Edge function invocations
- Verification attempts
- Database queries
- Error logs

### Application Metrics

Track in application:
- Custom domain usage
- Verification success rate
- Domain changes
- Support tickets

## Troubleshooting

### Common Issues

1. **Domain Verification Failed**
   - Check DNS propagation (use dnschecker.org)
   - Verify TXT record value matches exactly
   - Wait up to 24 hours for DNS propagation
   - Check for typos in verification token

2. **SSL Certificate Errors**
   - Wait 15-30 minutes for provisioning
   - Ensure Cloudflare proxy is enabled
   - Check SSL mode is "Full" or "Full (Strict)"
   - Verify CNAME points to correct domain

3. **404 Not Found**
   - Confirm domain is verified in settings
   - Check Cloudflare Worker is deployed
   - Verify CNAME record is correct
   - Clear browser cache

4. **CORS Errors**
   - Check Supabase CORS settings
   - Verify edge function CORS headers
   - Check browser console for details
   - See [CORS Documentation](./CUSTOM_DOMAIN_CORS.md)

### Debug Commands

```bash
# Check DNS records
dig TXT yourdomain.com
dig CNAME portal.yourdomain.com

# Check DNS propagation
nslookup -type=TXT yourdomain.com
nslookup portal.yourdomain.com

# Test domain
curl -I https://portal.yourdomain.com

# Check SSL
openssl s_client -connect portal.yourdomain.com:443
```

## Performance

### Expected Performance

- **Domain Lookup:** <10ms (cached)
- **Worker Execution:** <50ms
- **Total Overhead:** <100ms
- **SSL Handshake:** <200ms

### Optimization

- Organization data cached at edge
- DNS lookups cached (5 minutes)
- HTML injection minimal overhead
- Cloudflare global CDN

## Costs

### Infrastructure Costs

- **Cloudflare Workers:** ~$5/month (1M requests included)
- **Supabase Edge Functions:** Included in plan
- **SSL Certificates:** Free (Let's Encrypt)
- **DNS Queries:** Minimal cost

### Per-Customer Costs

- **Storage:** ~1KB per organization
- **Edge Function Calls:** ~10 per verification
- **Worker Invocations:** ~100 per day per domain
- **Total:** ~$0.50/month per custom domain

## Testing

### Manual Testing Checklist

- [ ] Enterprise tier can save custom domain
- [ ] Non-enterprise tier sees upgrade prompt
- [ ] DNS verification token generated
- [ ] DNS verification succeeds with correct records
- [ ] DNS verification fails with incorrect records
- [ ] Custom domain loads with branding
- [ ] SSL certificate provisioned automatically
- [ ] Member portal functions correctly
- [ ] Booking system works on custom domain
- [ ] Authentication persists across domains
- [ ] CORS headers present
- [ ] Error pages show correctly

### Automated Testing

```bash
# Run integration tests
npm run test:integration

# Test edge functions
supabase functions serve
npm run test:functions

# Test worker locally
cd workers/custom-domain-router
wrangler dev
npm run test:worker
```

## Future Enhancements

### Planned Features

- [ ] Multiple custom domains per organization
- [ ] Custom domain analytics dashboard
- [ ] Automatic SSL renewal notifications
- [ ] Custom domain templates
- [ ] White-label mobile apps
- [ ] Custom email domains
- [ ] Subdomain routing (e.g., member.portal.mygym.com)

### Under Consideration

- [ ] API access via custom domain
- [ ] Webhook endpoints on custom domain
- [ ] Custom domain for email notifications
- [ ] Geo-routing for global organizations
- [ ] A/B testing on custom domains

## Support

### Documentation

- [DNS Setup Guide](./CUSTOM_DOMAIN_DNS_SETUP.md)
- [CORS Configuration](./CUSTOM_DOMAIN_CORS.md)
- [Cloudflare Worker README](../workers/custom-domain-router/README.md)

### Getting Help

- **Email:** support@gym-unity.com
- **Documentation:** docs.gym-unity.com
- **Status Page:** status.gym-unity.com

## License

Custom Domain feature is part of Gym Unity's Enterprise tier.

---

**Last Updated:** 2025-11-11
**Version:** 1.0.0
**Maintainer:** Development Team
