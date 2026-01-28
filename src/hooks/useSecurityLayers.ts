/**
 * useSecurityLayers Hook
 *
 * Provides component-level security enforcement with all 4 security layers.
 * Use this hook to protect individual components, actions, or data access.
 */

import { useCallback, useMemo, useState } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import {
  SecurityCheckResult,
  SecurityLayer,
  ResourceOwnershipOptions,
  executeSecurityLayers,
  parsePermission,
} from '@/lib/security/security-layers';
import { logResourceEvent, logSecurityIncident } from '@/lib/security/security-audit';

// =============================================================================
// TYPES
// =============================================================================

export interface SecurityLayerConfig {
  /** Required permission (e.g., 'members.member.view_all') */
  permission?: string;
  /** Minimum role level required (1-5) */
  minimumRoleLevel?: number;
  /** Require MFA verification for this action */
  requireMFA?: boolean;
  /** Resource ownership options for Layer 3 validation */
  resourceOptions?: ResourceOwnershipOptions;
  /** Custom check function for additional validation */
  customCheck?: () => boolean | Promise<boolean>;
  /** Log access attempts */
  logAccess?: boolean;
  /** Resource type for logging */
  resourceType?: string;
  /** Resource ID for logging */
  resourceId?: string;
}

export interface UseSecurityLayersResult {
  /** Perform a security check with the given config */
  checkAccess: (config?: SecurityLayerConfig) => Promise<SecurityCheckResult>;
  /** Quick permission check without full layer validation */
  hasPermission: (permission: string) => boolean;
  /** Check if user meets minimum role level */
  hasMinimumRole: (level: number) => boolean;
  /** Validate resource ownership */
  validateOwnership: (options: ResourceOwnershipOptions) => SecurityCheckResult;
  /** Get tenant-scoped query filter */
  getTenantFilter: (scope?: 'organization' | 'location') => Record<string, string>;
  /** Get ownership filter for "own" scope queries */
  getOwnershipFilter: (ownerField?: string) => Record<string, string>;
  /** Wrap an async function with security validation */
  withSecurityCheck: <T>(
    fn: () => Promise<T>,
    config: SecurityLayerConfig
  ) => Promise<{ data?: T; error?: SecurityCheckResult }>;
  /** Current security state summary */
  securityState: {
    isAuthenticated: boolean;
    isSessionValid: boolean;
    mfaVerified: boolean;
    mfaRequired: boolean;
    userId: string | null;
    organizationId: string | null;
    role: string | null;
    roleLevel: number;
  };
  /** Last security check result */
  lastCheckResult: SecurityCheckResult | null;
}

// =============================================================================
// HOOK
// =============================================================================

