/**
 * Supabase Client Configuration
 *
 * Supports both hosted Supabase and self-hosted deployments.
 *
 * For self-hosted Supabase:
 * - VITE_SUPABASE_URL: API subdomain (e.g., https://api.yourdomain.com)
 * - VITE_SUPABASE_FUNCTIONS_URL: Functions subdomain (e.g., https://functions.yourdomain.com)
 *
 * For hosted Supabase:
 * - VITE_SUPABASE_URL: Project URL (e.g., https://yourproject.supabase.co)
 * - VITE_SUPABASE_FUNCTIONS_URL: Optional, defaults to {SUPABASE_URL}/functions/v1
 */
import { createClient, SupabaseClient, FunctionsInvokeOptions } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration from environment variables
// For self-hosted: VITE_SUPABASE_URL should be your API subdomain (e.g., https://api.repclub.net)
// For cloud: VITE_SUPABASE_URL should be your project URL (e.g., https://yourproject.supabase.co)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required configuration
// Use console.warn instead of console.error to reduce noise in test environments
// while still alerting developers to missing configuration
const isMissingConfig = !SUPABASE_URL || !SUPABASE_ANON_KEY;
if (isMissingConfig) {
  // Only log warning once and use warn level to avoid failing automated tests
  // that don't have Supabase configured
  const isTestEnvironment = typeof (globalThis as any).__vitest__ !== 'undefined' ||
                            import.meta.env.MODE === 'test';
  if (!isTestEnvironment) {
    console.warn('[Supabase] Missing configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }
}

// Edge Functions URL for self-hosted Supabase (via Kong)
// If not provided, falls back to the standard Supabase functions path
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || `${SUPABASE_URL}/functions/v1`;

// Export configuration for use in other modules
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  functionsUrl: SUPABASE_FUNCTIONS_URL,
  // Helper to check if using self-hosted setup
  isSelfHosted: !!import.meta.env.VITE_SUPABASE_FUNCTIONS_URL,
} as const;

// Create the Supabase client
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
// 
// Configuration follows best practices from AUTH_SETUP_DOCUMENTATION.md:
// - localStorage for persistent sessions
// - Auto token refresh (5 minutes before expiry)
// - Graceful fallback if localStorage unavailable
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use localStorage for session persistence (with fallback)
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    // Keep user logged in across browser sessions
    persistSession: true,
    // Automatically refresh JWT tokens before expiry
    autoRefreshToken: true,
    // Detect session changes in other tabs
    detectSessionInUrl: true,
    // Flow type for authentication
    flowType: 'pkce', // More secure than implicit flow
  },
  global: {
    headers: {
      'X-Client-Info': 'gym-unity-suite',
    },
  },
});

/**
 * Edge Function Invocation Helper
 *
 * Routes edge function calls to the appropriate endpoint:
 * - Self-hosted: Uses the functions subdomain (via Kong)
 * - Hosted: Uses the standard Supabase functions endpoint
 *
 * @param functionName - Name of the edge function to invoke
 * @param options - Standard Supabase function invoke options
 * @returns Promise with function response data and error
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  options?: FunctionsInvokeOptions
): Promise<{ data: T | null; error: Error | null }> {
  // For self-hosted setup with separate functions subdomain
  if (supabaseConfig.isSelfHosted) {
    return invokeCustomFunction<T>(functionName, options);
  }

  // For standard Supabase setup, use the built-in client
  const { data, error } = await supabase.functions.invoke<T>(functionName, options);
  return { data, error };
}

/**
 * Custom Edge Function Invocation for Self-Hosted Supabase
 *
 * Directly calls edge functions via the Kong gateway on the functions subdomain.
 * This bypasses the standard Supabase client functions path.
 *
 * @param functionName - Name of the edge function
 * @param options - Function invoke options (body, headers, method)
 * @returns Promise with typed response data
 */
async function invokeCustomFunction<T>(
  functionName: string,
  options?: FunctionsInvokeOptions
): Promise<{ data: T | null; error: Error | null }> {
  const url = `${SUPABASE_FUNCTIONS_URL}/${functionName}`;

  try {
    // Get the current session for auth token
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`,
      }),
      ...(options?.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      method: options?.method || 'POST',
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: new Error(`Edge function error (${response.status}): ${errorText}`),
      };
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return { data: data as T, error: null };
    }

    // For non-JSON responses, return as text wrapped in an object
    const text = await response.text();
    return { data: { text } as unknown as T, error: null };

  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error invoking edge function'),
    };
  }
}

/**
 * Wrapper for supabase.functions.invoke that automatically routes
 * to the correct endpoint for self-hosted setups.
 *
 * This provides a drop-in replacement that can be used instead of
 * supabase.functions.invoke() for better self-hosted compatibility.
 */
export const edgeFunctions = {
  invoke: invokeEdgeFunction,

  /**
   * Get the full URL for an edge function
   * Useful for webhooks or external services that need to call functions
   */
  getUrl: (functionName: string): string => {
    return `${SUPABASE_FUNCTIONS_URL}/${functionName}`;
  },

  /**
   * Check if functions are available by calling a health check
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/health`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};