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
];

// Get CORS headers based on origin
const getCorsHeaders = (origin?: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || allowed.includes('*') && new RegExp(allowed.replace(/\*/g, '.*')).test(origin)
  ) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
};

// Helper logging function for debugging
const logStep = (step: string, details?: Record<string, unknown>) => {
  const sanitizedDetails = details ? sanitizeLogData(details) : undefined;
  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Sanitize sensitive data from logs
const sanitizeLogData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveKeys = ['email', 'card', 'payment_method', 'customer_email'];
  const sanitized = { ...data };

  for (const key of sensitiveKeys) {
    if (key in sanitized && typeof sanitized[key] === 'string') {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests for webhooks
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Webhook verified", { eventType: event.type, eventId: event.id });

    // Create Supabase client with service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseService, stripe, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseService, stripe, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabaseService, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(supabaseService, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabaseService, invoice);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(supabaseService, paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(supabaseService, paymentIntent);
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/**
 * Handle checkout.session.completed event
 * This is fired when a customer completes the checkout process
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  logStep("Processing checkout.session.completed", {
    sessionId: session.id,
    mode: session.mode
  });

  const userId = session.metadata?.user_id;
  const membershipPlanId = session.metadata?.membership_plan_id;
  const customerId = session.customer as string;

  if (session.mode === "subscription" && session.subscription) {
    // Handle subscription checkout
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    if (!userId) {
      logStep("Warning: No user_id in session metadata");
      return;
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!profile?.organization_id) {
      logStep("Warning: Could not find user organization", { userId });
      return;
    }

    // Update or create subscriber record
    const { error: subscriberError } = await supabase
      .from("subscribers")
      .upsert({
        user_id: userId,
        email: session.customer_details?.email,
        stripe_customer_id: customerId,
        subscribed: subscription.status === "active",
        subscription_tier: session.metadata?.plan_name || "Premium",
        subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
        membership_plan_id: membershipPlanId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (subscriberError) {
      logStep("Error updating subscriber", { error: subscriberError.message });
    }

    // Create membership record if membership_plan_id exists
    if (membershipPlanId && subscription.status === "active") {
      const { error: membershipError } = await supabase
        .from("memberships")
        .upsert({
          member_id: userId,
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
      } else {
        logStep("Membership created/updated successfully");
      }
    }

    logStep("Subscription checkout processed successfully");

  } else if (session.mode === "payment") {
    // Handle one-time payment checkout
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: session.payment_status === "paid" ? "paid" : "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", session.id);

    if (updateError) {
      logStep("Error updating order", { error: updateError.message });
    } else {
      logStep("One-time payment order updated successfully");
    }
  }
}

/**
 * Handle subscription update events
 */
async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Processing subscription update", {
    subscriptionId: subscription.id,
    status: subscription.status
  });

  const customerId = subscription.customer as string;

  // Get customer email from Stripe
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    logStep("Customer has been deleted");
    return;
  }

  const email = customer.email;
  if (!email) {
    logStep("No email found for customer");
    return;
  }

  // Determine subscription tier from price
  const priceId = subscription.items.data[0]?.price?.id;
  let subscriptionTier = "Premium";

  if (priceId) {
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;

    if (amount <= 2999) {
      subscriptionTier = "Basic";
    } else if (amount <= 4999) {
      subscriptionTier = "Premium";
    } else {
      subscriptionTier = "VIP";
    }
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";

  // Update subscriber record
  const { error } = await supabase
    .from("subscribers")
    .upsert({
      email: email,
      stripe_customer_id: customerId,
      subscribed: isActive,
      subscription_tier: isActive ? subscriptionTier : null,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

  if (error) {
    logStep("Error updating subscriber", { error: error.message });
  } else {
    logStep("Subscriber updated successfully", { subscribed: isActive, tier: subscriptionTier });
  }

  // Update membership status
  const { error: membershipError } = await supabase
    .from("memberships")
    .update({
      status: isActive ? 'active' : 'suspended',
      end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (membershipError) {
    logStep("Error updating membership status", { error: membershipError.message });
  }
}

/**
 * Handle subscription canceled event
 */
async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  logStep("Processing subscription cancellation", { subscriptionId: subscription.id });

  const customerId = subscription.customer as string;

  // Update subscriber record
  const { error: subscriberError } = await supabase
    .from("subscribers")
    .update({
      subscribed: false,
      subscription_tier: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (subscriberError) {
    logStep("Error updating subscriber on cancellation", { error: subscriberError.message });
  }

  // Update membership status
  const { error: membershipError } = await supabase
    .from("memberships")
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (membershipError) {
    logStep("Error canceling membership", { error: membershipError.message });
  } else {
    logStep("Subscription and membership canceled successfully");
  }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaymentSucceeded(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  logStep("Processing invoice payment succeeded", { invoiceId: invoice.id });

  if (!invoice.subscription) {
    logStep("Invoice not related to subscription, skipping");
    return;
  }

  const customerId = invoice.customer as string;

  // Extend subscription end date
  const { error } = await supabase
    .from("subscribers")
    .update({
      subscribed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    logStep("Error updating subscriber on renewal", { error: error.message });
  } else {
    logStep("Subscription renewal processed successfully");
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  logStep("Processing invoice payment failed", { invoiceId: invoice.id });

  if (!invoice.subscription) {
    return;
  }

  const customerId = invoice.customer as string;

  // Mark subscription as past due but don't cancel yet
  // Stripe will retry the payment according to your settings
  const { error } = await supabase
    .from("subscribers")
    .update({
      updated_at: new Date().toISOString(),
      // Could add a payment_failed_at field here
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    logStep("Error updating subscriber on payment failure", { error: error.message });
  } else {
    logStep("Payment failure recorded");
  }

  // TODO: Send notification to user about failed payment
}

/**
 * Handle successful payment intent (one-time payments)
 */
async function handlePaymentIntentSucceeded(
  supabase: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  logStep("Processing payment intent succeeded", { paymentIntentId: paymentIntent.id });

  // Update any orders with this payment intent
  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    logStep("Error updating order on payment success", { error: error.message });
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
  supabase: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  logStep("Processing payment intent failed", { paymentIntentId: paymentIntent.id });

  // Update any orders with this payment intent
  const { error } = await supabase
    .from("orders")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    logStep("Error updating order on payment failure", { error: error.message });
  }
}
