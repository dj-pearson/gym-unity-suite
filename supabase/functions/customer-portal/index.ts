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
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

    // Initialize Supabase client with anon key for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user. Please subscribe first.");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Validate origin for return URL
    const requestOrigin = req.headers.get("origin");
    const safeOrigin = ALLOWED_ORIGINS.includes(requestOrigin || '') ? requestOrigin : ALLOWED_ORIGINS[0];

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${safeOrigin}/membership-plans`,
    });
    logStep("Customer portal session created", { sessionId: portalSession.id });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
