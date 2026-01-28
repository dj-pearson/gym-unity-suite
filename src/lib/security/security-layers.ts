/**
 * Security Layers - Defense in Depth Implementation
 *
 * This module implements a 4-layer security model:
 *
 * Layer 1: Authentication (WHO are you?)
 *   - Validates JWT/session is valid
 *   - Checks session expiration
 *   - Verifies MFA if required
 *
 * Layer 2: Authorization (WHAT can you do?)
 *   - Permission-based checks (e.g., 'sales.lead.view_own')
 *   - Role level checks (roleLevel >= 5)
 *   - Feature flag validation
 *
 * Layer 3: Resource Ownership (IS this yours?)
 *   - Tenant filtering (tenantId = user's tenantId)
 *   - Owner checks (createdBy = userId for "own" access)
 *   - Location-level restrictions
 *
 * Layer 4: Database RLS (FINAL enforcement)
 *   - Row-level security policies in PostgreSQL
 *   - Even if code has bugs, DB rejects unauthorized access
 */

import { UserRole } from '@/hooks/usePermissions';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Security layer names for logging and error tracking
 */
export type SecurityLayer =
  | 'authentication'
  | 'authorization'
  | 'resource_ownership'
  | 'database_rls';

/**
 * Security check result with detailed failure information
 */
