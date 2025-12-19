/**
 * CORS Configuration
 *
 * Centralized CORS configuration to restrict cross-origin requests
 * to only allowed production domains.
 *
 * @module security/cors-config
 */

// CORS configuration type
export interface CORSConfig {
  enabled: boolean;
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

// Environment-specific configuration
const PRODUCTION_ORIGINS = [
  // Primary domain
  'https://gym-unity-suite.com',
  'https://www.gym-unity-suite.com',
  // Cloudflare Pages domains
  'https://gym-unity-suite.pages.dev',
  'https://*.gym-unity-suite.pages.dev',
  // Self-hosted Supabase domains
  'https://api.repclub.net',
  'https://functions.repclub.net',
  // Cloud Supabase domain (keep for migration/compatibility)
  'https://*.supabase.co',
  // Stripe domains
  'https://js.stripe.com',
  'https://api.stripe.com',
];

const STAGING_ORIGINS = [
  ...PRODUCTION_ORIGINS,
  // Staging environments
  'https://staging.gym-unity-suite.com',
  'https://staging-*.gym-unity-suite.pages.dev',
  // Preview deployments
  'https://*.gym-unity-suite.pages.dev',
];

const DEVELOPMENT_ORIGINS = [
  ...STAGING_ORIGINS,
  // Local development
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  // Vite development server
  'http://localhost:*',
  // VS Code ports
  'http://localhost:*',
];

// Standard headers
const ALLOWED_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'x-request-id',
  'x-correlation-id',
  'accept',
  'accept-encoding',
  'accept-language',
  'cache-control',
  'origin',
  'referer',
  'user-agent',
  'x-requested-with',
];

const ALLOWED_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
];

const EXPOSED_HEADERS = [
  'x-request-id',
  'x-correlation-id',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'retry-after',
];

// Default configuration
const DEFAULT_CONFIG: CORSConfig = {
  enabled: true,
  allowedOrigins: [],
  allowedMethods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  exposedHeaders: EXPOSED_HEADERS,
  maxAge: 86400, // 24 hours
  credentials: true,
};

/**
 * CORSConfigService - Manages CORS configuration
 */
class CORSConfigService {
  private config: CORSConfig;

  constructor() {
    this.config = {
      ...DEFAULT_CONFIG,
      allowedOrigins: this.getEnvironmentOrigins(),
    };
  }

  /**
   * Get allowed origins based on environment
   */
  private getEnvironmentOrigins(): string[] {
    const env = import.meta.env.MODE;

    switch (env) {
      case 'production':
        return PRODUCTION_ORIGINS;
      case 'staging':
        return STAGING_ORIGINS;
      case 'development':
      default:
        return DEVELOPMENT_ORIGINS;
    }
  }

  /**
   * Check if an origin is allowed
   */
  isOriginAllowed(origin: string): boolean {
    if (!this.config.enabled) {
      return true;
    }

    if (!origin) {
      // Allow requests without origin (same-origin or non-browser)
      return true;
    }

    return this.config.allowedOrigins.some(allowed => {
      // Exact match
      if (allowed === origin) {
        return true;
      }

      // Wildcard subdomain match (e.g., https://*.example.com)
      if (allowed.includes('*')) {
        const pattern = allowed
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }

      return false;
    });
  }

  /**
   * Get CORS headers for a request
   */
  getCorsHeaders(origin?: string): Record<string, string> {
    if (!this.config.enabled) {
      return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': this.config.allowedHeaders.join(', '),
      };
    }

    const headers: Record<string, string> = {};

    // Only set Access-Control-Allow-Origin if origin is allowed
    if (origin && this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = String(this.config.credentials);
      headers['Vary'] = 'Origin';
    } else if (!origin) {
      // No origin header - likely same-origin or non-browser request
      // Don't set CORS headers
    }

