import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PortalThemeProvider } from '@/components/portal/PortalThemeProvider';
import { PortalAuthProvider, usePortalAuth } from '@/components/portal/PortalAuthProvider';
import { PortalShell } from '@/components/portal/PortalShell';
import { BrandedLogin } from '@/components/portal/BrandedLogin';
import { BrandedSignup } from '@/components/portal/BrandedSignup';
import { useCustomDomainContext } from '@/contexts/CustomDomainContext';
import { usePortalConfig } from '@/hooks/usePortalConfig';
import { PageLoader } from '@/components/ui/skeleton';

// Portal-specific page placeholders (these wrap existing member components)
function PortalDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to your member dashboard. Your upcoming classes, check-ins, and activity will appear here.</p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6 text-center">
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Check-ins This Month</p>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Upcoming Classes</p>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Loyalty Points</p>
        </div>
      </div>
    </div>
  );
}

function PortalClasses() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Classes</h1>
      <p className="text-muted-foreground">Browse and book available classes.</p>
    </div>
  );
}

function PortalCheckIn() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Check In</h1>
      <p className="text-muted-foreground">Show your member card QR code to check in.</p>
    </div>
  );
}

function PortalProfile() {
  const { profile } = usePortalAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-muted-foreground">
        Manage your account information.
      </p>
      {profile && (
        <div className="rounded-lg border p-4 space-y-2">
          <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
        </div>
      )}
    </div>
  );
}

function PortalNotifications() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="text-muted-foreground">Your notifications and alerts.</p>
    </div>
  );
}

function PortalMore() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">More</h1>
      <p className="text-muted-foreground">Additional features and settings.</p>
    </div>
  );
}

/**
 * Protected wrapper for portal routes - redirects to login if not authenticated
 */
function PortalProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = usePortalAuth();
  const location = useLocation();

  if (loading) return <PageLoader message="Loading..." />;

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface MemberPortalContentProps {
  organizationId: string;
  organizationName: string;
  logoUrl?: string | null;
}

function MemberPortalContent({ organizationId, organizationName, logoUrl }: MemberPortalContentProps) {
  const { config } = usePortalConfig(organizationId);

  return (
    <PortalAuthProvider organizationId={organizationId}>
      <Routes>
        {/* Public portal routes */}
        <Route
          path="/login"
          element={
            <BrandedLogin
              organizationName={organizationName}
              organizationId={organizationId}
              logoUrl={logoUrl}
              showSignupLink={config?.allow_self_registration ?? true}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <BrandedSignup
              organizationName={organizationName}
              organizationId={organizationId}
              logoUrl={logoUrl}
              requireApproval={config?.require_approval ?? false}
            />
          }
        />

        {/* Protected portal routes */}
        <Route
          path="/dashboard"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalDashboard />
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/classes"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalClasses />
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/check-in"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalCheckIn />
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/profile"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalProfile />
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/notifications"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalNotifications />
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/more"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalMore />
              </PortalShell>
            </PortalProtected>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/portal/login" replace />} />
        <Route path="*" element={<Navigate to="/portal/dashboard" replace />} />
      </Routes>
    </PortalAuthProvider>
  );
}

/**
 * MemberPortalPage - Entry point for the member portal.
 * Uses organization context from custom domain or defaults to auth context.
 */
export default function MemberPortalPage() {
  const customDomain = useCustomDomainContext();
  const organizationId = customDomain.organization?.id;
  const organizationName = customDomain.organization?.name || 'Member Portal';
  const logoUrl = customDomain.organization?.logo_url;

  if (customDomain.loading) {
    return <PageLoader message="Loading portal..." />;
  }

  // If no organization context found (accessed directly, not via subdomain),
  // show a generic message
  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Member Portal</h1>
          <p className="text-muted-foreground">
            Please access this portal through your gym's dedicated URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PortalThemeProvider organizationId={organizationId}>
      <MemberPortalContent
        organizationId={organizationId}
        organizationName={organizationName}
        logoUrl={logoUrl}
      />
    </PortalThemeProvider>
  );
}
