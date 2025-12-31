# Stripe Products Setup - Manual Instructions

## Issue
Your network's DNS filter (dnsfilter.com) is blocking access to Stripe's API at `api.stripe.com`, preventing the automated script from running.

## Solutions

### Option 1: Disable DNS Filter (Recommended for Quick Setup)
1. Temporarily disable your DNS filter or VPN
2. Run the script: `.\setup-stripe-products-api.ps1`
3. Re-enable your DNS filter after completion

### Option 2: Add Stripe to DNS Filter Allowlist
Add the following domains to your DNS filter's allowlist:
- `api.stripe.com`
- `*.stripe.com`

### Option 3: Use Different Network
- Connect to a mobile hotspot
- Use a different WiFi network
- Use a VPN that doesn't intercept Stripe traffic

### Option 4: Manual Setup via Stripe Dashboard

If you cannot access the API, you can create everything manually in the Stripe Dashboard:

#### Step 1: Create Products

**Go to:** https://dashboard.stripe.com/test/products (for test mode)

Create 3 products with these details:

**Product 1: Rep Club Studio**
- Name: `Rep Club Studio`
- Description: `Complete gym management for single studios. Up to 500 members, 5 team members. Includes member management, class scheduling, mobile check-in, automated billing, basic reporting, email & SMS notifications, member mobile app, and standard support.`
- Pricing Model: Recurring
- Price: $149 USD / month
- Metadata:
  - `tier`: `studio`
  - `member_limit`: `500`
  - `team_limit`: `5`
  - `plan`: `studio_monthly` (add to price)

**Product 2: Rep Club Professional**
- Name: `Rep Club Professional`
- Description: `Advanced gym management for growing businesses. Up to 2,000 members, 15 team members. Everything in Studio plus advanced analytics, marketing automation, equipment management, staff scheduling & payroll, multi-location support (up to 3), custom branding, and priority support.`
- Pricing Model: Recurring
- Price: $349 USD / month
- Metadata:
  - `tier`: `professional`
  - `member_limit`: `2000`
  - `team_limit`: `15`
  - `plan`: `professional_monthly` (add to price)

**Product 3: Rep Club Enterprise**
- Name: `Rep Club Enterprise`
- Description: `Enterprise-grade gym management with unlimited scale. Unlimited members and team members. Everything in Professional plus unlimited locations, advanced CRM & lead management, custom integrations & API access, white-label solutions, dedicated success manager, 24/7 premium support, and custom training & onboarding.`
- Pricing Model: Recurring
- Price: $649 USD / month
- Metadata:
  - `tier`: `enterprise`
  - `member_limit`: `unlimited`
  - `team_limit`: `unlimited`
  - `plan`: `enterprise_monthly` (add to price)

#### Step 2: Create Payment Links

**Go to:** https://dashboard.stripe.com/test/payment-links

Create 3 payment links:
1. **Studio Link**: Use the Studio price, redirect to `https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}`
2. **Professional Link**: Use the Professional price, same redirect URL
3. **Enterprise Link**: Use the Enterprise price, same redirect URL

#### Step 3: Copy IDs to Environment Configuration

After creating everything, copy these IDs from the dashboard:

```env
# Product IDs (from product detail pages, look like "prod_...")
VITE_STRIPE_PRODUCT_STUDIO=prod_XXXXXXXXXXXXX
VITE_STRIPE_PRODUCT_PROFESSIONAL=prod_XXXXXXXXXXXXX
VITE_STRIPE_PRODUCT_ENTERPRISE=prod_XXXXXXXXXXXXX

# Price IDs (from product detail pages, look like "price_...")
VITE_STRIPE_PRICE_STUDIO_MONTHLY=price_XXXXXXXXXXXXX
VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_XXXXXXXXXXXXX
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_XXXXXXXXXXXXX

# Payment Link IDs (from payment links page, look like "plink_...")
VITE_STRIPE_LINK_STUDIO=plink_XXXXXXXXXXXXX
VITE_STRIPE_LINK_PROFESSIONAL=plink_XXXXXXXXXXXXX
VITE_STRIPE_LINK_ENTERPRISE=plink_XXXXXXXXXXXXX
```

## For Live Mode

When ready to deploy to production:

### If Using Script:
1. Get your Live API key from: https://dashboard.stripe.com/apikeys
2. Set it: `$env:STRIPE_API_KEY = "sk_live_..."`
3. Run with `-Live` flag: `.\setup-stripe-products-api.ps1 -Live`

### If Using Dashboard:
1. Switch to Live mode in Stripe Dashboard (toggle in top left)
2. Repeat all the manual steps above
3. Copy the Live IDs to your production environment variables

## Testing

After setup, test your payment links by:
1. Opening each payment link URL in a browser
2. Using Stripe's test card: `4242 4242 4242 4242`
3. Any future expiry date and any 3-digit CVC
4. Verify the redirect works after successful payment

## Verification

You can verify everything is set up correctly by checking:
- Products page: https://dashboard.stripe.com/test/products
- Payment Links page: https://dashboard.stripe.com/test/payment-links
- Test mode: Use test API keys and test card numbers
- Live mode: Use live API keys and real payment methods

## Need Help?

If you continue to have issues:
1. Check Stripe's status page: https://status.stripe.com
2. Review Stripe's API documentation: https://stripe.com/docs/api
3. Contact your network administrator about allowing Stripe API access
