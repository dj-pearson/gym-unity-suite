import { useEffect, useState } from 'react';
import { edgeFunctions } from '@/integrations/supabase/client';

interface CustomDomainOrganization {
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

export const useCustomDomain = () => {
  const [organization, setOrganization] = useState<CustomDomainOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  useEffect(() => {
    const detectCustomDomain = async () => {
      try {
        const hostname = window.location.hostname;

        // Check if injected by Cloudflare Worker
        const injectedOrg = (window as any).__CUSTOM_DOMAIN_ORG__;
        if (injectedOrg) {
          setOrganization(injectedOrg);
          setIsCustomDomain(true);
          applyBranding(injectedOrg);
          setLoading(false);
          return;
        }

        // Skip if on localhost or default domains
        const defaultDomains = [
          'localhost',
          '127.0.0.1',
          'gym-unity.app',
          'gym-unity.com',
          'lovable.app',
          'lovable.dev',
          'lovableproject.com'
        ];

        const isDefaultDomain = defaultDomains.some(domain =>
          hostname === domain || hostname.endsWith(`.${domain}`)
        );

        // Check for *.repclub.app subdomain
        const isRepclubSubdomain = hostname.endsWith('.repclub.app') && hostname !== 'repclub.app';

        if (isRepclubSubdomain) {
          const slug = hostname.split('.')[0];

          // Skip reserved subdomains
          if (RESERVED_SUBDOMAINS.includes(slug)) {
            setIsCustomDomain(false);
            setLoading(false);
            return;
          }

          setIsCustomDomain(true);

          // Look up organization by slug
          const { data, error } = await edgeFunctions.invoke('get-org-by-slug', {
            body: { slug },
          });

          if (error) {
            console.error('Error fetching organization by slug:', error);
            setLoading(false);
            return;
          }

          if (data?.success && data.organization) {
            setOrganization(data.organization);
            applyBranding(data.organization);
          }

          setLoading(false);
          return;
        }

        if (isDefaultDomain) {
          setIsCustomDomain(false);
          setLoading(false);
          return;
        }

        // This is potentially a custom domain, try to look it up
        setIsCustomDomain(true);

        // Use the edge function to get organization by domain
        const { data, error } = await edgeFunctions.invoke('get-org-by-domain', {
          body: { domain: hostname },
        });

        if (error) {
          console.error('Error fetching organization by domain:', error);
          setLoading(false);
          return;
        }

        if (data?.success && data.organization) {
          setOrganization(data.organization);
          applyBranding(data.organization);
        }
      } catch (error) {
        console.error('Error in custom domain detection:', error);
      } finally {
        setLoading(false);
      }
    };

    detectCustomDomain();
  }, []);

  return {
    organization,
    loading,
    isCustomDomain,
  };
};

function applyBranding(org: CustomDomainOrganization) {
  if (org.primary_color) {
    document.documentElement.style.setProperty('--primary', org.primary_color);
  }
  if (org.secondary_color) {
    document.documentElement.style.setProperty('--secondary', org.secondary_color);
  }
}
