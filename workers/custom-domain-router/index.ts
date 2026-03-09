/**
 * Cloudflare Worker for Custom Domain & Subdomain Routing
 *
 * This worker intercepts requests to custom domains and subdomains and:
 * 1. Handles *.repclub.app subdomain routing (white-label member portals)
 * 2. Handles custom domain routing (enterprise white-label)
 * 3. Injects organization-specific branding and configuration
 * 4. Routes the request to the appropriate application instance
 *
 * Supports both hosted and self-hosted Supabase deployments:
 * - SUPABASE_URL: API URL (e.g., https://api.yourdomain.com)
 * - SUPABASE_FUNCTIONS_URL: Edge Functions URL (e.g., https://functions.yourdomain.com)
 *   If not provided, falls back to ${SUPABASE_URL}/functions/v1
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_FUNCTIONS_URL?: string; // Optional: separate functions subdomain for self-hosted
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

// Reserved subdomains that should not be treated as portal slugs
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'portal', 'mail', 'ftp', 'blog', 'help', 'support', 'docs', 'status'];

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

    // Skip processing for default admin domains
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

    try {
      const functionsUrl = env.SUPABASE_FUNCTIONS_URL || `${env.SUPABASE_URL}/functions/v1`;
      let organization: Organization | null = null;
      let portalTheme: any = null;

      // 1. Check if this is a *.repclub.app subdomain
      if (hostname.endsWith('.repclub.app') && hostname !== 'repclub.app') {
        const slug = hostname.split('.')[0];

        // Skip reserved subdomains
        if (RESERVED_SUBDOMAINS.includes(slug)) {
          return fetch(request);
        }

        // Look up organization by slug
        const orgResponse = await fetch(`${functionsUrl}/get-org-by-slug?slug=${slug}`, {
          headers: {
            'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (orgResponse.ok) {
          const orgData = await orgResponse.json() as any;
          if (orgData.success && orgData.organization) {
            organization = orgData.organization;
            portalTheme = orgData.theme;
          }
        }
      }

      // 2. Check if this is a custom domain (enterprise)
      if (!organization) {
        const orgResponse = await fetch(`${functionsUrl}/get-org-by-domain?domain=${hostname}`, {
          headers: {
            'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (orgResponse.ok) {
          const orgData = await orgResponse.json() as any;
          if (orgData.success && orgData.organization) {
            organization = orgData.organization;
          }
        }
      }

      // 3. No organization found
      if (!organization) {
        return new Response('Portal not found. Please check the URL and try again.', {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // 4. Fetch the original content from the default origin
      const originUrl = new URL(request.url);
      originUrl.hostname = env.DEFAULT_ORIGIN || 'gym-unity.app';

      // Redirect all portal requests to the /portal route
      if (!originUrl.pathname.startsWith('/portal') &&
          !originUrl.pathname.startsWith('/assets') &&
          !originUrl.pathname.startsWith('/auth') &&
          !originUrl.pathname.match(/\.\w+$/)) {
        originUrl.pathname = '/portal' + originUrl.pathname;
      }

      const originRequest = new Request(originUrl.toString(), request);
      const originResponse = await fetch(originRequest);

      // Clone the response so we can modify it
      let response = new Response(originResponse.body, originResponse);

      // If it's an HTML response, inject organization branding
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        let html = await response.text();

        // Build theme CSS variables
        let themeCss = `
          :root {
            --primary: ${organization.primary_color};
            --secondary: ${organization.secondary_color};
        `;

        if (portalTheme) {
          themeCss += `
            --portal-primary: ${portalTheme.color_primary || organization.primary_color};
            --portal-secondary: ${portalTheme.color_secondary || organization.secondary_color};
            --portal-background: ${portalTheme.color_background || '0 0% 100%'};
            --portal-surface: ${portalTheme.color_surface || '0 0% 98%'};
            --portal-text: ${portalTheme.color_text_primary || '222 47% 11%'};
            --portal-text-secondary: ${portalTheme.color_text_secondary || '215 14% 34%'};
            --portal-text-muted: ${portalTheme.color_text_muted || '220 9% 46%'};
            --portal-border: ${portalTheme.color_border || '220 13% 91%'};
            --portal-radius: ${portalTheme.border_radius || '0.5rem'};
            --portal-font-heading: ${portalTheme.font_family_heading || 'Inter'};
            --portal-font-body: ${portalTheme.font_family_body || 'Inter'};
          `;
        }

        themeCss += '}';

        // Inject organization data as meta tags, theme script, and CSS
        const brandingInjection = `
          <script>
            window.__CUSTOM_DOMAIN_ORG__ = ${JSON.stringify(organization)};
            window.__PORTAL_THEME__ = ${JSON.stringify(portalTheme || null)};
            window.__IS_PORTAL__ = true;
          </script>
          <meta name="organization-id" content="${organization.id}" />
          <meta name="organization-name" content="${organization.name}" />
          <style>${themeCss}</style>
        `;

        // Inject custom Google Font if non-default
        let fontLink = '';
        if (portalTheme?.font_family_heading && portalTheme.font_family_heading !== 'Inter') {
          fontLink += `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(portalTheme.font_family_heading)}:wght@400;500;600;700&display=swap" rel="stylesheet">`;
        }
        if (portalTheme?.font_family_body && portalTheme.font_family_body !== 'Inter' && portalTheme.font_family_body !== portalTheme.font_family_heading) {
          fontLink += `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(portalTheme.font_family_body)}:wght@400;500;600&display=swap" rel="stylesheet">`;
        }

        // Inject before closing head tag
        html = html.replace('</head>', `${fontLink}${brandingInjection}</head>`);

        // Update title
        html = html.replace(/<title>.*?<\/title>/, `<title>${organization.name}</title>`);

        // Inject favicon if logo_icon_url exists
        if (portalTheme?.logo_icon_url) {
          html = html.replace('</head>', `<link rel="icon" href="${portalTheme.logo_icon_url}" /></head>`);
        }

        response = new Response(html, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers: originResponse.headers,
        });
      }

      // Add custom headers
      response.headers.set('X-Custom-Domain', hostname);
      response.headers.set('X-Organization-ID', organization.id);
      response.headers.set('X-Organization-Slug', organization.slug);
      response.headers.set('X-Portal-Mode', 'true');

      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, ApiKey');

      return response;

    } catch (error) {
      console.error('Error processing domain:', error);
      return new Response('Internal server error', {
        status: 500,
      });
    }
  },
};
