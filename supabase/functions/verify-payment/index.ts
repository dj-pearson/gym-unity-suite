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
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
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

    // Create Supabase client using anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // SECURITY: Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    // Create service role client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("session_id is required");
    }

    // Validate session_id format to prevent injection
    if (typeof session_id !== 'string' || session_id.length > 100 || !/^cs_[a-zA-Z0-9_]+$/.test(session_id)) {
      throw new Error("Invalid session_id format");
    }

    logStep("Verifying session", { sessionId: session_id.substring(0, 20) + '...' });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Retrieved session", { status: session.payment_status, mode: session.mode });

    // SECURITY: Verify the session belongs to this user
    const sessionUserId = session.metadata?.user_id;
    if (sessionUserId && sessionUserId !== user.id) {
      throw new Error("Session does not belong to authenticated user");
    }

    // Get user's profile and organization
    const { data: profile } = await supabaseService
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error("User organization not found");
    }

    if (session.mode === "payment") {
      // Handle one-time payment
      const paymentStatus = session.payment_status === "paid" ? "paid" : "failed";

      // Update order status - SECURITY: Filter by user_id and organization_id
      const { error: updateError } = await supabaseService
        .from("orders")
        .update({
          status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq("stripe_session_id", session_id)
        .eq("user_id", user.id)
        .eq("organization_id", profile.organization_id);

      if (updateError) {
        logStep("Error updating order", { error: updateError.message });
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      logStep("Updated order status", { status: paymentStatus });

      return new Response(JSON.stringify({
        payment_verified: paymentStatus === "paid",
        status: paymentStatus,
        order_type: "one_time"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (session.mode === "subscription") {
      // Handle subscription payment
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const isActive = subscription.status === "active";

      // Get membership plan info
      const membershipPlanId = session.metadata?.membership_plan_id;
      const subscriptionTier = session.metadata?.plan_name || "Premium";

      // Update subscriber record - use user_id for conflict resolution
      const { error: upsertError } = await supabaseService
        .from("subscribers")
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: session.customer as string,
          subscribed: isActive,
          subscription_tier: subscriptionTier,
          subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
          membership_plan_id: membershipPlanId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        logStep("Error updating subscriber", { error: upsertError.message });
        throw new Error(`Failed to update subscriber: ${upsertError.message}`);
      }

      logStep("Updated subscriber status", { subscribed: isActive, subscriptionTier });

      // Create or update membership record
      if (membershipPlanId && isActive) {
        const { error: membershipError } = await supabaseService
          .from("memberships")
          .upsert({
            member_id: user.id,
            organization_id: profile.organization_id,
            plan_id: membershipPlanId,
            start_date: new Date().toISOString(),
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            status: 'active',
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'member_id,plan_id' });

        if (membershipError) {
          logStep("Error creating membership", { error: membershipError.message });
          // Don't throw - subscription is still valid
        } else {
          logStep("Membership created/updated successfully");
        }
      }

      return new Response(JSON.stringify({
        subscribed: isActive,
        subscription_tier: subscriptionTier,
        subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
        membership_plan_id: membershipPlanId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Unknown session mode");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
