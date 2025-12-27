/**
 * Stripe Configuration
 *
 * This file contains Stripe product, price, and payment link configurations.
 *
 * To generate actual values, run:
 *   node scripts/setup-stripe-products.mjs
 *
 * The script will:
 * 1. Create products in Stripe
 * 2. Create prices for each product
 * 3. Create payment links
 * 4. Update this file with the real IDs
 */

export interface StripePlan {
  id: string;
  name: string;
  productId: string;
  priceId: string;
  paymentLinkId: string;
  paymentLinkUrl: string;
  price: number;
  interval: 'month' | 'year';
  memberLimit: string;
  teamLimit: string;
  features: string[];
  popular?: boolean;
}

/**
 * Stripe Plans Configuration
 *
 * IMPORTANT: These placeholder values will be replaced when you run
 * the setup script. The values below are for development reference only.
 *
 * Run `node scripts/setup-stripe-products.mjs` to populate with real values.
 */
export const STRIPE_PLANS: Record<string, StripePlan> = {
  studio: {
    id: 'studio',
    name: 'Rep Club Studio',
    // Placeholder - will be set by setup script or environment variables
    productId: import.meta.env.VITE_STRIPE_PRODUCT_STUDIO || 'prod_placeholder_studio',
    priceId: import.meta.env.VITE_STRIPE_PRICE_STUDIO_MONTHLY || 'price_placeholder_studio',
    paymentLinkId: import.meta.env.VITE_STRIPE_LINK_STUDIO || 'plink_placeholder_studio',
    paymentLinkUrl: import.meta.env.VITE_STRIPE_URL_STUDIO || '',
    price: 149,
    interval: 'month',
    memberLimit: '500',
    teamLimit: '5',
    features: [
      'Complete member management',
      'Class scheduling & booking',
      'Mobile check-in system',
      'Automated billing & payments',
      'Basic reporting & analytics',
      'Email & SMS notifications',
      'Member mobile app',
      'Standard support'
    ]
  },
  professional: {
    id: 'professional',
    name: 'Rep Club Professional',
    productId: import.meta.env.VITE_STRIPE_PRODUCT_PROFESSIONAL || 'prod_placeholder_professional',
    priceId: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_placeholder_professional',
    paymentLinkId: import.meta.env.VITE_STRIPE_LINK_PROFESSIONAL || 'plink_placeholder_professional',
    paymentLinkUrl: import.meta.env.VITE_STRIPE_URL_PROFESSIONAL || '',
    price: 349,
    interval: 'month',
    memberLimit: '2000',
    teamLimit: '15',
    popular: true,
    features: [
      'Everything in Studio',
      'Advanced analytics & reporting',
      'Marketing automation tools',
      'Equipment management',
      'Staff scheduling & payroll',
      'Multi-location support (up to 3)',
      'Custom branding',
      'Priority support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Rep Club Enterprise',
    productId: import.meta.env.VITE_STRIPE_PRODUCT_ENTERPRISE || 'prod_placeholder_enterprise',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_placeholder_enterprise',
    paymentLinkId: import.meta.env.VITE_STRIPE_LINK_ENTERPRISE || 'plink_placeholder_enterprise',
    paymentLinkUrl: import.meta.env.VITE_STRIPE_URL_ENTERPRISE || '',
    price: 649,
    interval: 'month',
    memberLimit: 'unlimited',
    teamLimit: 'unlimited',
    features: [
      'Everything in Professional',
      'Unlimited locations',
      'Advanced CRM & lead management',
      'Custom integrations & API access',
      'White-label solutions',
      'Dedicated success manager',
      '24/7 premium support',
      'Custom training & onboarding'
    ]
  }
};

/**
 * Get a Stripe plan by ID
 */
export function getStripePlan(planId: string): StripePlan | undefined {
  return STRIPE_PLANS[planId];
}

/**
 * Get all Stripe plans as an array
 */
export function getAllStripePlans(): StripePlan[] {
  return Object.values(STRIPE_PLANS);
}

/**
 * Get the payment link URL for a plan
 * Falls back to checkout session creation if no payment link is configured
 */
export function getPaymentLinkUrl(planId: string): string | null {
  const plan = STRIPE_PLANS[planId];
  if (!plan) return null;

  // Prefer direct payment link URL if available
  if (plan.paymentLinkUrl && !plan.paymentLinkUrl.includes('placeholder')) {
    return plan.paymentLinkUrl;
  }

  return null;
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return !!publishableKey && !publishableKey.includes('placeholder');
}

/**
 * Main Stripe configuration object
 */
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  plans: STRIPE_PLANS,
  successUrl: 'https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://gymunitysuite.com/pricing',
  isConfigured: isStripeConfigured
};

export default STRIPE_CONFIG;
