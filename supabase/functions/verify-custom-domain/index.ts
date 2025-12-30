import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Allowed origins for CORS - restrict to known trusted domains
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
  const sensitiveKeys = ['domain_verification_token', 'token', 'verificationToken'];
  for (const key of sensitiveKeys) {
    if (key in sanitized && typeof sanitized[key] === 'string') {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
};

// Helper logging function for enhanced debugging with sanitization
const logStep = (step: string, details?: Record<string, unknown>) => {
  const sanitizedDetails = details ? sanitizeForLog(details) : undefined;
  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : '';
  console.log(`[VERIFY-CUSTOM-DOMAIN] ${step}${detailsStr}`);
};

// Function to perform DNS lookups
async function verifyDNS(domain: string, verificationToken: string): Promise<{
  txtVerified: boolean;
  cnameVerified: boolean;
  txtRecords: string[];
  cnameRecords: string[];
}> {
  const txtVerified = false;
  const cnameVerified = false;
  const txtRecords: string[] = [];
  const cnameRecords: string[] = [];

  try {
    // Perform DNS TXT record lookup
    logStep("Looking up TXT records", { domain });

    // Use DNS over HTTPS (DoH) for TXT records
    const txtResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`,
      {
        headers: { accept: "application/dns-json" },
      }
    );

    if (txtResponse.ok) {
      const txtData = await txtResponse.json();
      if (txtData.Answer) {
        for (const record of txtData.Answer) {
          if (record.type === 16) { // TXT record
            const txtValue = record.data.replace(/"/g, "");
            txtRecords.push(txtValue);
            if (txtValue === verificationToken) {
              logStep("TXT verification successful");
              return { txtVerified: true, cnameVerified, txtRecords, cnameRecords };
            }
          }
        }
      }
    }

    // Perform DNS CNAME record lookup
    logStep("Looking up CNAME records", { domain });
    const cnameResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`,
      {
        headers: { accept: "application/dns-json" },
      }
    );

    if (cnameResponse.ok) {
      const cnameData = await cnameResponse.json();
      if (cnameData.Answer) {
        for (const record of cnameData.Answer) {
          if (record.type === 5) { // CNAME record
            const cnameValue = record.data.replace(/\.$/, ""); // Remove trailing dot
            cnameRecords.push(cnameValue);
            // Check if CNAME points to our service (customize this domain)
            if (cnameValue.includes("gym-unity") || cnameValue.includes(Deno.env.get("APP_DOMAIN") || "")) {
              logStep("CNAME verification successful", { cname: cnameValue });
              return { txtVerified, cnameVerified: true, txtRecords, cnameRecords };
            }
          }
        }
      }
    }

    // Also check A records as alternative to CNAME
    logStep("Looking up A records", { domain });
    const aResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
      {
        headers: { accept: "application/dns-json" },
      }
    );

    if (aResponse.ok) {
      const aData = await aResponse.json();
      if (aData.Answer) {
        const expectedIp = Deno.env.get("APP_IP_ADDRESS");
        for (const record of aData.Answer) {
          if (record.type === 1) { // A record
            cnameRecords.push(record.data);
            if (expectedIp && record.data === expectedIp) {
              logStep("A record verification successful", { ip: record.data });
              return { txtVerified, cnameVerified: true, txtRecords, cnameRecords };
            }
          }
        }
      }
    }

  } catch (error) {
    logStep("DNS lookup error", { error: error instanceof Error ? error.message : String(error) });
  }

  return { txtVerified, cnameVerified, txtRecords, cnameRecords };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get request body
    const { organizationId, domain } = await req.json();
    if (!organizationId || !domain) {
      throw new Error("organizationId and domain are required");
    }
    logStep("Request parameters", { organizationId, domain });

    // Verify user has permission to manage this organization
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.organization_id !== organizationId) {
      throw new Error("Unauthorized: User does not belong to this organization");
    }

    if (!["owner", "manager"].includes(profile.role)) {
      throw new Error("Unauthorized: Only owners and managers can verify custom domains");
    }
    logStep("Authorization verified", { role: profile.role });

    // Get organization and verification token
    const { data: organization, error: orgError } = await supabaseClient
      .from("organizations")
      .select("custom_domain, domain_verification_token, subscription_tier")
      .eq("id", organizationId)
      .single();

    if (orgError || !organization) {
      throw new Error("Organization not found");
    }

    if (organization.subscription_tier !== "enterprise") {
      throw new Error("Custom domains are only available for enterprise tier");
    }

    if (organization.custom_domain !== domain) {
      throw new Error("Domain does not match organization's custom domain");
    }

    if (!organization.domain_verification_token) {
      throw new Error("No verification token found. Please set a custom domain first.");
    }

    logStep("Organization data retrieved", {
      domain: organization.custom_domain,
      hasToken: !!organization.domain_verification_token,
    });

    // Perform DNS verification
    const dnsResult = await verifyDNS(domain, organization.domain_verification_token);

    logStep("DNS verification result", dnsResult);

    // Update organization with verification result
    if (dnsResult.txtVerified || dnsResult.cnameVerified) {
      const { error: updateError } = await supabaseClient
        .from("organizations")
        .update({
          custom_domain_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId);

      if (updateError) {
        logStep("Error updating organization", { error: updateError });
        throw new Error("Failed to update organization verification status");
      }

      logStep("Domain verified successfully");
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          message: "Domain verified successfully",
          details: dnsResult,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      logStep("Domain verification failed");
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: "Domain verification failed. Please check your DNS records.",
          details: dnsResult,
          instructions: {
            txt: `Add a TXT record with value: ${organization.domain_verification_token}`,
            cname: `Add a CNAME record pointing to: ${Deno.env.get("APP_DOMAIN") || "your-app.gym-unity.com"}`,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-custom-domain", { message: errorMessage });
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
