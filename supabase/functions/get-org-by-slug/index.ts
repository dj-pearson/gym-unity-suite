import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-ORG-BY-SLUG] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get slug from query parameter or body
    const url = new URL(req.url);
    let slug = url.searchParams.get("slug");

    if (!slug && req.method === "POST") {
      const body = await req.json();
      slug = body.slug;
    }

    if (!slug) {
      throw new Error("Slug parameter is required");
    }

    // Normalize slug to lowercase
    slug = slug.toLowerCase().trim();

    logStep("Looking up organization", { slug });

    // First check if this slug has a portal enabled
    const { data: portalConfig, error: configError } = await supabaseClient
      .from("portal_configurations")
      .select("organization_id, portal_enabled, portal_tier, portal_subdomain")
      .eq("portal_subdomain", slug)
      .eq("portal_enabled", true)
      .maybeSingle();

    if (configError) {
      logStep("Database error checking portal config", { error: configError });
      throw new Error("Failed to query portal configuration");
    }

    // If no portal config found, try organization slug directly
    let orgId: string | null = portalConfig?.organization_id ?? null;

    if (!orgId) {
      // Fallback: look up directly by organization slug
      const { data: org, error: orgErr } = await supabaseClient
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (orgErr) {
        logStep("Database error looking up org by slug", { error: orgErr });
        throw new Error("Failed to query organization");
      }

      orgId = org?.id ?? null;
    }

    if (!orgId) {
      logStep("No organization found", { slug });
      return new Response(
        JSON.stringify({
          success: false,
          message: "No organization found for this subdomain",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Fetch full organization data
    const { data: organization, error: orgError } = await supabaseClient
      .from("organizations")
      .select("id, name, slug, logo_url, primary_color, secondary_color, custom_domain, custom_domain_verified")
      .eq("id", orgId)
      .single();

    if (orgError || !organization) {
      logStep("Failed to fetch organization", { error: orgError });
      throw new Error("Failed to fetch organization details");
    }

    // Fetch portal theme if it exists
    const { data: theme } = await supabaseClient
      .from("portal_themes")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    logStep("Organization found", {
      orgId: organization.id,
      orgName: organization.name,
      hasTheme: !!theme,
      portalTier: portalConfig?.portal_tier || 'starter',
    });

    return new Response(
      JSON.stringify({
        success: true,
        organization,
        theme,
        portalTier: portalConfig?.portal_tier || 'starter',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-org-by-slug", { message: errorMessage });
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
