/**
 * Supabase Edge Functions Runtime Server
 * Production-ready server for self-hosted Supabase edge functions
 * 
 * This server loads and serves all edge functions from the /app/functions directory
 * and provides a health check endpoint for Docker healthcheck.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { join } from "https://deno.land/std@0.168.0/path/mod.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8000");
const FUNCTIONS_PATH = Deno.env.get("FUNCTIONS_PATH") || "/app/functions";

// Function cache to store loaded function modules
const functionCache = new Map<string, any>();

// Get list of available functions
async function getAvailableFunctions(): Promise<string[]> {
  const functions: string[] = [];
  try {
    for await (const dirEntry of Deno.readDir(FUNCTIONS_PATH)) {
      if (dirEntry.isDirectory) {
        // Check if index.ts exists in the function directory
        const indexPath = join(FUNCTIONS_PATH, dirEntry.name, "index.ts");
        try {
          await Deno.stat(indexPath);
          functions.push(dirEntry.name);
          console.log(`📦 Found function: ${dirEntry.name}`);
        } catch {
          // index.ts doesn't exist, skip this directory
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading functions directory: ${error.message}`);
  }
  return functions;
}

// Load a function module
async function loadFunction(functionName: string): Promise<any> {
  if (functionCache.has(functionName)) {
    return functionCache.get(functionName);
  }

  const functionPath = join(FUNCTIONS_PATH, functionName, "index.ts");
  console.log(`🔄 Loading function: ${functionName} from ${functionPath}`);
  
  try {
    const module = await import(`file://${functionPath}`);
    functionCache.set(functionName, module);
    console.log(`✅ Loaded function: ${functionName}`);
    return module;
  } catch (error) {
    console.error(`❌ Error loading function ${functionName}:`, error);
    throw error;
  }
}

// CORS headers
function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

// Main request handler
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const origin = req.headers.get("origin");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // Health check endpoint
  if (pathname === "/health" || pathname === "/health-check") {
    return new Response(
      JSON.stringify({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        functions: await getAvailableFunctions()
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      }
    );
  }

  // Root endpoint - list available functions
  if (pathname === "/" || pathname === "") {
    const functions = await getAvailableFunctions();
    return new Response(
      JSON.stringify({
        message: "Supabase Edge Functions Runtime",
        version: "1.0.0",
        functions,
        usage: "POST /<function-name> to invoke a function",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      }
    );
  }

  // Extract function name from pathname (e.g., /ai-generate -> ai-generate)
  const functionName = pathname.slice(1).split("/")[0];
  
  if (!functionName) {
    return new Response(
      JSON.stringify({ error: "Function name required" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      }
    );
  }

  try {
    // Load the function
    const functionModule = await loadFunction(functionName);
    
    // Check if function has a default export handler
    let handler = functionModule.default;
    
    // If no default export, check if it's using Deno.serve pattern
    // In that case, we need to execute the function file in an isolated context
    if (!handler) {
      // For Deno.serve pattern, we'll need to create a subprocess or handle it differently
      // For now, throw an error with helpful message
      throw new Error(
        `Function ${functionName} must export a default handler. ` +
        `Example: export default async (req: Request) => { ... }`
      );
    }

    console.log(`🚀 Invoking function: ${functionName}`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Path: ${pathname}`);

    // Invoke the function with the request
    const response = await handler(req);
    
    // Ensure response is a Response object
    if (!(response instanceof Response)) {
      throw new Error(`Function ${functionName} must return a Response object`);
    }
    
    // Ensure CORS headers are added to the response
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
      if (!responseHeaders.has(key)) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`❌ Error invoking function ${functionName}:`, error);
    
    return new Response(
      JSON.stringify({
        error: `Failed to invoke function: ${functionName}`,
        message: error.message,
        stack: Deno.env.get("DENO_ENV") === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      }
    );
  }
}

// Start the server
console.log(`🚀 Starting Supabase Edge Functions Runtime`);
console.log(`📂 Functions directory: ${FUNCTIONS_PATH}`);
console.log(`🌐 Port: ${PORT}`);
console.log(`🔑 Environment variables loaded:`);
console.log(`   - SUPABASE_URL: ${Deno.env.get("SUPABASE_URL") ? "✓" : "✗"}`);
console.log(`   - SUPABASE_ANON_KEY: ${Deno.env.get("SUPABASE_ANON_KEY") ? "✓" : "✗"}`);
console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "✓" : "✗"}`);
console.log(`   - OPENAI_API_KEY: ${Deno.env.get("OPENAI_API_KEY") ? "✓" : "✗"}`);
console.log(`   - STRIPE_SECRET_KEY: ${Deno.env.get("STRIPE_SECRET_KEY") ? "✓" : "✗"}`);
console.log(`   - RESEND_API_KEY: ${Deno.env.get("RESEND_API_KEY") ? "✓" : "✗"}`);

// Pre-load all functions at startup
const availableFunctions = await getAvailableFunctions();
console.log(`📋 Found ${availableFunctions.length} functions:`, availableFunctions.join(", "));

// Optional: Pre-cache all functions
if (Deno.env.get("PRELOAD_FUNCTIONS") === "true") {
  console.log(`🔄 Pre-loading all functions...`);
  for (const funcName of availableFunctions) {
    try {
      await loadFunction(funcName);
    } catch (error) {
      console.error(`❌ Failed to pre-load ${funcName}:`, error.message);
    }
  }
  console.log(`✅ Pre-loading complete`);
}

console.log(`✅ Server ready and listening on port ${PORT}`);
console.log(`🔗 Health check: http://localhost:${PORT}/health`);

await serve(handleRequest, { port: PORT });