export interface SecurityCheckResult {
  passed: boolean;
  layer: SecurityLayer;
  reason?: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Session validation result for Layer 1
 */
export interface SessionValidationResult {
  isValid: boolean;
  userId: string | null;
  sessionId: string | null;
  expiresAt: number | null;
  mfaVerified: boolean;
  error?: string;
}

/**
 * Permission check options for Layer 2
 */
export interface PermissionCheckOptions {
  permission: string;
  requireMFA?: boolean;
  minimumRoleLevel?: number;
  featureFlag?: string;
}

/**
 * Resource ownership check options for Layer 3
 */
export interface ResourceOwnershipOptions {
  resourceId: string;
  resourceType: string;
  ownerId?: string;
  organizationId: string;
  locationId?: string;
  checkOwnership?: boolean; // For "own" vs "all" access patterns
}

/**
 * Role hierarchy with numeric levels
 * Higher level = more permissions
 */
export const ROLE_LEVELS: Record<UserRole, number> = {
  member: 1,
  trainer: 2,
  staff: 3,
  manager: 4,
  owner: 5,
} as const;

/**
 * Granular permission structure supporting "own" vs "all" patterns
 */
export interface GranularPermission {
  domain: string;      // e.g., 'sales', 'members', 'classes'
  resource: string;    // e.g., 'lead', 'member', 'booking'
  action: string;      // e.g., 'view', 'create', 'edit', 'delete'
  scope: 'own' | 'all' | 'location' | 'organization';
}

/**
 * Security audit log entry
 */
export interface SecurityAuditEntry {
  id: string;
  timestamp: number;
  layer: SecurityLayer;
  action: string;
  userId: string | null;
  organizationId: string | null;
  resourceType?: string;
  resourceId?: string;
  result: 'allowed' | 'denied';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Security context state
 */
export interface SecurityState {
  isAuthenticated: boolean;
  sessionValid: boolean;
  mfaVerified: boolean;
  mfaRequired: boolean;
  userId: string | null;
  organizationId: string | null;
  locationId: string | null;
  role: UserRole | null;
  roleLevel: number;
  permissions: Set<string>;
  lastValidated: number;
}

// =============================================================================
// LAYER 1: AUTHENTICATION
// =============================================================================

/**
 * Validates the current session
 */
export function validateSession(
  session: { user: { id: string } | null; expires_at?: number } | null,
  mfaStatus: { verified: boolean; required: boolean } = { verified: false, required: false }
): SessionValidationResult {
  if (!session || !session.user) {
    return {
      isValid: false,
      userId: null,
      sessionId: null,
      expiresAt: null,
      mfaVerified: false,
      error: 'No active session',
    };
  }

  const expiresAt = session.expires_at || 0;
  const now = Math.floor(Date.now() / 1000);

  if (expiresAt > 0 && expiresAt < now) {
    return {
      isValid: false,
      userId: session.user.id,
      sessionId: null,
      expiresAt,
      mfaVerified: false,
      error: 'Session expired',
    };
  }

  // MFA check - if required but not verified, session is not fully valid
  if (mfaStatus.required && !mfaStatus.verified) {
    return {
      isValid: false,
      userId: session.user.id,
      sessionId: null,
      expiresAt,
      mfaVerified: false,
      error: 'MFA verification required',
    };
  }

  return {
    isValid: true,
    userId: session.user.id,
    sessionId: null, // Supabase doesn't expose session ID directly
    expiresAt,
    mfaVerified: mfaStatus.verified,
  };
}

/**
 * Checks if re-authentication is required for sensitive operations
 */
export function requiresReauth(
  lastAuthTime: number,
  sensitiveOperationThreshold: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const timeSinceAuth = Date.now() - lastAuthTime;
  return timeSinceAuth > sensitiveOperationThreshold;
}

// =============================================================================
// LAYER 2: AUTHORIZATION
// =============================================================================

/**
 * Parses a granular permission string into its components
 * Format: domain.resource.action or domain.resource.action_scope
 * Examples: 'sales.lead.view_own', 'members.member.edit_all'
 */
export function parsePermission(permission: string): GranularPermission | null {
  const parts = permission.split('.');
  if (parts.length < 3) return null;

  const [domain, resource, actionWithScope] = parts;
  const actionParts = actionWithScope.split('_');
  const action = actionParts[0];
  const scope = (actionParts[1] as 'own' | 'all' | 'location' | 'organization') || 'all';

  return { domain, resource, action, scope };
}

/**
 * Checks if a role has the minimum required level
 */
export function hasMinimumRoleLevel(
  userRole: UserRole | null,
  minimumLevel: number
): boolean {
  if (!userRole) return false;
  return ROLE_LEVELS[userRole] >= minimumLevel;
}

/**
 * Checks if a user has a specific granular permission
 */
export function hasGranularPermission(
  userPermissions: Set<string>,
  requiredPermission: string,
  userRole: UserRole | null
): boolean {
  // Owners have all permissions
  if (userRole === 'owner') return true;

  // Direct permission check
  if (userPermissions.has(requiredPermission)) return true;

  // Check for "all" scope if "own" was requested
  const parsed = parsePermission(requiredPermission);
  if (parsed && parsed.scope === 'own') {
    const allPermission = `${parsed.domain}.${parsed.resource}.${parsed.action}_all`;
    if (userPermissions.has(allPermission)) return true;
  }

  // Check for organization-level if location-level was requested
  if (parsed && parsed.scope === 'location') {
    const orgPermission = `${parsed.domain}.${parsed.resource}.${parsed.action}_organization`;
    if (userPermissions.has(orgPermission)) return true;
  }

  return false;
}

/**
 * Builds the set of permissions for a role
 */
export function buildPermissionsForRole(role: UserRole): Set<string> {
  const permissions = new Set<string>();

  // Base permissions for all roles
  const basePermissions = [
    'dashboard.view',
    'profile.view_own',
    'profile.edit_own',
  ];

  basePermissions.forEach(p => permissions.add(p));

  // Role-specific permissions
  switch (role) {
    case 'owner':
      // Owners have all permissions - handled by hasGranularPermission
      permissions.add('*');
      break;

    case 'manager':
      // Manager permissions
      [
        'members.member.view_all',
        'members.member.create_all',
        'members.member.edit_all',
        'members.member.delete_location',
        'sales.lead.view_all',
        'sales.lead.create_all',
        'sales.lead.edit_all',
        'sales.lead.delete_location',
        'classes.class.view_all',
        'classes.class.create_all',
        'classes.class.edit_all',
        'classes.booking.view_all',
        'billing.invoice.view_all',
        'billing.payment.process_all',
        'reports.analytics.view_location',
        'staff.schedule.view_all',
        'staff.schedule.edit_all',
        'settings.location.view',
        'settings.location.edit',
      ].forEach(p => permissions.add(p));
      break;

    case 'staff':
      // Staff permissions
      [
        'members.member.view_all',
        'members.member.create_all',
        'members.member.edit_all',
        'sales.lead.view_own',
        'sales.lead.create_all',
        'sales.lead.edit_own',
        'classes.class.view_all',
        'classes.booking.view_all',
        'classes.booking.create_all',
        'billing.invoice.view_all',
        'billing.payment.process_all',
        'checkin.checkin.create_all',
        'retail.sale.process_all',
      ].forEach(p => permissions.add(p));
      break;

    case 'trainer':
      // Trainer permissions
      [
        'classes.class.view_all',
        'classes.class.edit_own',
        'classes.booking.view_own',
        'members.member.view_all',
        'training.session.view_own',
        'training.session.create_own',
        'training.session.edit_own',
        'schedule.availability.view_own',
        'schedule.availability.edit_own',
      ].forEach(p => permissions.add(p));
      break;

    case 'member':
      // Member permissions (self-service)
      [
        'classes.class.view_all',
        'classes.booking.view_own',
        'classes.booking.create_own',
        'classes.booking.delete_own',
        'billing.invoice.view_own',
        'membership.plan.view_all',
      ].forEach(p => permissions.add(p));
      break;
  }

  return permissions;
}

// =============================================================================
// LAYER 3: RESOURCE OWNERSHIP
// =============================================================================

/**
 * Validates resource ownership for "own" scope access
 */
export function validateResourceOwnership(
  options: ResourceOwnershipOptions,
  userId: string,
  userOrganizationId: string,
  userLocationId: string | null
): SecurityCheckResult {
  const {
    resourceId,
    resourceType,
    ownerId,
    organizationId,
    locationId,
    checkOwnership = true
  } = options;

  // First, check organization match (tenant isolation)
  if (organizationId !== userOrganizationId) {
    return {
      passed: false,
      layer: 'resource_ownership',
      reason: 'Resource belongs to a different organization',
      details: {
        resourceType,
        resourceId,
        resourceOrgId: organizationId,
        userOrgId: userOrganizationId,
      },
      timestamp: Date.now(),
    };
  }

  // If location-level check is needed
  if (locationId && userLocationId && locationId !== userLocationId) {
    return {
      passed: false,
      layer: 'resource_ownership',
      reason: 'Resource belongs to a different location',
      details: {
        resourceType,
        resourceId,
        resourceLocationId: locationId,
        userLocationId,
      },
      timestamp: Date.now(),
    };
  }

  // If ownership check is required (for "own" scope permissions)
  if (checkOwnership && ownerId && ownerId !== userId) {
    return {
      passed: false,
      layer: 'resource_ownership',
      reason: 'User does not own this resource',
      details: {
        resourceType,
        resourceId,
        resourceOwnerId: ownerId,
        userId,
      },
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
 * Creates a tenant-scoped query filter
 */
export function createTenantFilter(
  organizationId: string,
  locationId?: string | null,
  scope: 'organization' | 'location' = 'organization'
): Record<string, string> {
  const filter: Record<string, string> = {
    organization_id: organizationId,
  };

  if (scope === 'location' && locationId) {
    filter.location_id = locationId;
  }

  return filter;
}

/**
 * Creates an ownership filter for "own" scope queries
 */
export function createOwnershipFilter(
  userId: string,
  ownerField: string = 'created_by'
): Record<string, string> {
  return {
    [ownerField]: userId,
  };
}

// =============================================================================
// SECURITY VALIDATION UTILITIES
// =============================================================================

/**
 * Performs a complete security check across all layers
 */
export function performSecurityCheck(
  layer: SecurityLayer,
  checkFn: () => boolean,
  context: {
    userId?: string | null;
    organizationId?: string | null;
    resourceType?: string;
    resourceId?: string;
    action?: string;
  }
): SecurityCheckResult {
  const passed = checkFn();

  return {
    passed,
    layer,
    reason: passed ? undefined : `Security check failed at ${layer} layer`,
    details: context,
    timestamp: Date.now(),
  };
}

/**
 * Combines multiple security check results
 */
export function combineSecurityResults(
  results: SecurityCheckResult[]
): SecurityCheckResult {
  const failed = results.find(r => !r.passed);

  if (failed) {
    return failed;
  }

  return {
    passed: true,
    layer: 'database_rls', // All layers passed, final layer
    timestamp: Date.now(),
  };
}

/**
 * Generates a security denial message
 */
export function getSecurityDenialMessage(result: SecurityCheckResult): string {
  switch (result.layer) {
    case 'authentication':
      return 'Please sign in to access this resource.';
    case 'authorization':
      return 'You do not have permission to perform this action.';
    case 'resource_ownership':
      return 'You do not have access to this resource.';
    case 'database_rls':
      return 'Access denied by security policy.';
    default:
      return 'Access denied.';
  }
}

// =============================================================================
// SECURITY LAYER EXECUTOR
// =============================================================================

/**
 * Executes security checks in order, stopping at first failure
 */
export async function executeSecurityLayers(
  checks: Array<{
    layer: SecurityLayer;
    check: () => boolean | Promise<boolean>;
    context?: Record<string, unknown>;
  }>
): Promise<SecurityCheckResult> {
  for (const { layer, check, context } of checks) {
    try {
      const passed = await check();

      if (!passed) {
        return {
          passed: false,
          layer,
          reason: `Security check failed at ${layer} layer`,
          details: context,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      return {
        passed: false,
        layer,
        reason: `Security check error at ${layer} layer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { ...context, error: String(error) },
        timestamp: Date.now(),
      };
    }
  }

  return {
    passed: true,
    layer: 'database_rls',
    timestamp: Date.now(),
  };
}

export default {
  // Layer 1
  validateSession,
  requiresReauth,
  // Layer 2
  parsePermission,
  hasMinimumRoleLevel,
  hasGranularPermission,
  buildPermissionsForRole,
  ROLE_LEVELS,
  // Layer 3
  validateResourceOwnership,
  createTenantFilter,
  createOwnershipFilter,
  // Utilities
  performSecurityCheck,
  combineSecurityResults,
  getSecurityDenialMessage,
  executeSecurityLayers,
};
