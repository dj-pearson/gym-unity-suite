import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedMobileDashboard from '@/components/mobile/EnhancedMobileDashboard';
import EnhancedMobileNavigation from '@/components/mobile/EnhancedMobileNavigation';
import PWAInstallPrompt from '@/components/mobile/PWAInstallPrompt';

export default function MobileDashboardPage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading...</h1>
          <p className="text-muted-foreground">Setting up your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Dashboard Content */}
      <EnhancedMobileDashboard />
      
      {/* Mobile Navigation */}
      <EnhancedMobileNavigation />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}