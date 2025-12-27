/**
 * Gym Unity Suite / Rep Club - Stripe Products Setup Script
 *
 * This script creates all required Stripe products, prices, and payment links
 * for the SaaS subscription tiers.
 *
 * Usage:
 *   1. Install dependencies: npm install stripe dotenv
 *   2. Set STRIPE_SECRET_KEY in your .env file or environment
 *   3. Run: node scripts/setup-stripe-products.mjs
 *
 * Options:
 *   --live    Use live mode (requires live API key)
 *   --dry-run Show what would be created without creating
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isLiveMode = args.includes('--live');
const isDryRun = args.includes('--dry-run');

// Load environment variables
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
} catch (e) {
  // Ignore if no .env file
}

// Get API key
const apiKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;

if (!apiKey && !isDryRun) {
  console.error('\x1b[31mERROR: STRIPE_SECRET_KEY environment variable is required\x1b[0m');
  console.log('\nSet it in your .env file or environment:');
  console.log('  export STRIPE_SECRET_KEY=sk_test_...');
  process.exit(1);
}

// Initialize Stripe
const stripe = isDryRun ? null : new Stripe(apiKey, { apiVersion: '2023-10-16' });

// Configuration for the plans
const PLANS = [
  {
    id: 'studio',
    name: 'Rep Club Studio',
    description: 'Complete gym management for single studios. Up to 500 members, 5 team members. Includes member management, class scheduling, mobile check-in, automated billing, basic reporting, email & SMS notifications, member mobile app, and standard support.',
    price: 14900, // $149 in cents
    interval: 'month',
    metadata: {
      tier: 'studio',
      member_limit: '500',
      team_limit: '5'
    },
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
  {
    id: 'professional',
    name: 'Rep Club Professional',
    description: 'Advanced gym management for growing businesses. Up to 2,000 members, 15 team members. Everything in Studio plus advanced analytics, marketing automation, equipment management, staff scheduling & payroll, multi-location support (up to 3), custom branding, and priority support.',
    price: 34900, // $349 in cents
    interval: 'month',
    metadata: {
      tier: 'professional',
      member_limit: '2000',
      team_limit: '15'
    },
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
  {
    id: 'enterprise',
    name: 'Rep Club Enterprise',
    description: 'Enterprise-grade gym management with unlimited scale. Unlimited members and team members. Everything in Professional plus unlimited locations, advanced CRM & lead management, custom integrations & API access, white-label solutions, dedicated success manager, 24/7 premium support, and custom training & onboarding.',
    price: 64900, // $649 in cents
    interval: 'month',
    metadata: {
      tier: 'enterprise',
      member_limit: 'unlimited',
      team_limit: 'unlimited'
    },
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
];

const SUCCESS_URL = 'https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}';
const CANCEL_URL = 'https://gymunitysuite.com/pricing';

// Results storage
const results = {
  products: {},
  prices: {},
  paymentLinks: {},
  paymentLinkUrls: {}
};

// Helper functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

function logStep(step, details = '') {
  const detailStr = details ? ` - ${details}` : '';
  log(`  ${step}${detailStr}`, 'gray');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main setup function
async function setupStripeProducts() {
  log('============================================', 'cyan');
  log('  Gym Unity Suite - Stripe Products Setup  ', 'cyan');
  log('============================================', 'cyan');
  log('');

  if (isDryRun) {
    log('DRY RUN MODE: No changes will be made', 'yellow');
    log('');
  }

  if (isLiveMode) {
    log('MODE: LIVE (Production)', 'red');
    log('WARNING: This will create real products!', 'red');
  } else {
    log('MODE: TEST', 'yellow');
    log('Use --live flag for production', 'gray');
  }
  log('');

  // Create products
  log('Creating Products...', 'cyan');
  log('');

  for (let i = 0; i < PLANS.length; i++) {
    const plan = PLANS[i];
    log(`${i + 1}. Creating ${plan.name} product...`, 'white');

    if (isDryRun) {
      results.products[plan.id] = `prod_dry_run_${plan.id}`;
      log(`  Product ID: ${results.products[plan.id]}`, 'green');
    } else {
      try {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: plan.metadata,
          features: plan.features.map(f => ({ name: f }))
        });
        results.products[plan.id] = product.id;
        log(`  Product ID: ${product.id}`, 'green');
      } catch (error) {
        log(`  ERROR: ${error.message}`, 'red');
        throw error;
      }
    }

    await sleep(100); // Rate limiting
  }

  log('');

  // Create prices
  log('Creating Prices...', 'cyan');
  log('');

  for (let i = 0; i < PLANS.length; i++) {
    const plan = PLANS[i];
    const priceKey = `${plan.id}_monthly`;
    log(`${i + 1}. Creating ${plan.name} monthly price ($${plan.price / 100}/month)...`, 'white');

    if (isDryRun) {
      results.prices[priceKey] = `price_dry_run_${plan.id}`;
      log(`  Price ID: ${results.prices[priceKey]}`, 'green');
    } else {
      try {
        const price = await stripe.prices.create({
          product: results.products[plan.id],
          unit_amount: plan.price,
          currency: 'usd',
          recurring: { interval: plan.interval },
          metadata: { plan: priceKey }
        });
        results.prices[priceKey] = price.id;
        log(`  Price ID: ${price.id}`, 'green');
      } catch (error) {
        log(`  ERROR: ${error.message}`, 'red');
        throw error;
      }
    }

    await sleep(100);
  }

  log('');

  // Create payment links
  log('Creating Payment Links...', 'cyan');
  log('');

  for (let i = 0; i < PLANS.length; i++) {
    const plan = PLANS[i];
    const priceKey = `${plan.id}_monthly`;
    log(`${i + 1}. Creating ${plan.name} payment link...`, 'white');

    if (isDryRun) {
      results.paymentLinks[plan.id] = `plink_dry_run_${plan.id}`;
      results.paymentLinkUrls[plan.id] = `https://buy.stripe.com/test/${plan.id}`;
      log(`  Payment Link ID: ${results.paymentLinks[plan.id]}`, 'green');
    } else {
      try {
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price: results.prices[priceKey],
              quantity: 1
            }
          ],
          after_completion: {
            type: 'redirect',
            redirect: {
              url: SUCCESS_URL
            }
          },
          metadata: {
            plan: plan.id,
            tier: plan.metadata.tier
          }
        });
        results.paymentLinks[plan.id] = paymentLink.id;
        results.paymentLinkUrls[plan.id] = paymentLink.url;
        log(`  Payment Link ID: ${paymentLink.id}`, 'green');
        log(`  URL: ${paymentLink.url}`, 'gray');
      } catch (error) {
        log(`  ERROR: ${error.message}`, 'red');
        throw error;
      }
    }

    await sleep(100);
  }

  log('');

  // Summary
  log('============================================', 'cyan');
  log('           SETUP COMPLETE!                 ', 'green');
  log('============================================', 'cyan');
  log('');

  log('PRODUCT IDs:', 'yellow');
  Object.entries(results.products).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  log('');

  log('PRICE IDs:', 'yellow');
  Object.entries(results.prices).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  log('');

  log('PAYMENT LINK IDs:', 'yellow');
  Object.entries(results.paymentLinks).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  log('');

  log('PAYMENT LINK URLs:', 'yellow');
  Object.entries(results.paymentLinkUrls).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  log('');

  // Generate environment variables
  log('============================================', 'cyan');
  log('  Environment Variables for Application    ', 'cyan');
  log('============================================', 'cyan');
  log('');
  log('Add these to your environment configuration:', 'yellow');
  log('');

  console.log('# Stripe Product IDs');
  console.log(`VITE_STRIPE_PRODUCT_STUDIO=${results.products.studio}`);
  console.log(`VITE_STRIPE_PRODUCT_PROFESSIONAL=${results.products.professional}`);
  console.log(`VITE_STRIPE_PRODUCT_ENTERPRISE=${results.products.enterprise}`);
  console.log('');
  console.log('# Stripe Price IDs');
  console.log(`VITE_STRIPE_PRICE_STUDIO_MONTHLY=${results.prices.studio_monthly}`);
  console.log(`VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY=${results.prices.professional_monthly}`);
  console.log(`VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=${results.prices.enterprise_monthly}`);
  console.log('');
  console.log('# Stripe Payment Link IDs');
  console.log(`VITE_STRIPE_LINK_STUDIO=${results.paymentLinks.studio}`);
  console.log(`VITE_STRIPE_LINK_PROFESSIONAL=${results.paymentLinks.professional}`);
  console.log(`VITE_STRIPE_LINK_ENTERPRISE=${results.paymentLinks.enterprise}`);
  console.log('');
  console.log('# Stripe Payment Link URLs');
  console.log(`VITE_STRIPE_URL_STUDIO=${results.paymentLinkUrls.studio}`);
  console.log(`VITE_STRIPE_URL_PROFESSIONAL=${results.paymentLinkUrls.professional}`);
  console.log(`VITE_STRIPE_URL_ENTERPRISE=${results.paymentLinkUrls.enterprise}`);
  log('');

  // Save configuration to file
  const outputFile = path.join(__dirname, 'stripe-config-output.json');
  const config = {
    created_at: new Date().toISOString(),
    mode: isLiveMode ? 'live' : 'test',
    dry_run: isDryRun,
    products: results.products,
    prices: results.prices,
    payment_links: results.paymentLinks,
    payment_link_urls: results.paymentLinkUrls
  };

  fs.writeFileSync(outputFile, JSON.stringify(config, null, 2));
  log(`Configuration saved to: ${outputFile}`, 'green');
  log('');

  // Generate TypeScript config file
  const tsConfigPath = path.join(__dirname, '..', 'src', 'config', 'stripe.config.ts');
  const tsConfig = `/**
 * Stripe Configuration
 * Auto-generated by setup-stripe-products.mjs
 * Generated: ${new Date().toISOString()}
 * Mode: ${isLiveMode ? 'live' : 'test'}
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
}

export const STRIPE_PLANS: Record<string, StripePlan> = {
  studio: {
    id: 'studio',
    name: 'Rep Club Studio',
    productId: '${results.products.studio}',
    priceId: '${results.prices.studio_monthly}',
    paymentLinkId: '${results.paymentLinks.studio}',
    paymentLinkUrl: '${results.paymentLinkUrls.studio}',
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
    productId: '${results.products.professional}',
    priceId: '${results.prices.professional_monthly}',
    paymentLinkId: '${results.paymentLinks.professional}',
    paymentLinkUrl: '${results.paymentLinkUrls.professional}',
    price: 349,
    interval: 'month',
    memberLimit: '2000',
    teamLimit: '15',
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
    productId: '${results.products.enterprise}',
    priceId: '${results.prices.enterprise_monthly}',
    paymentLinkId: '${results.paymentLinks.enterprise}',
    paymentLinkUrl: '${results.paymentLinkUrls.enterprise}',
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

export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  plans: STRIPE_PLANS,
  successUrl: '${SUCCESS_URL}',
  cancelUrl: '${CANCEL_URL}'
};

export default STRIPE_CONFIG;
`;

  // Ensure config directory exists
  const configDir = path.dirname(tsConfigPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(tsConfigPath, tsConfig);
  log(`TypeScript config saved to: ${tsConfigPath}`, 'green');
  log('');

  log('Done!', 'green');
}

// Run the setup
setupStripeProducts().catch(error => {
  log(`\nFATAL ERROR: ${error.message}`, 'red');
  process.exit(1);
});
