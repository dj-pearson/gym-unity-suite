# Stripe Configuration Complete

## ✅ What's Been Configured

Your Stripe products have been successfully created and configured in **LIVE MODE**:

### Products Created:
- **Rep Club Studio** - $149/month (500 members, 5 team members)
- **Rep Club Professional** - $349/month (2,000 members, 15 team members)
- **Rep Club Enterprise** - $649/month (Unlimited members and team)

### Configuration Files Updated:

#### 1. `.env` and `.env.example`
Contains all Stripe IDs for frontend use:
- Product IDs
- Price IDs
- Payment Link IDs

#### 2. `wrangler.toml`
Contains Stripe IDs for Cloudflare Workers/Functions

## 🔐 Next Steps: Set Secret Keys

### For Local Development:
Your `.env` file needs these secret values (get from Stripe Dashboard):

```bash
# Get these from: https://dashboard.stripe.com/apikeys
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### For Cloudflare Workers (Production):
Set secrets using Wrangler CLI:

```powershell
# Set Stripe Secret Key (from https://dashboard.stripe.com/apikeys)
wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_live_51S0YNQRk7qIKHyBw...

# Set Stripe Public Key
wrangler secret put STRIPE_PUBLIC_KEY
# Enter: pk_live_...

# Set Webhook Secret (create webhook at https://dashboard.stripe.com/webhooks)
wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter: whsec_...
```

### For Supabase Edge Functions:
Set secrets using Supabase CLI:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_51S0YNQRk7qIKHyBw...
supabase secrets set STRIPE_PUBLIC_KEY=pk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📋 Your Stripe IDs (LIVE MODE)

### Product IDs:
- Studio: `prod_ThqORj2w9AtgVm`
- Professional: `prod_ThqOZHRSXJ61d4`
- Enterprise: `prod_ThqOQBPPZ0tTYX`

### Price IDs (Monthly):
- Studio: `price_1SkQhRRk7qIKHyBwl224HqmT`
- Professional: `price_1SkQhSRk7qIKHyBwWPsf8h7k`
- Enterprise: `price_1SkQhTRk7qIKHyBwbFfJ0dym`

### Payment Link IDs:
- Studio: `plink_1SkQhTRk7qIKHyBwuUkyjrxX`
- Professional: `plink_1SkQhVRk7qIKHyBwbBuuJ2mQ`
- Enterprise: `plink_1SkQhWRk7qIKHyBw66wN6zky`

### Payment Link URLs:
View in Stripe Dashboard: https://dashboard.stripe.com/payment-links

## 🔗 Setting Up Webhooks

To receive payment notifications:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - For Cloudflare: `https://yourdomain.com/api/stripe/webhook`
   - For Supabase: `https://your-functions-url.supabase.co/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add it to your environment configuration (see above)

## 🧪 Testing

### Test the Payment Links:
Each payment link is now live. You can test by:
1. Going to Stripe Dashboard → Payment Links
2. Clicking on each link to get the full URL
3. Testing with real payment information (since these are LIVE mode)

⚠️ **WARNING:** These are LIVE mode products. Real charges will be made!

### Test Card (only works in test mode):
If you want to test without real charges, create the same setup in test mode:
```powershell
# Switch to test key
$env:STRIPE_API_KEY = "sk_test_51S0YNQRk7qIKHyBw..."
.\scripts\setup-stripe-products-api.ps1
```

Then use test card:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

## 📝 Environment Variable Summary

Copy these to your `.env` file:

```env
# Stripe Configuration (LIVE MODE)
VITE_STRIPE_PUBLIC_KEY=pk_live_your-key-here

# Product IDs
VITE_STRIPE_PRODUCT_STUDIO=prod_ThqORj2w9AtgVm
VITE_STRIPE_PRODUCT_PROFESSIONAL=prod_ThqOZHRSXJ61d4
VITE_STRIPE_PRODUCT_ENTERPRISE=prod_ThqOQBPPZ0tTYX

# Price IDs
VITE_STRIPE_PRICE_STUDIO_MONTHLY=price_1SkQhRRk7qIKHyBwl224HqmT
VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1SkQhSRk7qIKHyBwWPsf8h7k
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1SkQhTRk7qIKHyBwbFfJ0dym

# Payment Link IDs
VITE_STRIPE_LINK_STUDIO=plink_1SkQhTRk7qIKHyBwuUkyjrxX
VITE_STRIPE_LINK_PROFESSIONAL=plink_1SkQhVRk7qIKHyBwbBuuJ2mQ
VITE_STRIPE_LINK_ENTERPRISE=plink_1SkQhWRk7qIKHyBw66wN6zky

# Secret Keys (Backend only)
STRIPE_SECRET_KEY=sk_live_your-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
```

## ✨ You're All Set!

Your Stripe products are now configured and ready to accept payments. Next steps:
1. Add your secret keys to `.env` and deploy environments
2. Set up webhooks to handle subscription events
3. Test the payment flow end-to-end
4. Update your frontend pricing page to use the payment links
