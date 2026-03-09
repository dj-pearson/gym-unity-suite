import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PortalThemeProvider } from '@/components/portal/PortalThemeProvider';
import { PortalAuthProvider, usePortalAuth } from '@/components/portal/PortalAuthProvider';
import { PortalShell } from '@/components/portal/PortalShell';
import { BrandedLogin } from '@/components/portal/BrandedLogin';
import { BrandedSignup } from '@/components/portal/BrandedSignup';
import { useCustomDomainContext } from '@/contexts/CustomDomainContext';
import { usePortalConfig } from '@/hooks/usePortalConfig';
import { PageLoader } from '@/components/ui/skeleton';

// Lazy-load real member page components for portal routes
const MemberDashboard = lazy(() => import('@/pages/MemberDashboard'));
const MemberClasses = lazy(() => import('@/pages/MemberClasses'));
const MemberProfilePage = lazy(() => import('@/pages/MemberProfilePage'));
const MemberNotifications = lazy(() => import('@/pages/MemberNotifications'));
const MemberWorkoutHistory = lazy(() => import('@/pages/MemberWorkoutHistory'));
const PortalCheckInPage = lazy(() => import('@/components/portal/PortalCheckInPage'));
const PortalBillingPage = lazy(() => import('@/components/portal/PortalBillingPage'));
const PortalLoyaltyPage = lazy(() => import('@/components/portal/PortalLoyaltyPage'));
const PortalReferralsPage = lazy(() => import('@/components/portal/PortalReferralsPage'));
const PortalFitnessPage = lazy(() => import('@/components/portal/PortalFitnessPage'));

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

const PortalSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader message="Loading..." />}>
    {children}
  </Suspense>
);

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

        {/* Protected portal routes - uses real member components */}
        <Route
          path="/dashboard"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><MemberDashboard /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/classes"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><MemberClasses /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/check-in"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><PortalCheckInPage /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/profile"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><MemberProfilePage /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/notifications"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><MemberNotifications /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/history"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><MemberWorkoutHistory /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/billing"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><PortalBillingPage /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/loyalty"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><PortalLoyaltyPage /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/referrals"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><PortalReferralsPage /></PortalSuspense>
              </PortalShell>
            </PortalProtected>
          }
        />
        <Route
          path="/fitness"
          element={
            <PortalProtected>
              <PortalShell organizationName={organizationName} logoUrl={logoUrl}>
                <PortalSuspense><PortalFitnessPage /></PortalSuspense>
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
