import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Allowed origins for CORS - production domains only
const ALLOWED_ORIGINS = [
  "https://gym-unity-suite.com",
  "https://www.gym-unity-suite.com",
  "https://gym-unity-suite.pages.dev",
  "https://api.repclub.net",
  // Development origins (remove in production)
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:5173",
];

// Valid roles for new users
const VALID_ROLES = ["member", "trainer", "staff", "manager", "owner"];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to get CORS headers based on origin
function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return allowed === origin;
  })) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  } else if (!origin) {
    // Allow requests without origin (same-origin or non-browser)
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0];
  }

  return headers;
}

// Input validation helper
function validateInput(data: any): { valid: boolean; error?: string } {
  // Check userId
  if (!data.userId) {
    return { valid: false, error: "userId is required" };
  }
  if (typeof data.userId !== "string" || !UUID_REGEX.test(data.userId)) {
    return { valid: false, error: "userId must be a valid UUID" };
  }

  // Check email
  if (!data.email) {
    return { valid: false, error: "email is required" };
  }
  if (typeof data.email !== "string" || !EMAIL_REGEX.test(data.email)) {
    return { valid: false, error: "email must be a valid email address" };
  }
  if (data.email.length > 255) {
    return { valid: false, error: "email is too long (max 255 characters)" };
  }

  // Check role (optional, defaults to member)
  if (data.role !== undefined) {
    if (typeof data.role !== "string" || !VALID_ROLES.includes(data.role)) {
      return { valid: false, error: `role must be one of: ${VALID_ROLES.join(", ")}` };
    }
  }

  // Check organizationId if provided (optional)
  if (data.organizationId !== undefined) {
    if (typeof data.organizationId !== "string" || !UUID_REGEX.test(data.organizationId)) {
      return { valid: false, error: "organizationId must be a valid UUID" };
    }
  }

  return { valid: true };
}

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SETUP-NEW-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    logStep("Function started");

    // Parse and validate input
    let requestData: any;
    try {
      requestData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input data
    const validation = validateInput(requestData);
    if (!validation.valid) {
      logStep("Validation failed", { error: validation.error });
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, email, role = "member", organizationId } = requestData;

    logStep("Processing user setup", { userId, email: email.substring(0, 3) + "***", role });

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Determine organization
    let targetOrgId: string;
    let targetLocationId: string | null = null;

    if (organizationId) {
      // Use provided organization
      const { data: org, error: orgError } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .single();

      if (orgError || !org) {
        logStep("Organization not found", { organizationId });
        return new Response(
          JSON.stringify({ error: "Organization not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      targetOrgId = org.id;
    } else {
      // Get the default organization (FitnessPro Gym)
      const { data: organization, error: orgError } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("slug", "fitnesspro")
        .single();

      if (orgError || !organization) {
        logStep("Default organization not found", { error: orgError });
        return new Response(
          JSON.stringify({ error: "Default organization not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      targetOrgId = organization.id;
    }

    // Get the default location for this organization
    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("id")
      .eq("organization_id", targetOrgId)
      .limit(1)
      .single();

    if (!locationError && location) {
      targetLocationId = location.id;
    } else {
      logStep("No default location found, continuing without location assignment");
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      logStep("Profile already exists", { userId });
      return new Response(
        JSON.stringify({ success: true, message: "Profile already exists", profile: existingProfile }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create profile for the new user
    const profileData: Record<string, any> = {
      id: userId,
      email: email.toLowerCase().trim(),
      organization_id: targetOrgId,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (targetLocationId) {
      profileData.location_id = targetLocationId;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      logStep("Profile creation error", { error: profileError.message });
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Profile created successfully", { profileId: profile.id });

    return new Response(
      JSON.stringify({ success: true, profile }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    logStep("Unexpected error", { message: error?.message });
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
