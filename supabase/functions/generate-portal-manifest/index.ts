import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-PORTAL-MANIFEST] ${step}${detailsStr}`);
};

/**
 * Generates a dynamic PWA manifest.json for a white-label portal.
 * Each gym's portal gets its own manifest with custom name, colors, and icons.
 *
 * Query params:
 *   - slug: Organization slug (for subdomain portals)
 *   - domain: Custom domain (for enterprise portals)
 */
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
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const domain = url.searchParams.get("domain");

    if (!slug && !domain) {
      throw new Error("Either 'slug' or 'domain' parameter is required");
    }

    logStep("Generating manifest", { slug, domain });

    let organizationId: string | null = null;

    // Resolve organization ID from slug or domain
    if (slug) {
      const { data: portalConfig } = await supabaseClient
        .from("portal_configurations")
        .select("organization_id")
        .eq("portal_subdomain", slug)
        .eq("portal_enabled", true)
        .maybeSingle();

      if (portalConfig) {
        organizationId = portalConfig.organization_id;
      } else {
        const { data: org } = await supabaseClient
          .from("organizations")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        organizationId = org?.id || null;
      }
    } else if (domain) {
      const { data: portalConfig } = await supabaseClient
        .from("portal_configurations")
        .select("organization_id")
        .eq("portal_custom_domain", domain)
        .eq("portal_domain_verified", true)
        .maybeSingle();

      if (portalConfig) {
        organizationId = portalConfig.organization_id;
      } else {
        const { data: org } = await supabaseClient
          .from("organizations")
          .select("id")
          .eq("custom_domain", domain)
          .eq("custom_domain_verified", true)
          .maybeSingle();
        organizationId = org?.id || null;
      }
    }

    if (!organizationId) {
      throw new Error("Organization not found");
    }

    // Fetch organization and theme data
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("name, slug, logo_url, primary_color")
      .eq("id", organizationId)
      .single();

    const { data: theme } = await supabaseClient
      .from("portal_themes")
      .select("pwa_name, pwa_short_name, pwa_theme_color, pwa_background_color, logo_icon_url, color_primary, color_background")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!org) {
      throw new Error("Organization data not found");
    }

    // Build the PWA manifest
    const appName = theme?.pwa_name || org.name;
    const shortName = theme?.pwa_short_name || org.name?.substring(0, 12);
    const themeColor = theme?.pwa_theme_color || `hsl(${theme?.color_primary || org.primary_color || '221 83% 53%'})`;
    const backgroundColor = theme?.pwa_background_color || `hsl(${theme?.color_background || '0 0% 100%'})`;
    const iconUrl = theme?.logo_icon_url || org.logo_url;

    const startUrl = slug
      ? `https://${slug}.repclub.app/portal/dashboard`
      : `https://${domain}/portal/dashboard`;

    const scope = slug
      ? `https://${slug}.repclub.app/`
      : `https://${domain}/`;

    const manifest = {
      name: appName,
      short_name: shortName,
      description: `${appName} Member Portal`,
      start_url: startUrl,
      scope: scope,
      display: "standalone",
      orientation: "portrait",
      theme_color: themeColor,
      background_color: backgroundColor,
      categories: ["fitness", "health", "lifestyle"],
      icons: iconUrl ? [
        {
          src: iconUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: iconUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ] : [
        {
          src: "/repclub-logo.png",
          sizes: "192x192",
          type: "image/png"
        }
      ],
      shortcuts: [
        {
          name: "Check In",
          short_name: "Check In",
          url: `${scope}portal/check-in`,
          icons: []
        },
        {
          name: "Classes",
          short_name: "Classes",
          url: `${scope}portal/classes`,
          icons: []
        }
      ]
    };

    logStep("Manifest generated", { name: appName, slug: org.slug });

    return new Response(JSON.stringify(manifest, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    // Return a basic fallback manifest on error
    const fallbackManifest = {
      name: "Member Portal",
      short_name: "Portal",
      display: "standalone",
      theme_color: "#3b82f6",
      background_color: "#ffffff",
    };

    return new Response(JSON.stringify(fallbackManifest), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/manifest+json",
      },
      status: 200,
    });
  }
});
