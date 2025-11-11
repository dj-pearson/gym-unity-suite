# CORS Configuration for Custom Domains

This document outlines the CORS (Cross-Origin Resource Sharing) configuration needed to support custom domains in the Gym Unity application.

## Overview

When enterprise clients use custom domains, the application needs to accept API requests from those domains. This requires updating CORS policies across multiple components.

## Components Requiring CORS Updates

### 1. Supabase Configuration

#### Update Supabase CORS Settings

1. Go to Supabase Dashboard
2. Navigate to Settings > API
3. Add CORS origins:
   - `*` (wildcard for all custom domains) - **For development/testing only**
   - Or list specific verified domains

#### Recommended Production Setup

For production, dynamically validate origins in edge functions rather than using wildcard CORS.

### 2. Edge Functions CORS Headers

All edge functions already include CORS headers, but they need to support custom domains:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // This allows all origins
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
};
```

#### Enhanced CORS for Custom Domains

For better security, implement dynamic origin validation:

```typescript
function getCorsHeaders(request: Request) {
  const origin = request.headers.get("Origin");

  // List of allowed default domains
  const defaultDomains = [
    "https://gym-unity.app",
    "https://www.gym-unity.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  // Check if origin is a default domain
  const isDefaultDomain = defaultDomains.some(domain =>
    origin?.startsWith(domain)
  );

  // For custom domains, we accept all (validated by worker)
  // In production, you could query the database to verify
  const allowedOrigin = isDefaultDomain ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
    "Access-Control-Max-Age": "86400",
  };
}
```

### 3. Cloudflare Worker CORS

The Cloudflare Worker needs to handle CORS preflight requests:

```typescript
// In your worker
if (request.method === "OPTIONS") {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
```

### 4. Content Security Policy (CSP)

Update your Content Security Policy to allow resources from custom domains:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self' *.gym-unity.app;
               connect-src 'self' *.gym-unity.app *.supabase.co;
               img-src 'self' *.gym-unity.app data: https:;
               style-src 'self' 'unsafe-inline';
               script-src 'self' 'unsafe-inline' 'unsafe-eval';">
```

## Implementation Steps

### Step 1: Update Supabase Edge Functions

All edge functions (`verify-custom-domain`, `get-org-by-domain`, etc.) should include proper CORS headers. These are already implemented with wildcard origins.

### Step 2: Configure Supabase Dashboard

1. Go to Supabase Dashboard
2. Settings > API > CORS
3. Add allowed origins or use `*` for development

### Step 3: Update Cloudflare Worker

The worker should:
1. Handle OPTIONS preflight requests
2. Set appropriate CORS headers on responses
3. Pass through origin headers

### Step 4: Test CORS

Test CORS configuration with:

```bash
curl -X OPTIONS https://portal.customdomain.com/api/endpoint \
  -H "Origin: https://portal.customdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v
```

Expected response headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Security Considerations

### Production CORS Setup

For production, avoid using `*` for `Access-Control-Allow-Origin`. Instead:

1. **Dynamic Validation:** Validate origin against verified custom domains in database
2. **Whitelist Default Domains:** Maintain a list of allowed default domains
3. **Credentials:** If using credentials, you CANNOT use `*` - must specify exact origin

### Recommended Production CORS Function

```typescript
async function validateAndGetCorsHeaders(
  request: Request,
  supabase: SupabaseClient
): Promise<Record<string, string>> {
  const origin = request.headers.get("Origin");

  if (!origin) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
  }

  // Check default domains
  const defaultDomains = [
    "gym-unity.app",
    "www.gym-unity.app",
  ];

  const hostname = new URL(origin).hostname;

  if (defaultDomains.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Credentials": "true",
    };
  }

  // Check if it's a verified custom domain
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("custom_domain", hostname)
    .eq("custom_domain_verified", true)
    .maybeSingle();

  if (data) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Credentials": "true",
    };
  }

  // Origin not allowed
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}
```

## Troubleshooting

### CORS Error: "Access blocked by CORS policy"

**Symptoms:** Browser console shows CORS errors

**Solutions:**
1. Verify edge functions include CORS headers
2. Check Supabase CORS settings
3. Ensure preflight OPTIONS requests are handled
4. Verify the custom domain is properly configured

### Credentials Not Being Sent

**Symptoms:** Authentication cookies/headers not sent with requests

**Solutions:**
1. Set `Access-Control-Allow-Credentials: true`
2. Use specific origin instead of `*`
3. Include `credentials: 'include'` in fetch requests

### Mixed Content Warnings

**Symptoms:** HTTPS page loading HTTP resources

**Solutions:**
1. Ensure all API calls use HTTPS
2. Update Supabase URL to use HTTPS
3. Configure SSL certificates for custom domains

## Testing Checklist

- [ ] Default domain can make API requests
- [ ] Custom domain can make API requests
- [ ] OPTIONS preflight requests succeed
- [ ] Authentication works on custom domains
- [ ] WebSocket connections work (if applicable)
- [ ] No CORS errors in browser console
- [ ] API responses include correct CORS headers

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Supabase CORS Documentation](https://supabase.com/docs/guides/api/cors)
- [Cloudflare Workers CORS](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)
