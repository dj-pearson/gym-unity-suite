import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://gym-unity-suite.com',
  'https://www.gym-unity-suite.com',
  'https://gym-unity-suite.pages.dev',
  'https://api.repclub.net',
  'https://functions.repclub.net',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
];

// Get CORS headers based on origin
const getCorsHeaders = (origin?: string | null) => {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => origin === allowed);
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
};

// Sanitize sensitive data from logs
const sanitizeForLog = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized = { ...data };
  const sensitiveKeys = ['email', 'customer_email', 'card'];
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
};

// Helper logging function for debugging (with sanitization)
const logStep = (step: string, details?: Record<string, unknown>) => {
  const sanitizedDetails = details ? sanitizeForLog(details) : undefined;
  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    // Get user's profile to determine their organization
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      throw new Error("User organization not found. Please contact support.");
    }

    const organizationId = userProfile.organization_id;
    logStep("User organization found", { organizationId });

    // Parse request body
    const { membership_plan_id } = await req.json();
    if (!membership_plan_id) {
      throw new Error("membership_plan_id is required");
    }

    // Security: Validate membership_plan_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(membership_plan_id)) {
      throw new Error("Invalid membership plan ID format");
    }

    // Get membership plan details - SECURITY: Filter by organization_id to prevent cross-tenant access
    const { data: membershipPlan, error: planError } = await supabaseClient
      .from('membership_plans')
      .select('*')
      .eq('id', membership_plan_id)
      .eq('organization_id', organizationId)
      .single();

    if (planError || !membershipPlan) {
      throw new Error("Membership plan not found");
    }

    // Validate price is positive and reasonable
    if (typeof membershipPlan.price !== 'number' || membershipPlan.price <= 0 || membershipPlan.price > 100000) {
      throw new Error("Invalid membership plan price");
    }

    logStep("Found membership plan", { planId: membership_plan_id, planName: membershipPlan.name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("Creating new customer");
    }

    // Convert billing interval for Stripe
    let interval: 'month' | 'year' = 'month';
    if (membershipPlan.billing_interval === 'yearly') {
      interval = 'year';
    }

    // Validate origin for success/cancel URLs
    const requestOrigin = req.headers.get("origin");
    const safeOrigin = ALLOWED_ORIGINS.includes(requestOrigin || '') ? requestOrigin : ALLOWED_ORIGINS[0];

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${membershipPlan.name} Membership`,
              description: membershipPlan.description || `${membershipPlan.name} gym membership plan`
            },
            unit_amount: Math.round(membershipPlan.price * 100), // Convert to cents
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${safeOrigin}/membership-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeOrigin}/membership-plans`,
      metadata: {
        user_id: user.id,
        organization_id: organizationId,
        membership_plan_id: membership_plan_id,
        plan_name: membershipPlan.name
      }
    });

    logStep("Created checkout session", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
