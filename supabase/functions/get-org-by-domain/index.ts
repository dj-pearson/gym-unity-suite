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

    // Query organization by custom domain
    const { data: organization, error: orgError } = await supabaseClient
      .from("organizations")
      .select("id, name, slug, logo_url, primary_color, secondary_color, custom_domain, custom_domain_verified")
      .eq("custom_domain", domain)
      .eq("custom_domain_verified", true)
      .maybeSingle();

    if (orgError) {
      logStep("Database error", { error: orgError });
      throw new Error("Failed to query organization");
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

    logStep("Organization found", {
      orgId: organization.id,
      orgName: organization.name,
    });

    return new Response(
      JSON.stringify({
        success: true,
        organization,
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
