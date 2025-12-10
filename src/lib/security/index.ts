/**
 * Security Module - Central export for all security services
 *
 * This module provides:
 * - Password policy validation
 * - CORS configuration
 * - Security headers management
 * - Secret management utilities
 *
 * @module security
 */

// Password policy
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

// CORS configuration
export {
  corsConfig,
  getAllowedOrigins,
  isOriginAllowed,
  getCorsHeaders,
  type CORSConfig,
} from './cors-config';

// Security headers
export {
  securityHeaders,
  getSecurityHeaders,
  validateSecurityHeaders,
  type SecurityHeadersConfig,
  type SecurityHeadersAuditResult,
} from './security-headers';

// Secret management
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
