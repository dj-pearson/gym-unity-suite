/**
 * Security Audit Logging
 *
 * Provides comprehensive audit logging for security events across all layers.
 * Logs are stored in memory for development and can be persisted to the database
 * for production environments.
 */

import { SecurityLayer, SecurityAuditEntry } from './security-layers';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export type AuditAction =
  // Authentication actions
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_expired'
  | 'session_refresh'
  | 'mfa_required'
  | 'mfa_success'
  | 'mfa_failure'
  | 'password_reset_request'
  | 'password_changed'
  // Authorization actions
  | 'permission_check'
  | 'permission_denied'
  | 'role_elevation_attempt'
  | 'feature_access'
  // Resource actions
  | 'resource_access'
  | 'resource_create'
  | 'resource_update'
  | 'resource_delete'
  | 'ownership_violation'
  | 'tenant_violation'
  // Security events
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'security_config_change'
  | 'bulk_operation'
  | 'data_export';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogOptions {
  action: AuditAction;
  layer: SecurityLayer;
  result: 'allowed' | 'denied';
  userId?: string | null;
  organizationId?: string | null;
  resourceType?: string;
  resourceId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

// =============================================================================
// AUDIT LOG STORE (In-Memory for Development)
// =============================================================================

const MAX_LOG_ENTRIES = 1000;
const auditLogStore: SecurityAuditEntry[] = [];

/**
 * Generates a unique ID for audit entries
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Gets the client IP address (best effort)
 */
function getClientInfo(): { ipAddress?: string; userAgent?: string } {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
  // IP address would come from the server in production
  return { userAgent };
}

// =============================================================================
// AUDIT LOGGING FUNCTIONS
// =============================================================================

/**
 * Logs a security audit event
 */
export async function logSecurityEvent(options: AuditLogOptions): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo();

  const entry: SecurityAuditEntry = {
    id: generateAuditId(),
    timestamp: Date.now(),
    layer: options.layer,
    action: options.action,
    userId: options.userId ?? null,
    organizationId: options.organizationId ?? null,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    result: options.result,
    reason: options.reason,
    ipAddress,
    userAgent,
    metadata: {
      ...options.metadata,
      severity: options.severity || getSeverityForAction(options.action, options.result),
    },
  };

  // Add to in-memory store
  auditLogStore.unshift(entry);

  // Keep store at max size
  if (auditLogStore.length > MAX_LOG_ENTRIES) {
    auditLogStore.pop();
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const logFn = options.result === 'denied' ? console.warn : console.log;
    logFn('[Security Audit]', {
      action: options.action,
      layer: options.layer,
      result: options.result,
      userId: options.userId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
    });
  }

  // In production, persist critical events to database
  if (
    process.env.NODE_ENV === 'production' &&
    shouldPersistEvent(options.action, options.result)
  ) {
    await persistAuditLog(entry);
  }
}

/**
 * Determines severity based on action and result
 */
function getSeverityForAction(action: AuditAction, result: 'allowed' | 'denied'): AuditSeverity {
  // Critical severity for denied sensitive actions
  if (result === 'denied') {
    if (['tenant_violation', 'ownership_violation', 'role_elevation_attempt'].includes(action)) {
      return 'critical';
    }
    if (['permission_denied', 'mfa_failure', 'login_failure'].includes(action)) {
      return 'high';
    }
    return 'medium';
  }

  // For allowed actions
  if (['security_config_change', 'data_export', 'bulk_operation'].includes(action)) {
    return 'medium';
  }

  return 'low';
}

/**
 * Determines if an event should be persisted to the database
 */
function shouldPersistEvent(action: AuditAction, result: 'allowed' | 'denied'): boolean {
  // Always persist denied events
  if (result === 'denied') return true;

  // Persist important allowed events
  const persistableActions: AuditAction[] = [
    'login_success',
    'logout',
    'password_changed',
    'mfa_success',
    'security_config_change',
    'data_export',
    'bulk_operation',
    'resource_delete',
  ];

  return persistableActions.includes(action);
}

/**
 * Persists an audit log entry to the database
 */
async function persistAuditLog(entry: SecurityAuditEntry): Promise<void> {
  try {
    // This would insert into an audit_logs table
    // For now, we'll use console.log as a placeholder
    // In production, implement with actual database insert

    // Example implementation:
    // await supabase.from('security_audit_logs').insert({
    //   id: entry.id,
    //   created_at: new Date(entry.timestamp).toISOString(),
    //   layer: entry.layer,
    //   action: entry.action,
    //   user_id: entry.userId,
    //   organization_id: entry.organizationId,
    //   resource_type: entry.resourceType,
    //   resource_id: entry.resourceId,
    //   result: entry.result,
    //   reason: entry.reason,
    //   ip_address: entry.ipAddress,
    //   user_agent: entry.userAgent,
    //   metadata: entry.metadata,
    // });

    console.info('[Audit Persist]', entry.id, entry.action);
  } catch (error) {
    console.error('[Audit Persist Error]', error);
  }
}

// =============================================================================
// CONVENIENCE LOGGING FUNCTIONS
// =============================================================================

/**
 * Logs an authentication event
 */
