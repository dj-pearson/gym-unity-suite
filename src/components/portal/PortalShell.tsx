import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader } from './PortalHeader';
import { PortalSidebar } from './PortalSidebar';
import { PortalBottomNav } from './PortalBottomNav';
import { PortalFooter } from './PortalFooter';
import { useAuth } from '@/contexts/AuthContext';

interface PortalShellProps {
  organizationName: string;
  logoUrl?: string | null;
  children: React.ReactNode;
}

export function PortalShell({ organizationName, logoUrl, children }: PortalShellProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PortalHeader
        organizationName={organizationName}
        logoUrl={logoUrl}
        memberName={profile?.first_name || undefined}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => navigate('/portal/profile')}
        onNotificationsClick={() => navigate('/portal/notifications')}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-1">
        <PortalSidebar
          organizationName={organizationName}
          logoUrl={logoUrl}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6" role="main">
          {children}
        </main>
      </div>

      <PortalFooter organizationName={organizationName} />
      <PortalBottomNav />
    </div>
  );
}
