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
  console.log(`[CREATE-ONE-TIME-PAYMENT] ${step}${detailsStr}`);
};

// Constants for validation
const MIN_AMOUNT = 0.50; // Stripe minimum is $0.50
const MAX_AMOUNT = 99999.99; // Reasonable maximum
const MAX_DESCRIPTION_LENGTH = 500;

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

    // Parse request body
    const { amount, description, order_type = "one_time", metadata = {} } = await req.json();

    // Validate amount - must be a number within reasonable bounds
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error("Amount must be a valid number");
    }
    if (amount < MIN_AMOUNT) {
      throw new Error(`Amount must be at least $${MIN_AMOUNT}`);
    }
    if (amount > MAX_AMOUNT) {
      throw new Error(`Amount cannot exceed $${MAX_AMOUNT}`);
    }

    // Validate description
    if (!description || typeof description !== 'string') {
      throw new Error("Description is required");
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    // Sanitize description to prevent XSS in Stripe dashboard
    const sanitizedDescription = description.replace(/<[^>]*>/g, '').trim();

    // Validate order_type
    const allowedOrderTypes = ['one_time', 'retail', 'service', 'deposit', 'fee'];
    if (!allowedOrderTypes.includes(order_type)) {
      throw new Error("Invalid order type");
    }

    // Validate metadata (if provided) - only allow primitive values
    if (metadata && typeof metadata === 'object') {
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
          throw new Error("Metadata values must be strings, numbers, or booleans");
        }
        if (typeof key !== 'string' || key.length > 40) {
          throw new Error("Metadata keys must be strings with max 40 characters");
        }
      }
    }

    // Get user's organization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error("User organization not found");
    }

    logStep("Found user organization", { organizationId: profile.organization_id });

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

    // Validate origin for success/cancel URLs
    const requestOrigin = req.headers.get("origin");
    const safeOrigin = ALLOWED_ORIGINS.includes(requestOrigin || '') ? requestOrigin : ALLOWED_ORIGINS[0];

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: sanitizedDescription,
              description: `One-time payment - ${sanitizedDescription}`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${safeOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeOrigin}/payment-cancelled`,
      metadata: {
        user_id: user.id,
        organization_id: profile.organization_id,
        order_type: order_type,
        ...metadata
      }
    });

    logStep("Created checkout session", { sessionId: session.id });

    // Create order record in Supabase using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("orders").insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      stripe_session_id: session.id,
      amount: Math.round(amount * 100),
      status: "pending",
      order_type: order_type,
      description: sanitizedDescription,
      metadata: metadata,
      created_at: new Date().toISOString()
    });

    logStep("Created order record");

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-one-time-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
