import React, { createContext, useContext, ReactNode } from 'react';
import { useCustomDomain } from '@/hooks/useCustomDomain';

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

interface CustomDomainContextType {
  organization: CustomDomainOrganization | null;
  loading: boolean;
  isCustomDomain: boolean;
}

const CustomDomainContext = createContext<CustomDomainContextType | undefined>(undefined);

export const CustomDomainProvider = ({ children }: { children: ReactNode }) => {
  const customDomainData = useCustomDomain();

  return (
    <CustomDomainContext.Provider value={customDomainData}>
      {children}
    </CustomDomainContext.Provider>
  );
};

export const useCustomDomainContext = () => {
  const context = useContext(CustomDomainContext);
  if (context === undefined) {
    throw new Error('useCustomDomainContext must be used within a CustomDomainProvider');
  }
  return context;
};

// Optional hook that doesn't throw if not in provider
export const useCustomDomainOptional = () => {
  return useContext(CustomDomainContext);
};
