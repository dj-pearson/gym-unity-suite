# Custom Domain DNS Setup Guide

This guide will help you configure DNS settings to use your custom domain with Gym Unity.

## Prerequisites

- ✅ Enterprise tier subscription
- ✅ Access to your domain's DNS management panel
- ✅ Your custom domain (e.g., `portal.yourgym.com`)

## Step-by-Step DNS Configuration

### Step 1: Access Your DNS Provider

Log in to your DNS provider's dashboard. Common DNS providers include:
- Cloudflare
- GoDaddy
- Namecheap
- Google Domains
- Route 53 (AWS)

### Step 2: Add TXT Record for Verification

First, add a TXT record to verify domain ownership.

**Record Details:**
```
Type: TXT
Name: @ (or leave blank for root domain)
Value: [Copy from Gym Unity settings - starts with "gym-unity-verify-"]
TTL: 3600 (or default)
```

**Example:**
```
Type: TXT
Name: @
Value: gym-unity-verify-abc123xyz789
TTL: 3600
```

### Step 3: Add CNAME Record

Next, add a CNAME record to point your domain to Gym Unity.

**For Subdomain (Recommended):**
```
Type: CNAME
Name: portal (or your chosen subdomain)
Value: gym-unity.app
TTL: 3600
Proxy Status: Enabled (if using Cloudflare)
```

**For Root Domain:**
```
Type: CNAME or ALIAS
Name: @ (or leave blank)
Value: gym-unity.app
TTL: 3600
```

> **Note:** Some DNS providers don't support CNAME records for root domains. Use ALIAS or ANAME records if available, or use a subdomain instead.

## Provider-Specific Instructions

### Cloudflare

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. Go to "DNS" > "Records"
4. Click "Add record"

**TXT Record:**
```
Type: TXT
Name: @
Content: [your verification token]
Proxy status: DNS only (gray cloud)
```

**CNAME Record:**
```
Type: CNAME
Name: portal
Target: gym-unity.app
Proxy status: Proxied (orange cloud) - RECOMMENDED
TTL: Auto
```

> **Cloudflare Users:** Enable "Proxied" (orange cloud) for automatic SSL and DDoS protection.

### GoDaddy

