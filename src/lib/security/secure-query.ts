/**
 * Secure Query Helpers
 *
 * Provides type-safe, security-enforced query builders for Supabase.
 * These helpers ensure consistent tenant filtering (Layer 3) and
 * work in conjunction with RLS policies (Layer 4).
 */

import { supabase } from '@/integrations/supabase/client';
import { logResourceEvent, logSecurityIncident } from './security-audit';
import type { SecurityCheckResult } from './security-layers';

// =============================================================================
// TYPES
// =============================================================================

export interface SecureQueryContext {
  userId: string;
  organizationId: string;
  locationId?: string | null;
  role: string;
}

export interface SecureQueryOptions {
  /** Resource type for logging */
  resourceType: string;
  /** Specific action being performed */
  action: 'select' | 'insert' | 'update' | 'delete';
  /** Whether to check ownership (for 'own' scope access) */
  checkOwnership?: boolean;
  /** Owner field name in the table */
  ownerField?: string;
  /** Whether to scope by location */
  locationScoped?: boolean;
  /** Skip audit logging */
  skipAuditLog?: boolean;
}

export interface SecureQueryResult<T> {
  data: T | null;
  error: Error | null;
  securityResult: SecurityCheckResult;
}

// =============================================================================
// SECURE QUERY BUILDER
// =============================================================================

/**
 * Creates a secure query builder that enforces tenant isolation
 */
