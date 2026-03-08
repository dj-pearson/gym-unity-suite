import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortalConfiguration {
  id: string;
  organization_id: string;
  portal_enabled: boolean;
  portal_tier: 'starter' | 'professional' | 'enterprise';
  portal_subdomain: string | null;
  subdomain_verified: boolean;
  portal_custom_domain: string | null;
  portal_domain_verified: boolean;
  portal_domain_verification_token: string | null;
  welcome_message: string | null;
  welcome_enabled: boolean;
  allow_self_registration: boolean;
  require_approval: boolean;
  registration_fields: string[];
  setup_completed: boolean;
  setup_completed_at: string | null;
  setup_step: number;
  portal_visits_total: number;
  portal_active_members: number;
  created_at: string;
  updated_at: string;
}

export function usePortalConfig(organizationId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['portal-config', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('portal_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      return data as PortalConfiguration | null;
    },
    enabled: !!organizationId,
  });

  const upsertConfig = useMutation({
    mutationFn: async (config: Partial<PortalConfiguration> & { organization_id: string }) => {
      const { data: existing } = await supabase
        .from('portal_configurations')
        .select('id')
        .eq('organization_id', config.organization_id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('portal_configurations')
          .update({ ...config, updated_at: new Date().toISOString() })
          .eq('organization_id', config.organization_id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('portal_configurations')
          .insert(config)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-config', organizationId] });
    },
  });

  return {
    ...query,
    config: query.data ?? null,
    upsertConfig,
    isPortalEnabled: query.data?.portal_enabled ?? false,
    portalUrl: query.data?.portal_subdomain
      ? `https://${query.data.portal_subdomain}.repclub.app`
      : query.data?.portal_custom_domain
        ? `https://${query.data.portal_custom_domain}`
        : null,
  };
}

/**
 * Check if a subdomain slug is available
 */
export async function checkSubdomainAvailability(slug: string): Promise<boolean> {
  const reserved = ['www', 'api', 'admin', 'app', 'portal', 'mail', 'ftp', 'blog', 'help', 'support', 'docs', 'status'];
  if (reserved.includes(slug.toLowerCase())) return false;

  const { data } = await supabase
    .from('portal_configurations')
    .select('id')
    .eq('portal_subdomain', slug.toLowerCase())
    .maybeSingle();

  return !data;
}
