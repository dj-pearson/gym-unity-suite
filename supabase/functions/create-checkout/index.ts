import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
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
    logStep("User authenticated", { userId: user.id, email: user.email });

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
      success_url: `${req.headers.get("origin")}/membership-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/membership-plans`,
      metadata: {
        user_id: user.id,
        membership_plan_id: membership_plan_id,
        plan_name: membershipPlan.name
      }
    });

    logStep("Created checkout session", { sessionId: session.id, url: session.url });

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