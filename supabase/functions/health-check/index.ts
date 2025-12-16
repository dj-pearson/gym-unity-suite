/**
 * Health Check Edge Function
 *
 * Provides liveness and readiness endpoints for monitoring services.
 * Supports Kubernetes-style health probes and external uptime monitoring.
 *
 * Endpoints:
 * - GET / or GET /health - Full health check
 * - GET /live or GET /liveness - Basic liveness probe
 * - GET /ready or GET /readiness - Readiness probe with dependency checks
 *
 * @module functions/health-check
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface HealthCheckResult {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  checks: HealthCheckResult[];
  build?: {
    commit?: string;
    branch?: string;
    buildTime?: string;
  };
}

// Allowed origins for CORS (production domains only)
const ALLOWED_ORIGINS = [
  "https://gym-unity-suite.com",
  "https://www.gym-unity-suite.com",
  "https://gym-unity-suite.pages.dev",
  "https://staging.gym-unity-suite.com",
];

// Service start time for uptime calculation
const SERVICE_START_TIME = Date.now();

/**
 * Get CORS headers based on origin
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.includes(".gym-unity-suite.pages.dev") ||
    origin.includes("localhost")
  )
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const start = performance.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple query to test connectivity
    const { error } = await supabase
      .from("organizations")
      .select("count")
      .limit(1);

    const latency = performance.now() - start;

    if (error) {
      return {
        name: "database",
        status: "unhealthy",
        latency,
        message: `Database query failed: ${error.message}`,
      };
    }

    return {
      name: "database",
      status: latency > 2000 ? "degraded" : "healthy",
      latency,
      message: latency > 2000 ? "Database response time is slow" : "Database is responding normally",
    };
  } catch (error) {
    return {
      name: "database",
      status: "unhealthy",
      latency: performance.now() - start,
      message: `Database check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Check authentication service
 */
async function checkAuth(): Promise<HealthCheckResult> {
  const start = performance.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test auth service with a simple operation
    const { error } = await supabase.auth.getSession();

    const latency = performance.now() - start;

    if (error) {
      return {
        name: "auth",
        status: "unhealthy",
        latency,
        message: `Auth service error: ${error.message}`,
      };
    }

    return {
      name: "auth",
      status: latency > 1000 ? "degraded" : "healthy",
      latency,
      message: "Auth service is responding",
    };
  } catch (error) {
    return {
      name: "auth",
      status: "unhealthy",
      latency: performance.now() - start,
      message: `Auth check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Check storage service
 */
async function checkStorage(): Promise<HealthCheckResult> {
  const start = performance.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List buckets to test storage
    const { error } = await supabase.storage.listBuckets();

    const latency = performance.now() - start;

    if (error) {
      return {
        name: "storage",
        status: "unhealthy",
        latency,
        message: `Storage error: ${error.message}`,
      };
    }

    return {
      name: "storage",
      status: latency > 2000 ? "degraded" : "healthy",
      latency,
      message: "Storage service is responding",
    };
  } catch (error) {
    return {
      name: "storage",
      status: "unhealthy",
      latency: performance.now() - start,
      message: `Storage check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Calculate overall status from checks
 */
function calculateOverallStatus(checks: HealthCheckResult[]): "healthy" | "degraded" | "unhealthy" {
  const hasUnhealthy = checks.some((c) => c.status === "unhealthy");
  const hasDegraded = checks.some((c) => c.status === "degraded");

  if (hasUnhealthy) return "unhealthy";
  if (hasDegraded) return "degraded";
  return "healthy";
}

/**
 * Get HTTP status code based on health status
 */
function getStatusCode(status: string): number {
  switch (status) {
    case "healthy":
      return 200;
    case "degraded":
      return 200; // Still operational, just slow
    case "unhealthy":
      return 503;
    default:
      return 500;
  }
}

/**
 * Main handler
 */
export default async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: corsHeaders,
      }
    );
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop() || "";

  try {
    // Liveness probe - simple check that the service is running
    if (path === "live" || path === "liveness") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          uptime: Date.now() - SERVICE_START_TIME,
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    // Readiness probe - check critical dependencies
    if (path === "ready" || path === "readiness") {
      const checks: HealthCheckResult[] = [
        await checkDatabase(),
        await checkAuth(),
      ];

      const status = calculateOverallStatus(checks);

      return new Response(
        JSON.stringify({
          status,
          checks,
          timestamp: new Date().toISOString(),
        }),
        {
          status: getStatusCode(status),
          headers: corsHeaders,
        }
      );
    }

    // Full health check
    const checks: HealthCheckResult[] = [
      await checkDatabase(),
      await checkAuth(),
      await checkStorage(),
    ];

    const overallStatus = calculateOverallStatus(checks);

    const response: HealthResponse = {
      status: overallStatus,
      version: Deno.env.get("APP_VERSION") || "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: Date.now() - SERVICE_START_TIME,
      environment: Deno.env.get("ENVIRONMENT") || "production",
      checks,
      build: {
        commit: Deno.env.get("GIT_COMMIT"),
        branch: Deno.env.get("GIT_BRANCH"),
        buildTime: Deno.env.get("BUILD_TIME"),
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: getStatusCode(overallStatus),
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Health check error:", error);

    return new Response(
      JSON.stringify({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
