/**
 * useSecureQuery Hook
 *
 * Provides security-enforced data access using the SecurityContext.
 * Automatically applies tenant filtering and ownership checks based
 * on the current user's security context.
 */

import { useMemo, useCallback } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import { createSecureQuery, type SecureQueryOptions } from '@/lib/security/secure-query';
import type { SecurityCheckResult } from '@/lib/security/security-layers';

// =============================================================================
// TYPES
// =============================================================================

export interface UseSecureQueryOptions {
  /** Default resource type for all queries */
  defaultResourceType?: string;
  /** Whether to check ownership by default */
  defaultCheckOwnership?: boolean;
  /** Default owner field name */
  defaultOwnerField?: string;
  /** Whether to scope by location by default */
  defaultLocationScoped?: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for security-enforced data access
 *
 * @example
 * ```tsx
 * const { secureSelect, secureInsert, isReady } = useSecureQuery({
 *   defaultResourceType: 'member',
 * });
 *
 * // Fetch data with automatic tenant filtering
 * const { data, error } = await secureSelect<Member>('profiles', {
 *   filters: { role: 'member' },
 * });
 * ```
 */
export function useSecureQuery(options: UseSecureQueryOptions = {}) {
  const security = useSecurity();
  const { state } = security;

  // Create the secure query builder with current security context
  const queryBuilder = useMemo(() => {
    if (!state.userId || !state.organizationId) {
      return null;
    }

    return createSecureQuery({
      userId: state.userId,
      organizationId: state.organizationId,
      locationId: state.locationId,
      role: state.role || 'member',
    });
  }, [state.userId, state.organizationId, state.locationId, state.role]);

  // Check if the query builder is ready to use
  const isReady = useMemo(
    () => !!queryBuilder && !!state.userId && !!state.organizationId,
    [queryBuilder, state.userId, state.organizationId]
  );

  // Get security context summary
  const securityContext = useMemo(
    () => ({
      userId: state.userId,
      organizationId: state.organizationId,
      locationId: state.locationId,
      role: state.role,
      isAuthenticated: security.isAuthenticated,
    }),
    [state, security.isAuthenticated]
  );

  /**
   * Secure select with default options
   */
  const secureSelect = useCallback(
    async <T>(
      table: string,
      queryOptions?: Partial<SecureQueryOptions> & {
        columns?: string;
        filters?: Record<string, unknown>;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        offset?: number;
      }
    ) => {
      if (!queryBuilder) {
        return {
          data: null,
          error: new Error('Security context not available'),
          securityResult: {
            passed: false,
            layer: 'authentication' as const,
            reason: 'User not authenticated or organization not available',
            timestamp: Date.now(),
          },
        };
      }

      const mergedOptions = {
        resourceType: options.defaultResourceType || table,
        action: 'select' as const,
        checkOwnership: options.defaultCheckOwnership,
        ownerField: options.defaultOwnerField || 'created_by',
        locationScoped: options.defaultLocationScoped,
        ...queryOptions,
      };

      return queryBuilder.secureSelect<T>(table, mergedOptions);
    },
    [queryBuilder, options]
  );

  /**
   * Secure select one row
   */
  const secureSelectOne = useCallback(
    async <T>(
      table: string,
      id: string,
      queryOptions?: Partial<SecureQueryOptions> & {
        columns?: string;
        idField?: string;
      }
    ) => {
      if (!queryBuilder) {
        return {
          data: null,
          error: new Error('Security context not available'),
          securityResult: {
            passed: false,
            layer: 'authentication' as const,
            reason: 'User not authenticated or organization not available',
            timestamp: Date.now(),
          },
        };
      }

      const mergedOptions = {
        resourceType: options.defaultResourceType || table,
        action: 'select' as const,
        checkOwnership: options.defaultCheckOwnership,
        ownerField: options.defaultOwnerField || 'created_by',
        ...queryOptions,
      };

      return queryBuilder.secureSelectOne<T>(table, id, mergedOptions);
    },
    [queryBuilder, options]
  );

  /**
   * Secure insert
   */
  const secureInsert = useCallback(
    async <T>(
      table: string,
      data: Record<string, unknown>,
      queryOptions?: Partial<SecureQueryOptions>
    ) => {
      if (!queryBuilder) {
        return {
          data: null,
          error: new Error('Security context not available'),
          securityResult: {
            passed: false,
            layer: 'authentication' as const,
            reason: 'User not authenticated or organization not available',
            timestamp: Date.now(),
          },
        };
      }

      const mergedOptions = {
        resourceType: options.defaultResourceType || table,
        action: 'insert' as const,
        locationScoped: options.defaultLocationScoped,
        ...queryOptions,
      };

      return queryBuilder.secureInsert<T>(table, data, mergedOptions);
    },
    [queryBuilder, options]
  );

  /**
   * Secure update
   */
  const secureUpdate = useCallback(
    async <T>(
      table: string,
      id: string,
      data: Record<string, unknown>,
      queryOptions?: Partial<SecureQueryOptions> & { idField?: string }
    ) => {
      if (!queryBuilder) {
        return {
          data: null,
          error: new Error('Security context not available'),
          securityResult: {
            passed: false,
            layer: 'authentication' as const,
            reason: 'User not authenticated or organization not available',
            timestamp: Date.now(),
          },
        };
      }

      const mergedOptions = {
        resourceType: options.defaultResourceType || table,
        action: 'update' as const,
        checkOwnership: options.defaultCheckOwnership,
        ownerField: options.defaultOwnerField || 'created_by',
        ...queryOptions,
      };

      return queryBuilder.secureUpdate<T>(table, id, data, mergedOptions);
    },
    [queryBuilder, options]
  );

  /**
   * Secure delete
   */
  const secureDelete = useCallback(
    async (
      table: string,
      id: string,
      queryOptions?: Partial<SecureQueryOptions> & { idField?: string }
    ) => {
      if (!queryBuilder) {
        return {
          data: null,
          error: new Error('Security context not available'),
          securityResult: {
            passed: false,
            layer: 'authentication' as const,
            reason: 'User not authenticated or organization not available',
            timestamp: Date.now(),
          },
        };
      }

      const mergedOptions = {
        resourceType: options.defaultResourceType || table,
        action: 'delete' as const,
        checkOwnership: options.defaultCheckOwnership,
        ownerField: options.defaultOwnerField || 'created_by',
        ...queryOptions,
      };

      return queryBuilder.secureDelete(table, id, mergedOptions);
    },
    [queryBuilder, options]
  );

  /**
   * Check if user has permission for a specific action
   */
  const canPerformAction = useCallback(
    (permission: string): boolean => {
      return security.hasPermission(permission);
    },
    [security]
  );

  /**
   * Validate access before performing an action
   */
  const validateAccess = useCallback(
    async (permission: string): Promise<SecurityCheckResult> => {
      return security.validateAccess(permission);
    },
    [security]
  );

  return {
    // Query methods
    secureSelect,
    secureSelectOne,
    secureInsert,
    secureUpdate,
    secureDelete,

    // Security helpers
    canPerformAction,
    validateAccess,

    // State
    isReady,
    securityContext,

    // Access to underlying security utilities
    getTenantFilter: security.getTenantFilter,
    getOwnershipFilter: security.getOwnershipFilter,
  };
}

export default useSecureQuery;
