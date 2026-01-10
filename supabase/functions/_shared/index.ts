/**
 * Shared Edge Function Utilities
 *
 * Central export point for all shared modules.
 * Import from this file for cleaner imports.
 *
 * @example
 * import { getCorsHeaders, validate, monitorQuery, sendAlert } from "../_shared/index.ts";
 */

// CORS utilities
export {
  getCorsHeaders,
  handleCorsPreFlight,
  corsJsonResponse,
  corsErrorResponse,
  ALLOWED_ORIGINS,
  ALLOWED_HEADERS,
  ALLOWED_METHODS,
} from "./cors.ts";

// Webhook signature verification
export {
  verifyStripeSignature,
  verifySendGridSignature,
  verifyMailgunSignature,
  verifyPostmarkSignature,
  verifyTwilioSignature,
  verifyGenericHmac,
  verifyWebhookIp,
  logWebhookVerification,
  WEBHOOK_IP_RANGES,
  type WebhookVerificationResult,
} from "./webhook-verification.ts";

// Input validation
export {
  validate,
  parseAndValidateBody,
  validationErrorResponse,
  sanitizeString,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeHtml,
  sanitizeForSql,
  detectSqlInjection,
  detectXss,
  detectPathTraversal,
  securityScan,
  deepSecurityScan,
  CommonSchemas,
  PATTERNS,
  type ValidationResult,
  type ValidationError,
  type ValidationErrorCode,
  type FieldSchema,
  type Schema,
} from "./validation.ts";

// Monitoring and alerting
export {
  monitorQuery,
  getMetricsSummary,
  sendAlert,
  performHealthCheck,
  trackError,
  createTimer,
  timeAsync,
  type QueryMetrics,
  type ConnectionPoolMetrics,
  type AlertConfig,
  type AlertSeverity,
  type Alert,
} from "./monitoring.ts";
