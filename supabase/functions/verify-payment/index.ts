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
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create Supabase client using service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("session_id is required");
    }

    logStep("Verifying session", { sessionId: session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Retrieved session", { status: session.payment_status, mode: session.mode });

    if (session.mode === "payment") {
      // Handle one-time payment
      const paymentStatus = session.payment_status === "paid" ? "paid" : "failed";
      
      // Update order status
      const { error: updateError } = await supabaseService
        .from("orders")
        .update({ status: paymentStatus })
        .eq("stripe_session_id", session_id);

      if (updateError) {
        logStep("Error updating order", { error: updateError });
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
      
      // Get user info from session metadata
      const userId = session.metadata?.user_id;
      if (!userId) {
        throw new Error("User ID not found in session metadata");
      }

      // Get membership plan info
      const membershipPlanId = session.metadata?.membership_plan_id;
      let subscriptionTier = session.metadata?.plan_name || "Premium";

      // Update subscriber record
      const { error: upsertError } = await supabaseService
        .from("subscribers")
        .upsert({
          user_id: userId,
          email: session.customer_details?.email || session.metadata?.email,
          stripe_customer_id: session.customer as string,
          subscribed: isActive,
          subscription_tier: subscriptionTier,
          subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
          membership_plan_id: membershipPlanId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (upsertError) {
        logStep("Error updating subscriber", { error: upsertError });
        throw new Error(`Failed to update subscriber: ${upsertError.message}`);
      }

      logStep("Updated subscriber status", { subscribed: isActive, subscriptionTier });

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