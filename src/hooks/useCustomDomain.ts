import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useCustomDomain = () => {
  const [organization, setOrganization] = useState<CustomDomainOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  useEffect(() => {
    const detectCustomDomain = async () => {
      try {
        const hostname = window.location.hostname;

        // Skip if on localhost or default domains
        const defaultDomains = [
          'localhost',
          '127.0.0.1',
          'gym-unity.app',
          'gym-unity.com',
          'lovable.app',
          'lovable.dev'
        ];

        const isDefaultDomain = defaultDomains.some(domain =>
          hostname === domain || hostname.endsWith(`.${domain}`)
        );

        if (isDefaultDomain) {
          setIsCustomDomain(false);
          setLoading(false);
          return;
        }

        // This is potentially a custom domain, try to look it up
        setIsCustomDomain(true);

        // Use the edge function to get organization by domain
        const { data, error } = await supabase.functions.invoke('get-org-by-domain', {
          body: { domain: hostname },
        });

        if (error) {
          console.error('Error fetching organization by domain:', error);
          setLoading(false);
          return;
        }

        if (data?.success && data.organization) {
          setOrganization(data.organization);

          // Apply custom branding
          if (data.organization.primary_color) {
            document.documentElement.style.setProperty('--primary', data.organization.primary_color);
          }
          if (data.organization.secondary_color) {
            document.documentElement.style.setProperty('--secondary', data.organization.secondary_color);
          }
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
