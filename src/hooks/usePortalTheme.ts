import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortalTheme {
  id: string;
  organization_id: string;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_surface: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_text_muted: string;
  color_border: string;
  color_success: string;
  color_warning: string;
  color_error: string;
  dark_color_background: string | null;
  dark_color_surface: string | null;
  dark_color_text_primary: string | null;
  dark_color_text_secondary: string | null;
  dark_color_border: string | null;
  font_family_heading: string;
  font_family_body: string;
  font_size_base: string;
  border_radius: string;
  border_radius_button: string;
  button_style: string;
  card_style: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  logo_icon_url: string | null;
  login_background_url: string | null;
  welcome_hero_url: string | null;
  custom_css: string | null;
  show_powered_by: boolean;
  powered_by_style: string;
  pwa_name: string | null;
  pwa_short_name: string | null;
  pwa_theme_color: string | null;
  pwa_background_color: string | null;
  email_header_color: string | null;
  email_footer_text: string | null;
  features_enabled: Record<string, boolean>;
  nav_items: any[] | null;
}

const DEFAULT_THEME: Omit<PortalTheme, 'id' | 'organization_id'> = {
  color_primary: '221 83% 53%',
  color_secondary: '24 95% 53%',
  color_background: '0 0% 100%',
  color_surface: '0 0% 98%',
  color_text_primary: '222 47% 11%',
  color_text_secondary: '215 14% 34%',
  color_text_muted: '220 9% 46%',
  color_border: '220 13% 91%',
  color_success: '142 70% 45%',
  color_warning: '38 92% 50%',
  color_error: '0 84% 60%',
  dark_color_background: null,
  dark_color_surface: null,
  dark_color_text_primary: null,
  dark_color_text_secondary: null,
  dark_color_border: null,
  font_family_heading: 'Inter',
  font_family_body: 'Inter',
  font_size_base: '16px',
  border_radius: '0.5rem',
  border_radius_button: '0.375rem',
  button_style: 'default',
  card_style: 'bordered',
  logo_url: null,
  logo_dark_url: null,
  logo_icon_url: null,
  login_background_url: null,
  welcome_hero_url: null,
  custom_css: null,
  show_powered_by: true,
  powered_by_style: 'badge',
  pwa_name: null,
  pwa_short_name: null,
  pwa_theme_color: null,
  pwa_background_color: null,
  email_header_color: null,
  email_footer_text: null,
  features_enabled: {
    classes: true,
    check_in: true,
    loyalty: false,
    referrals: false,
    fitness_tracking: false,
    billing_self_service: true,
    push_notifications: false,
    workout_history: false,
    personal_training: false,
    retail: false,
    spa: false,
    courts: false,
    childcare: false,
    community: false,
    custom_pages: false,
    api_access: false,
  },
  nav_items: null,
};

export function usePortalTheme(organizationId: string | undefined) {
  const query = useQuery({
    queryKey: ['portal-theme', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('portal_themes')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      return data as PortalTheme | null;
    },
    enabled: !!organizationId,
  });

  return {
    ...query,
    theme: query.data ?? null,
    resolvedTheme: query.data
      ? { ...DEFAULT_THEME, ...query.data }
      : DEFAULT_THEME,
  };
}

/**
 * Apply portal theme CSS variables to the document root
 */
export function applyPortalTheme(theme: Partial<PortalTheme>) {
  const root = document.documentElement;

  if (theme.color_primary) root.style.setProperty('--portal-primary', theme.color_primary);
  if (theme.color_secondary) root.style.setProperty('--portal-secondary', theme.color_secondary);
  if (theme.color_background) root.style.setProperty('--portal-background', theme.color_background);
  if (theme.color_surface) root.style.setProperty('--portal-surface', theme.color_surface);
  if (theme.color_text_primary) root.style.setProperty('--portal-text', theme.color_text_primary);
  if (theme.color_text_secondary) root.style.setProperty('--portal-text-secondary', theme.color_text_secondary);
  if (theme.color_text_muted) root.style.setProperty('--portal-text-muted', theme.color_text_muted);
  if (theme.color_border) root.style.setProperty('--portal-border', theme.color_border);
  if (theme.color_success) root.style.setProperty('--portal-success', theme.color_success);
  if (theme.color_warning) root.style.setProperty('--portal-warning', theme.color_warning);
  if (theme.color_error) root.style.setProperty('--portal-error', theme.color_error);

  // Also map to existing Tailwind CSS variables for component compatibility
  if (theme.color_primary) root.style.setProperty('--primary', theme.color_primary);
  if (theme.color_secondary) root.style.setProperty('--secondary', theme.color_secondary);

  // Typography
  if (theme.font_family_heading) root.style.setProperty('--portal-font-heading', theme.font_family_heading);
  if (theme.font_family_body) root.style.setProperty('--portal-font-body', theme.font_family_body);
  if (theme.font_size_base) root.style.setProperty('--portal-font-size-base', theme.font_size_base);

  // Shape
  if (theme.border_radius) root.style.setProperty('--portal-radius', theme.border_radius);
  if (theme.border_radius_button) root.style.setProperty('--portal-radius-button', theme.border_radius_button);
}

export { DEFAULT_THEME as PORTAL_DEFAULT_THEME };