1. Log in to [GoDaddy](https://www.godaddy.com)
2. Go to "My Products" > "DNS"
3. Click "Add" under Records

**TXT Record:**
```
Type: TXT
Name: @
Value: [your verification token]
TTL: 1 Hour
```

**CNAME Record:**
```
Type: CNAME
Name: portal
Value: gym-unity.app
TTL: 1 Hour
```

### Namecheap

1. Log in to [Namecheap](https://www.namecheap.com)
2. Go to "Domain List" > "Manage"
3. Click "Advanced DNS"

**TXT Record:**
```
Type: TXT Record
Host: @
Value: [your verification token]
TTL: Automatic
```

**CNAME Record:**
```
Type: CNAME Record
Host: portal
Value: gym-unity.app
TTL: Automatic
```

### Google Domains

1. Log in to [Google Domains](https://domains.google.com)
2. Select your domain
3. Click "DNS" in the left menu

**TXT Record:**
```
Host name: @
Type: TXT
TTL: 3600
Data: [your verification token]
```

**CNAME Record:**
```
Host name: portal
Type: CNAME
TTL: 3600
Data: gym-unity.app
```

### AWS Route 53

1. Log in to [AWS Console](https://console.aws.amazon.com/route53)
2. Go to "Hosted zones"
3. Select your domain
4. Click "Create record"

**TXT Record:**
```
Record name: [leave blank for root]
Record type: TXT
Value: "[your verification token]"
TTL: 300
Routing policy: Simple routing
```

**CNAME Record:**
```
Record name: portal
Record type: CNAME
Value: gym-unity.app
TTL: 300
Routing policy: Simple routing
```

## Verification Process

### After Adding DNS Records

1. Wait 5-10 minutes for DNS propagation (can take up to 24 hours)
2. Return to Gym Unity settings
3. Go to Organization Settings > Custom Domain
4. Click "Verify Domain"
5. If successful, you'll see a green checkmark ✓

### Check DNS Propagation

Use these tools to check if your DNS records are properly configured:

- **DNS Checker:** https://dnschecker.org
- **What's My DNS:** https://www.whatsmydns.net
- **Google Dig:** https://toolbox.googleapps.com/apps/dig/

**Check TXT Record:**
```bash
dig TXT yourdomain.com
```

**Check CNAME Record:**
```bash
dig CNAME portal.yourdomain.com
```

## Common Issues and Solutions

### Issue 1: Verification Failed

**Symptoms:**
- "Verification failed" error message
- DNS records not found

**Solutions:**
1. Wait longer - DNS propagation can take up to 24 hours
2. Check TXT record value matches exactly (including no extra spaces)
3. Ensure you're using `@` for the record name (or leave blank)
4. Clear your browser cache and try again
5. Use DNS checker tools to verify records are visible

### Issue 2: CNAME Conflict

**Symptoms:**
- "CNAME record conflicts with other records" error

**Solutions:**
1. Remove any existing A or AAAA records for the same hostname
2. Use a subdomain instead of root domain
3. If you must use root domain, use ALIAS or ANAME record type

### Issue 3: SSL Certificate Not Working

**Symptoms:**
- "Not Secure" warning in browser
- SSL certificate errors

**Solutions:**
1. If using Cloudflare, ensure "Proxied" (orange cloud) is enabled
2. Wait 15-30 minutes for SSL certificate provisioning
3. Ensure your CNAME points to `gym-unity.app` correctly
4. Check SSL mode in Cloudflare is set to "Full" or "Full (Strict)"

### Issue 4: Domain Not Loading

**Symptoms:**
- Domain shows "Domain not found" error
- 404 or 502 errors

**Solutions:**
1. Verify domain in Gym Unity settings first
2. Check CNAME record is correct: `gym-unity.app`
3. Ensure DNS records have propagated globally
4. Clear browser cache and try incognito mode
5. Try accessing with `https://` explicitly

## DNS Record Examples

### Complete DNS Setup for Subdomain

```
# TXT Record for Verification
Type: TXT
Name: @
Value: gym-unity-verify-abc123xyz789
TTL: 3600

# CNAME Record for Portal
Type: CNAME
Name: portal
Value: gym-unity.app
TTL: 3600

# Optional: Email Records (keep existing)
Type: MX
Name: @
Value: [your email provider]
Priority: 10
TTL: 3600
```

### Complete DNS Setup for Root Domain

```
# TXT Record for Verification
Type: TXT
Name: @
Value: gym-unity-verify-abc123xyz789
TTL: 3600

# ALIAS/ANAME Record for Root Domain
Type: ALIAS (or ANAME)
Name: @
Value: gym-unity.app
TTL: 3600

# Optional: WWW Redirect
Type: CNAME
Name: www
Value: gym-unity.app
TTL: 3600
```

## Testing Your Custom Domain

### 1. Test DNS Resolution

```bash
# Check TXT record
nslookup -type=TXT yourdomain.com

# Check CNAME record
nslookup portal.yourdomain.com

# Or use dig
dig TXT yourdomain.com
dig CNAME portal.yourdomain.com
```

### 2. Test in Browser

1. Open your browser
2. Navigate to `https://portal.yourdomain.com`
3. You should see your Gym Unity portal with your branding
4. Check the URL bar for secure connection (lock icon)

### 3. Test API Connectivity

```bash
# Test API endpoint
curl -I https://portal.yourdomain.com/api/health
```

## Best Practices

### ✅ Recommended

- Use a subdomain (e.g., `portal.yourgym.com`, `members.yourgym.com`)
- Enable Cloudflare proxy if using Cloudflare for automatic SSL and protection
- Set TTL to 3600 (1 hour) for faster updates if needed
- Keep your main domain's existing records intact
- Document your DNS changes

### ❌ Avoid

- Using root domain if you have existing services
- Setting TTL too high (> 24 hours) during initial setup
- Removing existing important DNS records
- Using IP addresses instead of CNAME
- Disabling SSL/HTTPS

## Rollback Instructions

If you need to remove the custom domain:

1. Go to Gym Unity Settings > Custom Domain
2. Remove the custom domain value
3. Save changes
4. Optionally, remove the DNS records from your DNS provider
5. Wait for DNS cache to clear (up to 24 hours)

## Support

If you encounter issues:

1. Check this documentation first
2. Use DNS checker tools to verify records
3. Wait 24 hours for DNS propagation
4. Contact Gym Unity support with:
   - Your domain name
   - Screenshot of DNS records
   - Error messages (if any)
   - DNS checker results

## Security Notes

- Never share your verification token publicly
- Regenerate verification token if compromised
- Use HTTPS only - never disable SSL
- Keep your DNS provider account secure
- Enable 2FA on your DNS provider account

## Additional Resources

- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Understanding DNS Records](https://www.cloudflare.com/learning/dns/dns-records/)
- [SSL/TLS Best Practices](https://www.cloudflare.com/learning/ssl/what-is-ssl/)
- [DNS Propagation Explained](https://www.cloudflare.com/learning/dns/dns-propagation/)