export function createSecureQuery(context: SecureQueryContext) {
  const { userId, organizationId, locationId, role } = context;

  /**
   * Validates the query context before executing
   */
  function validateContext(): SecurityCheckResult {
    if (!userId) {
      return {
        passed: false,
        layer: 'authentication',
        reason: 'User not authenticated',
        timestamp: Date.now(),
      };
    }

    if (!organizationId) {
      return {
        passed: false,
        layer: 'resource_ownership',
        reason: 'Organization context not available',
        timestamp: Date.now(),
      };
    }

    return {
      passed: true,
      layer: 'resource_ownership',
      timestamp: Date.now(),
    };
  }

  /**
   * Select query with tenant filtering
   */
  async function secureSelect<T>(
    table: string,
    options: SecureQueryOptions & {
      columns?: string;
      filters?: Record<string, unknown>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    }
  ): Promise<SecureQueryResult<T[]>> {
    const validation = validateContext();
    if (!validation.passed) {
      return { data: null, error: new Error(validation.reason), securityResult: validation };
    }

    try {
      let query = supabase
        .from(table)
        .select(options.columns || '*')
        .eq('organization_id', organizationId);

      // Apply location scoping if required
      if (options.locationScoped && locationId) {
        query = query.eq('location_id', locationId);
      }

      // Apply ownership check if required
      if (options.checkOwnership && options.ownerField) {
        query = query.eq(options.ownerField, userId);
      }

      // Apply additional filters
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error } = await query;

      // Log the access
      if (!options.skipAuditLog) {
        await logResourceEvent(
          'resource_access',
          userId,
          organizationId,
          options.resourceType,
          table,
          error ? 'denied' : 'allowed',
          error?.message
        );
      }

      if (error) {
        return {
          data: null,
          error: new Error(error.message),
          securityResult: {
            passed: false,
            layer: 'database_rls',
            reason: error.message,
            timestamp: Date.now(),
          },
        };
      }

      return {
        data: data as T[],
        error: null,
        securityResult: {
          passed: true,
          layer: 'database_rls',
          timestamp: Date.now(),
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      await logSecurityIncident(
        'suspicious_activity',
        userId,
        organizationId,
        `Query error on ${table}: ${error.message}`,
        'high'
      );
      return {
        data: null,
        error,
        securityResult: {
          passed: false,
          layer: 'database_rls',
          reason: error.message,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Single row select with tenant filtering
   */
  async function secureSelectOne<T>(
    table: string,
    id: string,
    options: SecureQueryOptions & {
      columns?: string;
      idField?: string;
    }
  ): Promise<SecureQueryResult<T>> {
    const validation = validateContext();
    if (!validation.passed) {
      return { data: null, error: new Error(validation.reason), securityResult: validation };
    }

    const idField = options.idField || 'id';

    try {
      let query = supabase
        .from(table)
        .select(options.columns || '*')
        .eq('organization_id', organizationId)
        .eq(idField, id);

      // Apply ownership check if required
      if (options.checkOwnership && options.ownerField) {
        query = query.eq(options.ownerField, userId);
      }

      const { data, error } = await query.single();

      // Log the access
      if (!options.skipAuditLog) {
        await logResourceEvent(
          'resource_access',
          userId,
          organizationId,
          options.resourceType,
          id,
          error ? 'denied' : 'allowed',
          error?.message
        );
      }

      if (error) {
        return {
          data: null,
          error: new Error(error.message),
          securityResult: {
            passed: false,
            layer: 'database_rls',
            reason: error.message,
            timestamp: Date.now(),
          },
        };
      }

      return {
        data: data as T,
        error: null,
        securityResult: {
          passed: true,
          layer: 'database_rls',
          timestamp: Date.now(),
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      return {
        data: null,
        error,
        securityResult: {
          passed: false,
          layer: 'database_rls',
          reason: error.message,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Insert with tenant context
   */
  async function secureInsert<T>(
    table: string,
    data: Record<string, unknown>,
    options: SecureQueryOptions
  ): Promise<SecureQueryResult<T>> {
    const validation = validateContext();
    if (!validation.passed) {
      return { data: null, error: new Error(validation.reason), securityResult: validation };
    }

    try {
      // Ensure organization_id is set
      const insertData = {
        ...data,
        organization_id: organizationId,
        created_by: userId,
      };

      // Add location if applicable
      if (options.locationScoped && locationId) {
        insertData.location_id = locationId;
      }

      const { data: result, error } = await supabase
        .from(table)
        .insert(insertData)
        .select()
        .single();

      // Log the action
      if (!options.skipAuditLog) {
        await logResourceEvent(
          'resource_create',
          userId,
          organizationId,
          options.resourceType,
          (result as Record<string, unknown>)?.id as string || 'unknown',
          error ? 'denied' : 'allowed',
          error?.message
        );
      }

      if (error) {
        return {
          data: null,
          error: new Error(error.message),
          securityResult: {
            passed: false,
            layer: 'database_rls',
            reason: error.message,
            timestamp: Date.now(),
          },
        };
      }

      return {
        data: result as T,
        error: null,
        securityResult: {
          passed: true,
          layer: 'database_rls',
          timestamp: Date.now(),
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      await logSecurityIncident(
        'suspicious_activity',
        userId,
        organizationId,
        `Insert error on ${table}: ${error.message}`,
        'high'
      );
      return {
        data: null,
        error,
        securityResult: {
          passed: false,
          layer: 'database_rls',
          reason: error.message,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Update with tenant and ownership checks
   */
  async function secureUpdate<T>(
    table: string,
    id: string,
    data: Record<string, unknown>,
    options: SecureQueryOptions & { idField?: string }
  ): Promise<SecureQueryResult<T>> {
    const validation = validateContext();
    if (!validation.passed) {
      return { data: null, error: new Error(validation.reason), securityResult: validation };
    }

    const idField = options.idField || 'id';

    try {
      // Remove fields that shouldn't be updated
      const { organization_id, created_by, created_at, id: _id, ...updateData } = data;

      // Add updated_at timestamp
      const finalData = {
        ...updateData,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      };

      let query = supabase
        .from(table)
        .update(finalData)
        .eq('organization_id', organizationId)
        .eq(idField, id);

      // Apply ownership check if required
      if (options.checkOwnership && options.ownerField) {
        query = query.eq(options.ownerField, userId);
      }

      const { data: result, error } = await query.select().single();

      // Log the action
      if (!options.skipAuditLog) {
        await logResourceEvent(
          'resource_update',
          userId,
          organizationId,
          options.resourceType,
          id,
          error ? 'denied' : 'allowed',
          error?.message,
          { updatedFields: Object.keys(updateData) }
        );
      }

      if (error) {
        return {
          data: null,
          error: new Error(error.message),
          securityResult: {
            passed: false,
            layer: 'database_rls',
            reason: error.message,
            timestamp: Date.now(),
          },
        };
      }

      return {
        data: result as T,
        error: null,
        securityResult: {
          passed: true,
          layer: 'database_rls',
          timestamp: Date.now(),
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      await logSecurityIncident(
        'suspicious_activity',
        userId,
        organizationId,
        `Update error on ${table}: ${error.message}`,
        'high'
      );
      return {
        data: null,
        error,
        securityResult: {
          passed: false,
          layer: 'database_rls',
          reason: error.message,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Delete with tenant and ownership checks
   */
  async function secureDelete(
    table: string,
    id: string,
    options: SecureQueryOptions & { idField?: string }
  ): Promise<SecureQueryResult<null>> {
    const validation = validateContext();
    if (!validation.passed) {
      return { data: null, error: new Error(validation.reason), securityResult: validation };
    }

    const idField = options.idField || 'id';

    try {
      let query = supabase
        .from(table)
        .delete()
        .eq('organization_id', organizationId)
        .eq(idField, id);

      // Apply ownership check if required
      if (options.checkOwnership && options.ownerField) {
        query = query.eq(options.ownerField, userId);
      }

      const { error } = await query;

      // Log the action
      if (!options.skipAuditLog) {
        await logResourceEvent(
          'resource_delete',
          userId,
          organizationId,
          options.resourceType,
          id,
          error ? 'denied' : 'allowed',
          error?.message
        );
      }

      if (error) {
        return {
          data: null,
          error: new Error(error.message),
          securityResult: {
            passed: false,
            layer: 'database_rls',
            reason: error.message,
            timestamp: Date.now(),
          },
        };
      }

      return {
        data: null,
        error: null,
        securityResult: {
          passed: true,
          layer: 'database_rls',
          timestamp: Date.now(),
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      await logSecurityIncident(
        'suspicious_activity',
        userId,
        organizationId,
        `Delete error on ${table}: ${error.message}`,
        'critical'
      );
      return {
        data: null,
        error,
        securityResult: {
          passed: false,
          layer: 'database_rls',
          reason: error.message,
          timestamp: Date.now(),
        },
      };
    }
  }

  return {
    secureSelect,
    secureSelectOne,
    secureInsert,
    secureUpdate,
    secureDelete,
    validateContext,
  };
}

// =============================================================================
// HOOK FOR SECURE QUERIES
// =============================================================================

/**
 * React hook that provides secure query methods
 * Use this in components for type-safe, security-enforced data access
 *
 * @example
 * const { secureSelect, secureInsert } = useSecureQuery();
 *
 * // Fetch members with tenant isolation
 * const { data, error } = await secureSelect<Member>('profiles', {
 *   resourceType: 'member',
 *   action: 'select',
 *   filters: { role: 'member' }
 * });
 */
export function useSecureQueryContext(context: SecureQueryContext) {
  return createSecureQuery(context);
}

export default createSecureQuery;