export function useSecurityLayers(
  defaultConfig?: SecurityLayerConfig
): UseSecurityLayersResult {
  const security = useSecurity();
  const [lastCheckResult, setLastCheckResult] = useState<SecurityCheckResult | null>(null);

  // Security state summary
  const securityState = useMemo(
    () => ({
      isAuthenticated: security.isAuthenticated,
      isSessionValid: security.isSessionValid,
      mfaVerified: security.mfaStatus.verified,
      mfaRequired: security.mfaStatus.required,
      userId: security.state.userId,
      organizationId: security.state.organizationId,
      role: security.state.role,
      roleLevel: security.state.roleLevel,
    }),
    [security]
  );

  /**
   * Perform a full security check across all applicable layers
   */
  const checkAccess = useCallback(
    async (config?: SecurityLayerConfig): Promise<SecurityCheckResult> => {
      const mergedConfig = { ...defaultConfig, ...config };
      const {
        permission,
        minimumRoleLevel,
        requireMFA,
        resourceOptions,
        customCheck,
        logAccess = true,
        resourceType,
        resourceId,
      } = mergedConfig;

      const checks: Array<{
        layer: SecurityLayer;
        check: () => boolean | Promise<boolean>;
        context?: Record<string, unknown>;
      }> = [];

      // Layer 1: Authentication
      checks.push({
        layer: 'authentication',
        check: () => security.isAuthenticated && security.isSessionValid,
        context: { userId: security.state.userId },
      });

      // Layer 1b: MFA check if required
      if (requireMFA || security.checkMFARequired()) {
        checks.push({
          layer: 'authentication',
          check: () => security.mfaStatus.verified,
          context: { mfaRequired: true },
        });
      }

      // Layer 2: Authorization - Permission check
      if (permission) {
        checks.push({
          layer: 'authorization',
          check: () => security.hasPermission(permission),
          context: { permission },
        });
      }

      // Layer 2b: Role level check
      if (minimumRoleLevel !== undefined) {
        checks.push({
          layer: 'authorization',
          check: () => security.hasMinimumRole(minimumRoleLevel),
          context: { minimumRoleLevel, currentLevel: security.state.roleLevel },
        });
      }

      // Layer 3: Resource Ownership
      if (resourceOptions) {
        checks.push({
          layer: 'resource_ownership',
          check: () => {
            const result = security.validateOwnership(resourceOptions);
            return result.passed;
          },
          context: resourceOptions as Record<string, unknown>,
        });
      }

      // Custom check (optional)
      if (customCheck) {
        checks.push({
          layer: 'authorization',
          check: customCheck,
          context: { customCheck: true },
        });
      }

      // Execute all checks
      const result = await executeSecurityLayers(checks);
      setLastCheckResult(result);

      // Log the access attempt
      if (logAccess) {
        await logResourceEvent(
          result.passed ? 'resource_access' : 'permission_denied' as 'resource_access',
          security.state.userId,
          security.state.organizationId,
          resourceType || 'unknown',
          resourceId || 'unknown',
          result.passed ? 'allowed' : 'denied',
          result.reason
        );
      }

      return result;
    },
    [security, defaultConfig]
  );

  /**
   * Quick permission check
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return security.hasPermission(permission);
    },
    [security]
  );

  /**
   * Check minimum role level
   */
  const hasMinimumRole = useCallback(
    (level: number): boolean => {
      return security.hasMinimumRole(level);
    },
    [security]
  );

  /**
   * Validate resource ownership
   */
  const validateOwnership = useCallback(
    (options: ResourceOwnershipOptions): SecurityCheckResult => {
      return security.validateOwnership(options);
    },
    [security]
  );

  /**
   * Get tenant filter for queries
   */
  const getTenantFilter = useCallback(
    (scope?: 'organization' | 'location'): Record<string, string> => {
      return security.getTenantFilter(scope);
    },
    [security]
  );

  /**
   * Get ownership filter for "own" scope queries
   */
  const getOwnershipFilter = useCallback(
    (ownerField?: string): Record<string, string> => {
      return security.getOwnershipFilter(ownerField);
    },
    [security]
  );

  /**
   * Wrap a function with security validation
   */
  const withSecurityCheck = useCallback(
    async <T>(
      fn: () => Promise<T>,
      config: SecurityLayerConfig
    ): Promise<{ data?: T; error?: SecurityCheckResult }> => {
      const result = await checkAccess(config);

      if (!result.passed) {
        return { error: result };
      }

      try {
        const data = await fn();
        return { data };
      } catch (error) {
        // Log any errors during the secured operation
        await logSecurityIncident(
          'suspicious_activity',
          security.state.userId,
          security.state.organizationId,
          `Error during secured operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'medium'
        );
        throw error;
      }
    },
    [checkAccess, security.state.userId, security.state.organizationId]
  );

  return {
    checkAccess,
    hasPermission,
    hasMinimumRole,
    validateOwnership,
    getTenantFilter,
    getOwnershipFilter,
    withSecurityCheck,
    securityState,
    lastCheckResult,
  };
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook for resource-specific security checks
 */
export function useResourceSecurity(
  resourceType: string,
  resourceId?: string
) {
  const security = useSecurityLayers({
    resourceType,
    resourceId,
    logAccess: true,
  });

  const checkResourceAccess = useCallback(
    async (
      action: 'view' | 'create' | 'edit' | 'delete',
      scope: 'own' | 'all' = 'all',
      resourceOwnerId?: string,
      resourceOrganizationId?: string
    ) => {
      const permission = `${resourceType}.${action}_${scope}`;

      return security.checkAccess({
        permission,
        resourceOptions: resourceId
          ? {
              resourceId,
              resourceType,
              ownerId: resourceOwnerId,
              organizationId:
                resourceOrganizationId || security.securityState.organizationId || '',
              checkOwnership: scope === 'own',
            }
          : undefined,
      });
    },
    [resourceType, resourceId, security]
  );

  return {
    ...security,
    checkResourceAccess,
  };
}

/**
 * Hook for checking if current user can perform action on a resource
 */
export function useCanAccess(
  permission: string,
  resourceOptions?: ResourceOwnershipOptions
) {
  const { checkAccess, hasPermission } = useSecurityLayers();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    setError(null);

    try {
      const result = await checkAccess({
        permission,
        resourceOptions,
        logAccess: false, // Don't log access checks
      });

      setCanAccess(result.passed);
      if (!result.passed) {
        setError(result.reason || 'Access denied');
      }
    } catch (err) {
      setCanAccess(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setChecking(false);
    }
  }, [checkAccess, permission, resourceOptions]);

  // Quick synchronous check
  const quickCheck = useMemo(() => hasPermission(permission), [hasPermission, permission]);

  return {
    canAccess,
    checking,
    error,
    check,
    quickCheck,
  };
}

export default useSecurityLayers;
