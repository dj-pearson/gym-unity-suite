import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePortalTheme, applyPortalTheme, PortalTheme, PORTAL_DEFAULT_THEME } from '@/hooks/usePortalTheme';

interface PortalThemeContextType {
  theme: PortalTheme | null;
  resolvedTheme: Omit<PortalTheme, 'id' | 'organization_id'>;
  isLoading: boolean;
  isFeatureEnabled: (feature: string) => boolean;
}

const PortalThemeContext = createContext<PortalThemeContextType | undefined>(undefined);

interface PortalThemeProviderProps {
  organizationId: string | undefined;
  children: ReactNode;
}

export function PortalThemeProvider({ organizationId, children }: PortalThemeProviderProps) {
  const { theme, resolvedTheme, isLoading } = usePortalTheme(organizationId);

  // Apply CSS variables when theme loads
  useEffect(() => {
    if (resolvedTheme) {
      applyPortalTheme(resolvedTheme);
    }
  }, [resolvedTheme]);

  // Load custom Google Font if non-default
  useEffect(() => {
    const fontFamily = resolvedTheme.font_family_heading;
    if (fontFamily && fontFamily !== 'Inter') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      link.id = 'portal-heading-font';
      const existing = document.getElementById('portal-heading-font');
      if (existing) existing.remove();
      document.head.appendChild(link);
    }

    const bodyFont = resolvedTheme.font_family_body;
    if (bodyFont && bodyFont !== 'Inter' && bodyFont !== resolvedTheme.font_family_heading) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(bodyFont)}:wght@400;500;600&display=swap`;
      link.rel = 'stylesheet';
      link.id = 'portal-body-font';
      const existing = document.getElementById('portal-body-font');
      if (existing) existing.remove();
      document.head.appendChild(link);
    }
  }, [resolvedTheme.font_family_heading, resolvedTheme.font_family_body]);

  // Inject custom CSS if enterprise
  useEffect(() => {
    if (theme?.custom_css) {
      const style = document.createElement('style');
      style.id = 'portal-custom-css';
      style.textContent = theme.custom_css;
      const existing = document.getElementById('portal-custom-css');
      if (existing) existing.remove();
      document.head.appendChild(style);

      return () => {
        const el = document.getElementById('portal-custom-css');
        if (el) el.remove();
      };
    }
  }, [theme?.custom_css]);

  const isFeatureEnabled = (feature: string): boolean => {
    return resolvedTheme.features_enabled?.[feature] ?? false;
  };

  return (
    <PortalThemeContext.Provider value={{ theme, resolvedTheme, isLoading, isFeatureEnabled }}>
      {children}
    </PortalThemeContext.Provider>
  );
}

export function usePortalThemeContext() {
  const context = useContext(PortalThemeContext);
  if (context === undefined) {
    throw new Error('usePortalThemeContext must be used within a PortalThemeProvider');
  }
  return context;
}
