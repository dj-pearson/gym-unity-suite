/**
 * Security Module - Central export for all security services
 *
 * This module provides:
 * - Defense-in-depth security layers (4-layer model)
 * - Security audit logging
 * - Password policy validation
 * - CORS configuration
 * - Security headers management
 * - Secret management utilities
 * - URL sanitization
 *
 * Security Layers:
 * - Layer 1: Authentication (WHO are you?)
 * - Layer 2: Authorization (WHAT can you do?)
 * - Layer 3: Resource Ownership (IS this yours?)
 * - Layer 4: Database RLS (FINAL enforcement)
 *
 * @module security
 */

// =============================================================================
// SECURITY LAYERS (Defense in Depth)
// =============================================================================

export {
  // Types
  type SecurityLayer,
  type SecurityCheckResult,
  type SessionValidationResult,
  type PermissionCheckOptions,
  type ResourceOwnershipOptions,
  type GranularPermission,
  type SecurityAuditEntry,
  type SecurityState,
  // Constants
  ROLE_LEVELS,
  // Layer 1: Authentication
  validateSession,
  requiresReauth,
  // Layer 2: Authorization
  parsePermission,
  hasMinimumRoleLevel,
  hasGranularPermission,
  buildPermissionsForRole,
  // Layer 3: Resource Ownership
  validateResourceOwnership,
  createTenantFilter,
  createOwnershipFilter,
  // Utilities
  performSecurityCheck,
  combineSecurityResults,
  getSecurityDenialMessage,
  executeSecurityLayers,
} from './security-layers';

// =============================================================================
// SECURITY AUDIT LOGGING
// =============================================================================

export {
  // Types
  type AuditAction,
  type AuditSeverity,
  type AuditLogOptions,
  // Logging functions
  logSecurityEvent,
  logAuthEvent,
  logAuthzEvent,
  logResourceEvent,
  logSecurityIncident,
  // Retrieval functions
  getRecentAuditLogs,
  getSecurityStats,
  clearAuditLogs,
} from './security-audit';

// =============================================================================
// PASSWORD POLICY
// =============================================================================

export {
  passwordPolicy,
  validatePassword,
  validatePasswordSync,
  generatePassword,
  DEFAULT_POLICY,
  STRENGTH_THRESHOLDS,
  type PasswordValidationResult,
  type PasswordPolicyConfig,
} from './password-policy';

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

export {
  corsConfig,
  getAllowedOrigins,
  isOriginAllowed,
  getCorsHeaders,
  type CORSConfig,
} from './cors-config';

// =============================================================================
// SECURITY HEADERS
// =============================================================================

export {
  securityHeaders,
  getSecurityHeaders,
  validateSecurityHeaders,
  type SecurityHeadersConfig,
  type SecurityHeadersAuditResult,
} from './security-headers';

// =============================================================================
// SECRET MANAGEMENT
// =============================================================================

export {
  secretsManager,
  getSecret,
  validateSecrets,
  REQUIRED_SECRETS,
  SERVER_SECRETS,
  type SecretMetadata,
  type SecretValidationResult,
  type SecretsConfig,
} from './secrets';

// =============================================================================
// URL SANITIZATION
// =============================================================================

export {
  sanitizeRedirectURL,
  sanitizeHTML,
  sanitizeInput,
  sanitizeEmail,
  sanitizeFilename,
  isSafeExternalURL,
  getSafeRedirectURL,
  sanitizeOAuthCallback,
} from './url-sanitization';

// =============================================================================
// SECURE QUERY HELPERS
// =============================================================================

export {
  createSecureQuery,
  useSecureQueryContext,
  type SecureQueryContext,
  type SecureQueryOptions,
  type SecureQueryResult,
} from './secure-query';
