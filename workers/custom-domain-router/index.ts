/**
 * Cloudflare Worker for Custom Domain Routing
 *
 * This worker intercepts requests to custom domains and:
 * 1. Verifies the domain is registered and verified in the database
 * 2. Injects organization-specific branding and configuration
 * 3. Routes the request to the appropriate application instance
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  DEFAULT_ORIGIN: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  custom_domain?: string;
  custom_domain_verified?: boolean;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, ApiKey',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const hostname = url.hostname;

    // Skip processing for default domains
    const defaultDomains = [
      'gym-unity.app',
      'gym-unity.com',
      'localhost'
    ];

    const isDefaultDomain = defaultDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (isDefaultDomain) {
      // Forward to origin for default domains
      return fetch(request);
    }

    // This is a custom domain, look it up in the database
    try {
      const orgResponse = await fetch(`${env.SUPABASE_URL}/functions/v1/get-org-by-domain?domain=${hostname}`, {
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!orgResponse.ok) {
        // Organization not found or not verified
        return new Response('Custom domain not found or not verified', {
          status: 404,
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      const orgData = await orgResponse.json();

      if (!orgData.success || !orgData.organization) {
        return new Response('Invalid custom domain configuration', {
          status: 404,
        });
      }

      const organization: Organization = orgData.organization;

      // Fetch the original content from the default origin
      const originUrl = new URL(request.url);
      originUrl.hostname = env.DEFAULT_ORIGIN || 'gym-unity.app';

      const originRequest = new Request(originUrl.toString(), request);
      const originResponse = await fetch(originRequest);

      // Clone the response so we can modify it
      let response = new Response(originResponse.body, originResponse);

      // If it's an HTML response, inject organization branding
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        let html = await response.text();

        // Inject organization data as meta tags and script
        const brandingScript = `
          <script>
            window.__CUSTOM_DOMAIN_ORG__ = ${JSON.stringify(organization)};
          </script>
          <meta name="organization-id" content="${organization.id}" />
          <meta name="organization-name" content="${organization.name}" />
          <style>
            :root {
              --primary: ${organization.primary_color};
              --secondary: ${organization.secondary_color};
            }
          </style>
        `;

        // Inject before closing head tag
        html = html.replace('</head>', `${brandingScript}</head>`);

        // Update title if needed
        html = html.replace(/<title>.*?<\/title>/, `<title>${organization.name}</title>`);

        response = new Response(html, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers: originResponse.headers,
        });
      }

      // Add custom headers to identify custom domain requests
      response.headers.set('X-Custom-Domain', hostname);
      response.headers.set('X-Organization-ID', organization.id);
      response.headers.set('X-Organization-Slug', organization.slug);

      // Add CORS headers to response
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, ApiKey');

      return response;

    } catch (error) {
      console.error('Error processing custom domain:', error);
      return new Response('Internal server error', {
        status: 500,
      });
    }
  },
};
