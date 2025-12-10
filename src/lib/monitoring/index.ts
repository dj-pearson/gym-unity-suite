/**
 * Monitoring Module - Central export for all monitoring services
 *
 * This module provides:
 * - Error tracking (Sentry integration)
 * - Structured logging with request correlation
 * - Application Performance Monitoring (APM)
 * - Health check utilities
 *
 * @module monitoring
 */

// Sentry error tracking
export {
  sentryService,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  clearUser,
  startTransaction,
  createErrorBoundaryHandler,
  type SentryConfig,
  type ErrorContext,
  type BreadcrumbData,
  type ErrorSeverity,
  type PerformanceTransaction,
} from './sentry';

// Structured logging
export {
  logger,
  StructuredLogger,
  LogLevel,
  type LogEntry,
  type LoggerConfig,
  type ChildLogger,
} from './logger';

// APM utilities
export {
  apmService,
  measurePerformance,
  trackPageLoad,
  trackApiCall,
  trackUserInteraction,
  type PerformanceMetric,
  type APMConfig,
} from './apm';

// Health checks
export {
  healthService,
  checkHealth,
  type HealthStatus,
  type HealthCheckResult,
} from './health';

// Uptime monitoring
export {
  uptimeMonitoring,
  startUptimeChecks,
  stopUptimeChecks,
  checkUptimeNow,
  type UptimeCheckConfig,
  type UptimeMonitoringConfig,
} from './uptime';

/**
 * Initialize all monitoring services
 * Call this at application startup in main.tsx
 */
export async function initializeMonitoring(): Promise<void> {
  const { sentryService } = await import('./sentry');
  const { apmService } = await import('./apm');
  const { logger } = await import('./logger');

  // Initialize Sentry
  await sentryService.init();

  // Initialize APM
  apmService.init();

  logger.info('Monitoring services initialized', {
    component: 'monitoring',
    action: 'init',
    metadata: {
      sentryEnabled: sentryService.isInitialized(),
      environment: import.meta.env.MODE,
    },
  });
}

/**
 * Shutdown all monitoring services gracefully
 * Call this before application unload
 */
export async function shutdownMonitoring(): Promise<void> {
  const { logger } = await import('./logger');
  const { apmService } = await import('./apm');

  await logger.shutdown();
  apmService.shutdown();
}
