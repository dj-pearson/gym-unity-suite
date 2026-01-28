/**
 * SecurityContext - Unified Security State Management
 *
 * Provides centralized security state and validation across all 4 security layers:
 * - Layer 1: Authentication state
 * - Layer 2: Authorization/permissions
 * - Layer 3: Resource ownership validation
 * - Layer 4: Database RLS (enforced at query level)
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/hooks/usePermissions';
import {
  SecurityState,
  SecurityCheckResult,
  SecurityLayer,
  ResourceOwnershipOptions,
  validateSession,
  hasMinimumRoleLevel,
  hasGranularPermission,
  buildPermissionsForRole,
  validateResourceOwnership,
  createTenantFilter,
  createOwnershipFilter,
  executeSecurityLayers,
  getSecurityDenialMessage,
  ROLE_LEVELS,
} from '@/lib/security/security-layers';
import {
  logAuthEvent,
  logAuthzEvent,
  logResourceEvent,
  logSecurityIncident,
} from '@/lib/security/security-audit';

// =============================================================================
// TYPES
// =============================================================================

interface MFAStatus {
  required: boolean;
  verified: boolean;
  lastVerified: number | null;
}

interface SecurityContextValue {
  // Security State
  state: SecurityState;
  mfaStatus: MFAStatus;

  // Layer 1: Authentication
  isAuthenticated: boolean;
  isSessionValid: boolean;
  requireReauth: (sensitiveOperation?: string) => boolean;

  // Layer 2: Authorization
  hasPermission: (permission: string) => boolean;
  hasMinimumRole: (minimumLevel: number) => boolean;
  checkPermission: (permission: string, logAccess?: boolean) => Promise<boolean>;

  // Layer 3: Resource Ownership
  validateOwnership: (options: ResourceOwnershipOptions) => SecurityCheckResult;
  getTenantFilter: (scope?: 'organization' | 'location') => Record<string, string>;
  getOwnershipFilter: (ownerField?: string) => Record<string, string>;

  // Multi-Layer Validation
  validateAccess: (
    permission: string,
    resourceOptions?: ResourceOwnershipOptions
  ) => Promise<SecurityCheckResult>;

  // Security Events
  logSecurityEvent: (
    action: string,
    resourceType?: string,
    resourceId?: string,
    result?: 'allowed' | 'denied',
    reason?: string
  ) => Promise<void>;

  // MFA Management
  setMFAVerified: (verified: boolean) => void;
  checkMFARequired: () => boolean;

  // Utilities
  getDenialMessage: (result: SecurityCheckResult) => string;
  refreshSecurityState: () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { user, profile, organization, session } = useAuth();

  // MFA state
  const [mfaStatus, setMFAStatus] = useState<MFAStatus>({
    required: false,
    verified: false,
    lastVerified: null,
  });

  // Last security state refresh
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Compute security state
  const state: SecurityState = useMemo(() => {
    const role = profile?.role as UserRole | null;
    const roleLevel = role ? ROLE_LEVELS[role] : 0;

    // Build permissions for the user's role
    const permissions = role ? buildPermissionsForRole(role) : new Set<string>();

    // MFA is required for admin roles
    const mfaRequired = role === 'owner' || role === 'manager';

    return {
      isAuthenticated: !!user,
      sessionValid: !!session && !!user,
      mfaVerified: mfaStatus.verified,
      mfaRequired,
      userId: user?.id ?? null,
      organizationId: profile?.organization_id ?? null,
      locationId: profile?.location_id ?? null,
      role,
      roleLevel,
      permissions,
      lastValidated: lastRefresh,
    };
  }, [user, profile, session, mfaStatus.verified, lastRefresh]);

  // Update MFA required status when profile changes
  useEffect(() => {
    if (profile?.role) {
      const mfaRequired = profile.role === 'owner' || profile.role === 'manager';
      setMFAStatus(prev => ({
        ...prev,
        required: mfaRequired,
      }));
    }
  }, [profile?.role]);

  // =============================================================================
  // LAYER 1: AUTHENTICATION
  // =============================================================================

  const isAuthenticated = useMemo(() => state.isAuthenticated, [state.isAuthenticated]);
  const isSessionValid = useMemo(() => state.sessionValid, [state.sessionValid]);

  const requireReauth = useCallback(
    (sensitiveOperation?: string): boolean => {
      if (!state.isAuthenticated) return true;

      // For sensitive operations, require recent authentication
      const reauthThreshold = 15 * 60 * 1000; // 15 minutes
      const lastAuthTime = session?.user?.last_sign_in_at
        ? new Date(session.user.last_sign_in_at).getTime()
        : 0;

      const needsReauth = Date.now() - lastAuthTime > reauthThreshold;

      if (needsReauth && sensitiveOperation) {
        logSecurityIncident(
          'suspicious_activity',
          state.userId,
          state.organizationId,
          `Re-authentication required for: ${sensitiveOperation}`,
          'medium'
        );
      }

      return needsReauth;
    },
    [state.isAuthenticated, state.userId, state.organizationId, session]
  );

  // =============================================================================
  // LAYER 2: AUTHORIZATION
  // =============================================================================

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return hasGranularPermission(state.permissions, permission, state.role);
    },
    [state.permissions, state.role]
  );

  const hasMinimumRole = useCallback(
    (minimumLevel: number): boolean => {
      return hasMinimumRoleLevel(state.role, minimumLevel);
    },
    [state.role]
  );

  const checkPermission = useCallback(
    async (permission: string, logAccess: boolean = true): Promise<boolean> => {
      const hasAccess = hasGranularPermission(state.permissions, permission, state.role);

      if (logAccess) {
        await logAuthzEvent(
          hasAccess ? 'permission_check' : 'permission_denied',
          state.userId,
          state.organizationId,
          permission,
          hasAccess ? 'allowed' : 'denied'
        );
      }

      return hasAccess;
    },
    [state.permissions, state.role, state.userId, state.organizationId]
  );

  // =============================================================================
  // LAYER 3: RESOURCE OWNERSHIP
  // =============================================================================

  const validateOwnership = useCallback(
    (options: ResourceOwnershipOptions): SecurityCheckResult => {
      if (!state.userId || !state.organizationId) {
        return {
          passed: false,
          layer: 'resource_ownership',
          reason: 'User not authenticated',
          timestamp: Date.now(),
        };
      }

      return validateResourceOwnership(
        options,
        state.userId,
        state.organizationId,
        state.locationId
      );
    },
    [state.userId, state.organizationId, state.locationId]
  );

  const getTenantFilter = useCallback(
    (scope: 'organization' | 'location' = 'organization'): Record<string, string> => {
      if (!state.organizationId) {
        throw new Error('No organization context available');
      }
      return createTenantFilter(state.organizationId, state.locationId, scope);
    },
    [state.organizationId, state.locationId]
  );

  const getOwnershipFilter = useCallback(
    (ownerField: string = 'created_by'): Record<string, string> => {
      if (!state.userId) {
        throw new Error('No user context available');
      }
      return createOwnershipFilter(state.userId, ownerField);
    },
    [state.userId]
  );

  // =============================================================================
  // MULTI-LAYER VALIDATION
  // =============================================================================

  const validateAccess = useCallback(
    async (
      permission: string,
      resourceOptions?: ResourceOwnershipOptions
    ): Promise<SecurityCheckResult> => {
      return executeSecurityLayers([
        // Layer 1: Authentication
        {
          layer: 'authentication',
          check: () => state.isAuthenticated && state.sessionValid,
          context: { userId: state.userId },
        },
        // Layer 2: Authorization
        {
          layer: 'authorization',
          check: () => hasGranularPermission(state.permissions, permission, state.role),
          context: { permission, role: state.role },
        },
        // Layer 3: Resource Ownership (if resource options provided)
        ...(resourceOptions
          ? [
              {
                layer: 'resource_ownership' as SecurityLayer,
                check: () => {
                  if (!state.userId || !state.organizationId) return false;
                  const result = validateResourceOwnership(
                    resourceOptions,
                    state.userId,
                    state.organizationId,
                    state.locationId
                  );
                  return result.passed;
                },
                context: resourceOptions as Record<string, unknown>,
              },
            ]
          : []),
      ]);
    },
    [state]
  );

  // =============================================================================
  // SECURITY EVENTS
  // =============================================================================

  const logSecurityEventHandler = useCallback(
    async (
      action: string,
      resourceType?: string,
      resourceId?: string,
      result: 'allowed' | 'denied' = 'allowed',
      reason?: string
    ): Promise<void> => {
      await logResourceEvent(
        action as 'resource_access' | 'resource_create' | 'resource_update' | 'resource_delete' | 'ownership_violation' | 'tenant_violation',
        state.userId,
        state.organizationId,
        resourceType || 'unknown',
        resourceId || 'unknown',
        result,
        reason
      );
    },
    [state.userId, state.organizationId]
  );

  // =============================================================================
  // MFA MANAGEMENT
  // =============================================================================

  const setMFAVerified = useCallback((verified: boolean): void => {
    setMFAStatus(prev => ({
      ...prev,
      verified,
      lastVerified: verified ? Date.now() : prev.lastVerified,
    }));

    if (verified) {
      logAuthEvent('mfa_success', state.userId, state.organizationId);
    }
  }, [state.userId, state.organizationId]);

  const checkMFARequired = useCallback((): boolean => {
    return mfaStatus.required && !mfaStatus.verified;
  }, [mfaStatus.required, mfaStatus.verified]);

  // =============================================================================
  // UTILITIES
  // =============================================================================

  const getDenialMessage = useCallback((result: SecurityCheckResult): string => {
    return getSecurityDenialMessage(result);
  }, []);

  const refreshSecurityState = useCallback((): void => {
    setLastRefresh(Date.now());
  }, []);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const value = useMemo<SecurityContextValue>(
    () => ({
      // State
      state,
      mfaStatus,

      // Layer 1
      isAuthenticated,
      isSessionValid,
      requireReauth,

      // Layer 2
      hasPermission,
      hasMinimumRole,
      checkPermission,

      // Layer 3
      validateOwnership,
      getTenantFilter,
      getOwnershipFilter,

      // Multi-Layer
      validateAccess,

      // Security Events
      logSecurityEvent: logSecurityEventHandler,

      // MFA
      setMFAVerified,
      checkMFARequired,

      // Utilities
      getDenialMessage,
      refreshSecurityState,
    }),
    [
      state,
      mfaStatus,
      isAuthenticated,
      isSessionValid,
      requireReauth,
      hasPermission,
      hasMinimumRole,
      checkPermission,
      validateOwnership,
      getTenantFilter,
      getOwnershipFilter,
      validateAccess,
      logSecurityEventHandler,
      setMFAVerified,
      checkMFARequired,
      getDenialMessage,
      refreshSecurityState,
    ]
  );

  return (
    <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>
  );
};

// =============================================================================
// HOOK
// =============================================================================

export const useSecurity = (): SecurityContextValue => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export default SecurityContext;
