/**
 * Shared CORS Configuration for Edge Functions
 *
 * Provides consistent CORS handling across all edge functions.
 * Uses dynamic origin checking instead of wildcard for security.
 */

// Allowed origins for CORS - production domains
const ALLOWED_ORIGINS = [
  // Production domains
  "https://gym-unity-suite.com",
  "https://www.gym-unity-suite.com",
  "https://gym-unity-suite.pages.dev",
  "https://repclub.net",
  "https://www.repclub.net",
  "https://api.repclub.net",
  // Cloudflare Pages preview deployments
  "https://*.gym-unity-suite.pages.dev",
  // Development origins - consider removing in production
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

// Standard allowed headers
const ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "accept",
  "origin",
  "x-request-id",
].join(", ");

// Standard allowed methods
const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

// Exposed headers for rate limiting info
const EXPOSED_HEADERS = [
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "retry-after",
].join(", ");

/**
 * Check if an origin is in the allowed list
 */
function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.some(allowed => {
    // Exact match
    if (allowed === origin) {
      return true;
    }
    // Wildcard subdomain match
    if (allowed.includes('*')) {
      const pattern = allowed
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return false;
  });
}

/**
 * Get CORS headers based on request origin
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": "86400", // 24 hours
  };

  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Vary"] = "Origin";
  } else if (!origin) {
    // No origin header - same-origin or non-browser request
    // Default to first production origin
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0];
  }
  // If origin is not allowed, don't set Access-Control-Allow-Origin
  // This will cause the browser to block the request

  return headers;
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsPreFlight(origin: string | null): Response {
  if (origin && !isOriginAllowed(origin)) {
    return new Response(null, {
      status: 403,
      statusText: "Origin not allowed",
    });
  }

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(
  data: unknown,
  origin: string | null,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function corsErrorResponse(
  error: string,
  origin: string | null,
  status = 500
): Response {
  return corsJsonResponse({ error }, origin, status);
}

// Export the allowed origins list for reference
export { ALLOWED_ORIGINS, ALLOWED_HEADERS, ALLOWED_METHODS };