export async function logAuthEvent(
  action: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'session_expired' | 'session_refresh' | 'mfa_required' | 'mfa_success' | 'mfa_failure' | 'password_reset_request' | 'password_changed',
  userId: string | null,
  organizationId: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    action,
    layer: 'authentication',
    result: ['login_failure', 'mfa_failure'].includes(action) ? 'denied' : 'allowed',
    userId,
    organizationId,
    metadata,
  });
}

/**
 * Logs an authorization event
 */
export async function logAuthzEvent(
  action: 'permission_check' | 'permission_denied' | 'role_elevation_attempt' | 'feature_access',
  userId: string | null,
  organizationId: string | null,
  permission?: string,
  result: 'allowed' | 'denied' = 'allowed',
  metadata?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    action,
    layer: 'authorization',
    result,
    userId,
    organizationId,
    metadata: { permission, ...metadata },
  });
}

/**
 * Logs a resource access event
 */
export async function logResourceEvent(
  action: 'resource_access' | 'resource_create' | 'resource_update' | 'resource_delete' | 'ownership_violation' | 'tenant_violation',
  userId: string | null,
  organizationId: string | null,
  resourceType: string,
  resourceId: string,
  result: 'allowed' | 'denied' = 'allowed',
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    action,
    layer: 'resource_ownership',
    result,
    userId,
    organizationId,
    resourceType,
    resourceId,
    reason,
    metadata,
  });
}

/**
 * Logs a security incident
 */
export async function logSecurityIncident(
  action: 'rate_limit_exceeded' | 'suspicious_activity' | 'security_config_change' | 'bulk_operation' | 'data_export',
  userId: string | null,
  organizationId: string | null,
  reason: string,
  severity: AuditSeverity = 'high',
  metadata?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    action,
    layer: 'authentication', // Security incidents are tracked at authentication layer
    result: 'denied',
    userId,
    organizationId,
    reason,
    severity,
    metadata,
  });
}

// =============================================================================
// AUDIT LOG RETRIEVAL
// =============================================================================

/**
 * Gets recent audit logs (in-memory)
 */
export function getRecentAuditLogs(
  limit: number = 100,
  filters?: {
    userId?: string;
    organizationId?: string;
    layer?: SecurityLayer;
    action?: AuditAction;
    result?: 'allowed' | 'denied';
    severity?: AuditSeverity;
    startTime?: number;
    endTime?: number;
  }
): SecurityAuditEntry[] {
  let logs = [...auditLogStore];

  if (filters) {
    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters.organizationId) {
      logs = logs.filter(l => l.organizationId === filters.organizationId);
    }
    if (filters.layer) {
      logs = logs.filter(l => l.layer === filters.layer);
    }
    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    if (filters.result) {
      logs = logs.filter(l => l.result === filters.result);
    }
    if (filters.severity) {
      logs = logs.filter(l => l.metadata?.severity === filters.severity);
    }
    if (filters.startTime) {
      logs = logs.filter(l => l.timestamp >= filters.startTime!);
    }
    if (filters.endTime) {
      logs = logs.filter(l => l.timestamp <= filters.endTime!);
    }
  }

  return logs.slice(0, limit);
}

/**
 * Gets security statistics for dashboard
 */
export function getSecurityStats(
  organizationId?: string,
  timeRangeMs: number = 24 * 60 * 60 * 1000 // 24 hours
): {
  totalEvents: number;
  deniedEvents: number;
  byLayer: Record<SecurityLayer, number>;
  byAction: Record<string, number>;
  bySeverity: Record<AuditSeverity, number>;
  recentCritical: SecurityAuditEntry[];
} {
  const cutoffTime = Date.now() - timeRangeMs;
  let logs = auditLogStore.filter(l => l.timestamp >= cutoffTime);

  if (organizationId) {
    logs = logs.filter(l => l.organizationId === organizationId);
  }

  const byLayer: Record<SecurityLayer, number> = {
    authentication: 0,
    authorization: 0,
    resource_ownership: 0,
    database_rls: 0,
  };

  const byAction: Record<string, number> = {};
  const bySeverity: Record<AuditSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let deniedEvents = 0;

  logs.forEach(log => {
    byLayer[log.layer]++;
    byAction[log.action] = (byAction[log.action] || 0) + 1;

    const severity = (log.metadata?.severity as AuditSeverity) || 'low';
    bySeverity[severity]++;

    if (log.result === 'denied') {
      deniedEvents++;
    }
  });

  const recentCritical = logs
    .filter(l => l.metadata?.severity === 'critical' || l.result === 'denied')
    .slice(0, 10);

  return {
    totalEvents: logs.length,
    deniedEvents,
    byLayer,
    byAction,
    bySeverity,
    recentCritical,
  };
}

/**
 * Clears in-memory audit logs (for testing)
 */
export function clearAuditLogs(): void {
  auditLogStore.length = 0;
}

export default {
  logSecurityEvent,
  logAuthEvent,
  logAuthzEvent,
  logResourceEvent,
  logSecurityIncident,
  getRecentAuditLogs,
  getSecurityStats,
  clearAuditLogs,
};
