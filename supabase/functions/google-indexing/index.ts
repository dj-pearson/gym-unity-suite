import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getCorsHeaders,
  handleCorsPreFlight,
  corsJsonResponse,
  corsErrorResponse,
} from "../_shared/cors.ts";

/**
 * Google Indexing API Edge Function
 *
 * Submits URLs to Google's Indexing API for faster crawling/indexing.
 * Uses a Google Service Account for authentication via JWT/OAuth2.
 *
 * Required environment variable:
 *   GOOGLE_SERVICE_ACCOUNT_JSON - The full JSON export of a Google Service Account
 *     with the Indexing API enabled.
 *
 * API Reference: https://developers.google.com/search/apis/indexing-api/v3/prereqs
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_INDEXING_API_URL =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";
const GOOGLE_INDEXING_BATCH_URL =
  "https://indexing.googleapis.com/batch";
const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";

type IndexingAction = "URL_UPDATED" | "URL_DELETED";

interface IndexingRequest {
  urls: string[];
  action?: IndexingAction;
}

interface IndexingResult {
  url: string;
  success: boolean;
  status?: number;
  error?: string;
}

/**
 * Base64url encode (no padding) for JWT
 */
function base64urlEncode(data: Uint8Array | string): string {
  const input = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const base64 = btoa(String.fromCharCode(...input));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Import a PEM-encoded RSA private key as a CryptoKey for signing
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/**
 * Create a signed JWT for Google OAuth2 service account authentication
 */
async function createSignedJwt(
  clientEmail: string,
  privateKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: INDEXING_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

/**
 * Exchange a signed JWT for a Google OAuth2 access token
 */
async function getAccessToken(
  clientEmail: string,
  privateKey: string
): Promise<string> {
  const jwt = await createSignedJwt(clientEmail, privateKey);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Submit a single URL to the Google Indexing API
 */
async function submitUrl(
  url: string,
  action: IndexingAction,
  accessToken: string
): Promise<IndexingResult> {
  try {
    const response = await fetch(GOOGLE_INDEXING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type: action }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        url,
        success: false,
        status: response.status,
        error: errorBody,
      };
    }

    return { url, success: true, status: response.status };
  } catch (error) {
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Log indexing results to the database for audit purposes
 */
async function logIndexingResults(
  supabase: ReturnType<typeof createClient>,
  results: IndexingResult[],
  action: IndexingAction
) {
  try {
    const records = results.map((r) => ({
      url: r.url,
      action,
      success: r.success,
      status_code: r.status ?? null,
      error_message: r.error ?? null,
      submitted_at: new Date().toISOString(),
    }));

    await supabase.from("google_indexing_log").insert(records);
  } catch (err) {
    // Log but don't fail the request if audit logging fails
    console.error("[GOOGLE-INDEXING] Failed to log results:", err);
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(origin);
  }

  // Only allow POST
  if (req.method !== "POST") {
    return corsErrorResponse("Method not allowed", origin, 405);
  }

  try {
    // Parse and validate the service account credentials
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
    }

    let serviceAccount: { client_email: string; private_key: string };
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON contains invalid JSON");
    }

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON missing client_email or private_key"
      );
    }

    // Authenticate the caller via Supabase JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return corsErrorResponse("Authorization required", origin, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return corsErrorResponse("Unauthorized", origin, 401);
    }

    // Parse request body
    const body: IndexingRequest = await req.json();

    if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
      return corsErrorResponse(
        "Invalid request: 'urls' must be a non-empty array of URL strings",
        origin,
        400
      );
    }

    // Limit batch size to 200 (Google's daily quota is typically 200/day for new projects)
    if (body.urls.length > 200) {
      return corsErrorResponse(
        "Batch size exceeds maximum of 200 URLs per request",
        origin,
        400
      );
    }

    // Validate each URL
    const urlPattern = /^https?:\/\/.+/;
    for (const url of body.urls) {
      if (typeof url !== "string" || !urlPattern.test(url)) {
        return corsErrorResponse(
          `Invalid URL: ${url}. URLs must start with http:// or https://`,
          origin,
          400
        );
      }
    }

    const action: IndexingAction = body.action || "URL_UPDATED";
    if (action !== "URL_UPDATED" && action !== "URL_DELETED") {
      return corsErrorResponse(
        "Invalid action: must be 'URL_UPDATED' or 'URL_DELETED'",
        origin,
        400
      );
    }

    // Get Google OAuth2 access token
    console.log(
      `[GOOGLE-INDEXING] Submitting ${body.urls.length} URL(s) with action: ${action}`
    );
    const accessToken = await getAccessToken(
      serviceAccount.client_email,
      serviceAccount.private_key
    );

    // Submit URLs concurrently (with concurrency limit)
    const CONCURRENCY_LIMIT = 10;
    const results: IndexingResult[] = [];

    for (let i = 0; i < body.urls.length; i += CONCURRENCY_LIMIT) {
      const batch = body.urls.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map((url) => submitUrl(url, action, accessToken))
      );
      results.push(...batchResults);
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `[GOOGLE-INDEXING] Completed: ${succeeded} succeeded, ${failed} failed`
    );

    // Log results to database for auditing
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    await logIndexingResults(adminSupabase, results, action);

    return corsJsonResponse(
      {
        success: true,
        submitted: body.urls.length,
        succeeded,
        failed,
        results,
      },
      origin
    );
  } catch (error) {
    console.error("[GOOGLE-INDEXING] Error:", error);

    const isConfigError =
      error instanceof Error &&
      (error.message.includes("GOOGLE_SERVICE_ACCOUNT_JSON") ||
        error.message.includes("not configured"));

    return corsErrorResponse(
      isConfigError
        ? "Google Indexing API is not configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON."
        : "An error occurred while submitting URLs for indexing.",
      origin,
      isConfigError ? 503 : 500
    );
  }
});