    headers['Access-Control-Allow-Methods'] = this.config.allowedMethods.join(', ');
    headers['Access-Control-Allow-Headers'] = this.config.allowedHeaders.join(', ');
    headers['Access-Control-Expose-Headers'] = this.config.exposedHeaders.join(', ');
    headers['Access-Control-Max-Age'] = String(this.config.maxAge);

    return headers;
  }

  /**
   * Get headers for preflight OPTIONS request
   */
  getPreflightHeaders(origin?: string): Record<string, string> {
    const headers = this.getCorsHeaders(origin);
    headers['Content-Length'] = '0';
    return headers;
  }

  /**
   * Handle preflight request (for edge functions)
   */
  handlePreflight(origin?: string): Response {
    if (!origin || !this.isOriginAllowed(origin)) {
      return new Response(null, {
        status: 403,
        statusText: 'Origin not allowed',
      });
    }

    return new Response(null, {
      status: 204,
      headers: this.getPreflightHeaders(origin),
    });
  }

  /**
   * Add CORS headers to a response (for edge functions)
   */
  addCorsHeaders(response: Response, origin?: string): Response {
    const corsHeaders = this.getCorsHeaders(origin);

    // Clone response to add headers
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  /**
   * Get all allowed origins
   */
  getAllowedOrigins(): string[] {
    return [...this.config.allowedOrigins];
  }

  /**
   * Add an allowed origin
   */
  addOrigin(origin: string): void {
    if (!this.config.allowedOrigins.includes(origin)) {
      this.config.allowedOrigins.push(origin);
    }
  }

  /**
   * Remove an allowed origin
   */
  removeOrigin(origin: string): void {
    this.config.allowedOrigins = this.config.allowedOrigins.filter(o => o !== origin);
  }

  /**
   * Update configuration
   */
  configure(config: Partial<CORSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CORSConfig {
    return { ...this.config };
  }

  /**
   * Generate edge function CORS handler code
   */
  generateEdgeFunctionCode(): string {
    return `
// CORS headers for edge functions
const corsHeaders = {
  "Access-Control-Allow-Origin": "", // Set dynamically from origin
  "Access-Control-Allow-Methods": "${this.config.allowedMethods.join(', ')}",
  "Access-Control-Allow-Headers": "${this.config.allowedHeaders.join(', ')}",
  "Access-Control-Expose-Headers": "${this.config.exposedHeaders.join(', ')}",
  "Access-Control-Max-Age": "${this.config.maxAge}",
  "Access-Control-Allow-Credentials": "${this.config.credentials}",
};

// Allowed origins list
const ALLOWED_ORIGINS = ${JSON.stringify(this.config.allowedOrigins, null, 2)};

// Check if origin is allowed
function isOriginAllowed(origin: string): boolean {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed === origin) return true;
    if (allowed.includes('*')) {
      const pattern = allowed
        .replace(/[.+?^${}()|[\\]\\\\]/g, '\\\\$&')
        .replace(/\\*/g, '.*');
      return new RegExp(\`^\${pattern}$\`).test(origin);
    }
    return false;
  });
}

// Get CORS headers for response
function getCorsHeaders(origin?: string): Record<string, string> {
  const headers = { ...corsHeaders };
  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}

// Handle OPTIONS preflight
if (req.method === "OPTIONS") {
  const origin = req.headers.get("origin");
  if (!isOriginAllowed(origin || "")) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin || undefined),
  });
}
`;
  }
}

// Export singleton instance
export const corsConfig = new CORSConfigService();

// Convenience exports
export const getAllowedOrigins = () => corsConfig.getAllowedOrigins();
export const isOriginAllowed = (origin: string) => corsConfig.isOriginAllowed(origin);
export const getCorsHeaders = (origin?: string) => corsConfig.getCorsHeaders(origin);

// Export origin lists for reference
export { PRODUCTION_ORIGINS, STAGING_ORIGINS, DEVELOPMENT_ORIGINS };
