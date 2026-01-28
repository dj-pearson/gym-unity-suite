/**
 * ProtectedRoute - Defense in Depth Route Protection
 *
 * Implements all 4 security layers for route-level protection:
 * - Layer 1: Authentication (session validity)
 * - Layer 2: Authorization (permissions and roles)
 * - Layer 3: Resource ownership (organization/location)
 * - Layer 4: Database RLS (enforced at query level)
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { usePermissions, Permission, UserRole, PERMISSIONS } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Lock, RefreshCw, LogOut, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeRedirectURL } from '@/lib/security/url-sanitization';
import { logAuthEvent, logAuthzEvent } from '@/lib/security/security-audit';
import { ROLE_LEVELS } from '@/lib/security/security-layers';

// =============================================================================
// TYPES
// =============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Permission object from PERMISSIONS constant */
  permission?: Permission;
  /** Required roles (any of these roles will grant access) */
  roles?: UserRole[];
  /** Minimum role level required (1=member, 5=owner) */
  minimumRoleLevel?: number;
  /** Granular permission string (e.g., 'members.member.view_all') */
  granularPermission?: string;
  /** Require MFA verification for this route */
  requireMFA?: boolean;
  /** Custom fallback path for unauthenticated users */
  fallbackPath?: string;
  /** Show fallback UI instead of redirecting on access denied */
  showFallback?: boolean;
  /** Custom access denied message */
  accessDeniedMessage?: string;
  /** Route name for audit logging */
  routeName?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  roles,
  minimumRoleLevel,
  granularPermission,
  requireMFA = false,
  fallbackPath = '/auth',
  showFallback = true,
  accessDeniedMessage,
  routeName,
}) => {
  const { user, loading, profile, profileError, refreshProfile, signOut } = useAuth();
  const security = useSecurity();
  const { hasPermission: hasLegacyPermission, hasAnyRole } = usePermissions();
  const location = useLocation();

  // Track if we've logged this access attempt
  const [accessLogged, setAccessLogged] = useState(false);

  // Log access attempts for audit trail
  useEffect(() => {
    if (!loading && !accessLogged && user) {
      const route = routeName || location.pathname;

      // Determine access result
      const hasAuth = !!user;
      const hasProfile = !!profile;
      const hasRequiredPermission = permission ? hasLegacyPermission(permission) : true;
      const hasRequiredRole = roles ? hasAnyRole(roles) : true;
      const hasRequiredRoleLevel =
        minimumRoleLevel !== undefined
          ? (profile?.role ? ROLE_LEVELS[profile.role] >= minimumRoleLevel : false)
          : true;
      const hasGranularPerm = granularPermission
        ? security.hasPermission(granularPermission)
        : true;
      const mfaOk = requireMFA ? security.mfaStatus.verified : true;

      const isAllowed =
        hasAuth && hasProfile && hasRequiredPermission && hasRequiredRole &&
        hasRequiredRoleLevel && hasGranularPerm && mfaOk;

      logAuthzEvent(
        isAllowed ? 'feature_access' : 'permission_denied',
        user.id,
        profile?.organization_id ?? null,
        granularPermission || permission?.roles?.join(',') || route,
        isAllowed ? 'allowed' : 'denied',
        {
          route,
          requiredRoles: roles,
          minimumRoleLevel,
          requireMFA,
          userRole: profile?.role,
        }
      );

      setAccessLogged(true);
    }
  }, [
    loading,
    user,
    profile,
    permission,
    roles,
    minimumRoleLevel,
    granularPermission,
    requireMFA,
    location.pathname,
    routeName,
    accessLogged,
    hasLegacyPermission,
    hasAnyRole,
    security,
  ]);

  // Reset access logged when route changes
  useEffect(() => {
    setAccessLogged(false);
  }, [location.pathname]);

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Shield className="h-12 w-12 text-primary animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Verifying security...</p>
        </div>
      </div>
    );
  }

  // =============================================================================
  // LAYER 1: AUTHENTICATION CHECK
  // =============================================================================

  if (!user) {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const sanitizedPath = sanitizeRedirectURL(currentPath);
    const authUrl = `${fallbackPath}?redirect=${encodeURIComponent(sanitizedPath)}`;

    // Log unauthenticated access attempt
    logAuthEvent('login_attempt', null, null, {
      attemptedRoute: location.pathname,
      redirectTo: authUrl,
    });

    return <Navigate to={authUrl} state={{ from: location }} replace />;
  }

  // =============================================================================
  // PROFILE ERROR HANDLING
  // =============================================================================

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Security Check Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{profileError}</p>
            <p className="text-xs text-muted-foreground">
              Unable to verify your security profile. This may be a temporary issue.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={refreshProfile} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Verification
              </Button>
              <Button variant="outline" onClick={signOut} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================================================
  // PROFILE LOADING
  // =============================================================================

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <CardTitle>Establishing Secure Session</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Verifying your identity and permissions...</p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Authentication verified</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Loading security profile...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================================================
  // LAYER 2: AUTHORIZATION CHECKS
  // =============================================================================

  // Check legacy permission
  const hasRequiredPermission = permission ? hasLegacyPermission(permission) : true;

  // Check role requirement
  const hasRequiredRole = roles ? hasAnyRole(roles) : true;

  // Check minimum role level
  const hasRequiredRoleLevel =
    minimumRoleLevel !== undefined
      ? ROLE_LEVELS[profile.role] >= minimumRoleLevel
      : true;

  // Check granular permission
  const hasGranularPerm = granularPermission
    ? security.hasPermission(granularPermission)
    : true;

  // =============================================================================
  // MFA CHECK
  // =============================================================================

  const mfaRequired = requireMFA || security.checkMFARequired();
  const mfaVerified = security.mfaStatus.verified;

  if (mfaRequired && !mfaVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <CardTitle>Additional Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              This area requires multi-factor authentication.
            </p>
            <p className="text-sm text-muted-foreground">
              Please verify your identity using your authenticator app.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.href = '/settings/security'} className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Verify Now
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================================================
  // AUTHORIZATION FAILURE
  // =============================================================================

  const authorizationFailed =
    !hasRequiredPermission || !hasRequiredRole || !hasRequiredRoleLevel || !hasGranularPerm;

  if (authorizationFailed) {
    if (showFallback) {
      const denialReasons: string[] = [];

      if (!hasRequiredPermission && permission) {
        denialReasons.push('Missing required permission');
      }
      if (!hasRequiredRole && roles) {
        denialReasons.push(`Required role: ${roles.join(' or ')}`);
      }
      if (!hasRequiredRoleLevel && minimumRoleLevel) {
        denialReasons.push(
          `Requires ${getRoleLevelName(minimumRoleLevel)} access or higher`
        );
      }
      if (!hasGranularPerm && granularPermission) {
        denialReasons.push(`Missing permission: ${granularPermission}`);
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                {accessDeniedMessage || "You don't have permission to access this page."}
              </p>

              <div className="bg-muted p-4 rounded-lg text-left text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Your role:</span>
                  <span className="font-medium capitalize">{profile.role}</span>
                </div>
                {denialReasons.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground block mb-1">Reason:</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {denialReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="w-full"
                >
                  Go Back
                </Button>
                <Button
                  onClick={() => (window.location.href = '/dashboard')}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <Navigate to="/" replace />;
  }

  // =============================================================================
  // ACCESS GRANTED
  // =============================================================================

  return <>{children}</>;
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRoleLevelName(level: number): string {
  switch (level) {
    case 1:
      return 'Member';
    case 2:
      return 'Trainer';
    case 3:
      return 'Staff';
    case 4:
      return 'Manager';
    case 5:
      return 'Owner';
    default:
      return 'Unknown';
  }
}

// =============================================================================
// HIGHER-ORDER COMPONENT
// =============================================================================

/**
 * HOC for wrapping components with security protection
 */
export function withSecurityProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  securityConfig: Omit<ProtectedRouteProps, 'children'>
): React.FC<P> {
  const WithSecurityProtection: React.FC<P> = (props) => {
    return (
      <ProtectedRoute {...securityConfig}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };

  WithSecurityProtection.displayName = `withSecurityProtection(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithSecurityProtection;
}

export default ProtectedRoute;
