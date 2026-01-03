import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  getCorsHeaders,
  handleCorsPreFlight,
  corsJsonResponse,
  corsErrorResponse,
} from "../_shared/cors.ts";

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RATE-LIMIT] ${step}${detailsStr}`);
};

// Rate limit configurations
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  auth: { maxRequests: 5, windowMs: 60 * 1000 },
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  api: { maxRequests: 100, windowMs: 60 * 1000 },
  bulk: { maxRequests: 10, windowMs: 60 * 1000 },
  export: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
  email: { maxRequests: 10, windowMs: 60 * 1000 },
  password_reset: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
};

serve(async (req) => {
  const origin = req.headers.get("origin");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(origin);
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { action, endpoint, identifier, limitType = 'api' } = await req.json();

    if (!action || !endpoint) {
      return corsErrorResponse("Missing required parameters: action, endpoint", origin, 400);
    }

    const config = RATE_LIMITS[limitType] || RATE_LIMITS.api;
    const rateLimitKey = `rate_limit:${limitType}:${identifier || 'anonymous'}:${endpoint}`;
    const now = Date.now();

    logStep("Processing rate limit request", { action, endpoint, limitType, identifier });

    // Actions: check, increment, reset, status
    if (action === 'check' || action === 'increment') {
      // Get current rate limit entry
      const { data: existingEntry, error: fetchError } = await supabaseClient
        .from('rate_limits')
        .select('*')
        .eq('key', rateLimitKey)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const windowStart = now - config.windowMs;

      // If entry doesn't exist or window has expired, create/reset
      if (!existingEntry || new Date(existingEntry.window_start).getTime() < windowStart) {
        if (action === 'increment') {
          // Create new entry
          const { error: upsertError } = await supabaseClient
            .from('rate_limits')
            .upsert({
              key: rateLimitKey,
              count: 1,
              window_start: new Date(now).toISOString(),
              limit_type: limitType,
              identifier: identifier || 'anonymous',
              endpoint: endpoint,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

          if (upsertError) throw upsertError;

          logStep("Created new rate limit entry");
          return corsJsonResponse({
            allowed: true,
            remaining: config.maxRequests - 1,
            resetAt: now + config.windowMs,
          }, origin);
        } else {
          // Just checking, return full quota
          return corsJsonResponse({
            allowed: true,
            remaining: config.maxRequests,
            resetAt: now + config.windowMs,
          }, origin);
        }
      }

      // Entry exists and is within window
      const currentCount = existingEntry.count;
      const resetAt = new Date(existingEntry.window_start).getTime() + config.windowMs;

      if (currentCount >= config.maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        logStep("Rate limit exceeded", { currentCount, maxRequests: config.maxRequests });

        const corsHeaders = getCorsHeaders(origin);
        return new Response(JSON.stringify({
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter,
          error: 'Rate limit exceeded',
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetAt),
            "Retry-After": String(retryAfter),
          },
        });
      }

      if (action === 'increment') {
        // Increment counter
        const { error: updateError } = await supabaseClient
          .from('rate_limits')
          .update({
            count: currentCount + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('key', rateLimitKey);

        if (updateError) throw updateError;

        logStep("Incremented rate limit counter", { newCount: currentCount + 1 });

        const corsHeaders = getCorsHeaders(origin);
        return new Response(JSON.stringify({
          allowed: true,
          remaining: config.maxRequests - (currentCount + 1),
          resetAt,
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": String(config.maxRequests - (currentCount + 1)),
            "X-RateLimit-Reset": String(resetAt),
          },
        });
      } else {
        // Just checking status
        const corsHeaders = getCorsHeaders(origin);
        return new Response(JSON.stringify({
          allowed: true,
          remaining: config.maxRequests - currentCount,
          resetAt,
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": String(config.maxRequests - currentCount),
            "X-RateLimit-Reset": String(resetAt),
          },
        });
      }
    } else if (action === 'reset') {
      // Reset rate limit for identifier
      const { error: deleteError } = await supabaseClient
        .from('rate_limits')
        .delete()
        .eq('key', rateLimitKey);

      if (deleteError) throw deleteError;

      logStep("Reset rate limit", { rateLimitKey });
      return corsJsonResponse({
        success: true,
        message: 'Rate limit reset successfully',
      }, origin);
    } else if (action === 'status') {
      // Get current status without incrementing
      const { data: entry } = await supabaseClient
        .from('rate_limits')
        .select('*')
        .eq('key', rateLimitKey)
        .single();

      const windowStart = now - config.windowMs;

      if (!entry || new Date(entry.window_start).getTime() < windowStart) {
        return corsJsonResponse({
          allowed: true,
          remaining: config.maxRequests,
          resetAt: now + config.windowMs,
          count: 0,
        }, origin);
      }

      const resetAt = new Date(entry.window_start).getTime() + config.windowMs;
      return corsJsonResponse({
        allowed: entry.count < config.maxRequests,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetAt,
        count: entry.count,
      }, origin);
    }

    return corsErrorResponse(`Invalid action: ${action}`, origin, 400);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in rate-limit", { message: errorMessage });
    return corsErrorResponse(errorMessage, origin, 500);
  }
});
