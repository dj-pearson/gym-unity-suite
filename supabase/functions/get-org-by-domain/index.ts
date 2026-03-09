import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-ORG-BY-DOMAIN] ${step}${detailsStr}`);
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

    // Get domain from query parameter or body
    const url = new URL(req.url);
    let domain = url.searchParams.get("domain");

    if (!domain && req.method === "POST") {
      const body = await req.json();
      domain = body.domain;
    }

    if (!domain) {
      throw new Error("Domain parameter is required");
    }

    logStep("Looking up organization", { domain });

    // First, try organization-level custom domain
    let organization = null;
    const { data: orgData, error: orgError } = await supabaseClient
      .from("organizations")
      .select("id, name, slug, logo_url, primary_color, secondary_color, custom_domain, custom_domain_verified")
      .eq("custom_domain", domain)
      .eq("custom_domain_verified", true)
      .maybeSingle();

    if (orgError) {
      logStep("Database error on organizations", { error: orgError });
    }

    if (orgData) {
      organization = orgData;
    }

    // If not found in organizations, check portal_configurations for portal custom domains
    if (!organization) {
      const { data: portalConfig, error: portalError } = await supabaseClient
        .from("portal_configurations")
        .select("organization_id")
        .eq("portal_custom_domain", domain)
        .eq("portal_domain_verified", true)
        .maybeSingle();

      if (portalError) {
        logStep("Database error on portal_configurations", { error: portalError });
      }

      if (portalConfig) {
        const { data: portalOrg } = await supabaseClient
          .from("organizations")
          .select("id, name, slug, logo_url, primary_color, secondary_color, custom_domain, custom_domain_verified")
          .eq("id", portalConfig.organization_id)
          .single();

        if (portalOrg) {
          organization = portalOrg;
          logStep("Organization found via portal_configurations");
        }
      }
    }

    if (!organization) {
      logStep("No organization found", { domain });
      return new Response(
        JSON.stringify({
          success: false,
          message: "No verified organization found for this domain",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Also fetch portal theme if available
    const { data: portalTheme } = await supabaseClient
      .from("portal_themes")
      .select("*")
      .eq("organization_id", organization.id)
      .maybeSingle();

    logStep("Organization found", {
      orgId: organization.id,
      orgName: organization.name,
      hasTheme: !!portalTheme,
    });

    return new Response(
      JSON.stringify({
        success: true,
        organization,
        theme: portalTheme || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-org-by-domain", { message: errorMessage });
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
