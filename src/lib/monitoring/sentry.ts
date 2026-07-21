/**
 * Sentry Error Tracking Integration
 *
 * Provides comprehensive error monitoring and alerting for the application.
 * Integrates with Sentry for real-time error tracking, performance monitoring,
 * and user feedback collection.
 *
 * @module monitoring/sentry
 */

import * as Sentry from '@sentry/react';

/**
 * RepClub project DSN (Sentry).
 *
 * Used as the default so error tracking works out of the box in production.
 * Override per-environment with the `VITE_SENTRY_DSN` env var if needed.
 */
const REPCLUB_SENTRY_DSN =
  'https://79a9af0c9504da5dd5ba4c4e7a522063@o4510398791352320.ingest.us.sentry.io/4511770293436416';

// Types for Sentry configuration and error tracking
export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  sampleRate: number;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  debug: boolean;
  enabled: boolean;
}

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  email?: string;
  role?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

export interface BreadcrumbData {
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  data?: Record<string, unknown>;
}

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

// Default configuration
const DEFAULT_CONFIG: SentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN || REPCLUB_SENTRY_DSN,
  environment: (import.meta.env.MODE as SentryConfig['environment']) || 'development',
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  sampleRate: 1.0, // 100% error sampling
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
  replaysSessionSampleRate: 0.1, // 10% session replay sampling
  replaysOnErrorSampleRate: 1.0, // 100% replay on error
  debug: import.meta.env.DEV,
  // Enabled in production (default DSN routes to the RepClub project), or in any
  // environment where a DSN is explicitly provided via VITE_SENTRY_DSN.
  enabled: import.meta.env.PROD || !!import.meta.env.VITE_SENTRY_DSN,
};

// Error fingerprinting rules for grouping similar errors
const ERROR_FINGERPRINT_RULES: Array<{
  pattern: RegExp;
  fingerprint: string[];
}> = [
  { pattern: /network\s+error/i, fingerprint: ['network-error'] },
  { pattern: /timeout/i, fingerprint: ['timeout-error'] },
  { pattern: /unauthorized|401/i, fingerprint: ['auth-error', 'unauthorized'] },
  { pattern: /forbidden|403/i, fingerprint: ['auth-error', 'forbidden'] },
  { pattern: /not\s+found|404/i, fingerprint: ['not-found-error'] },
  { pattern: /rate\s+limit|429/i, fingerprint: ['rate-limit-error'] },
  { pattern: /supabase/i, fingerprint: ['supabase-error', '{{ default }}'] },
  { pattern: /stripe/i, fingerprint: ['stripe-error', '{{ default }}'] },
];

// Sensitive data patterns to scrub
const SENSITIVE_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /credit[_-]?card/i,
  /ssn/i,
  /social[_-]?security/i,
];

/**
 * SentryService - Main error tracking service
 */
class SentryService {
  private config: SentryConfig;
  private initialized: boolean = false;
  private userContext: ErrorContext = {};
  private breadcrumbs: BreadcrumbData[] = [];
  private maxBreadcrumbs: number = 100;

  constructor(config?: Partial<SentryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize Sentry SDK
   * Call this in main.tsx before rendering the app
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.warn('[Sentry] Already initialized');
      return;
    }

    if (!this.config.enabled) {
      console.info('[Sentry] Disabled in this environment');
      return;
    }

    if (!this.config.dsn) {
      console.warn('[Sentry] No DSN configured, error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        replaysSessionSampleRate: this.config.replaysSessionSampleRate,
        replaysOnErrorSampleRate: this.config.replaysOnErrorSampleRate,
        debug: this.config.debug,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        // Scrub sensitive data from outgoing events.
        beforeSend: (event) => this.beforeSend(event),
      });

      this.initialized = true;
      this.setupGlobalErrorHandlers();

      console.info('[Sentry] Initialized successfully', {
        environment: this.config.environment,
        release: this.config.release,
      });
    } catch (error) {
      console.error('[Sentry] Failed to initialize:', error);
    }
  }

  /**
   * Set up global error handlers.
   *
   * Note: the Sentry SDK already installs `window.onerror` and
   * `unhandledrejection` handlers via its default `globalHandlersIntegration`,
   * so we intentionally do NOT add our own here to avoid duplicate events.
   * This method is kept as an extension point for future custom handling.
   */
  private setupGlobalErrorHandlers(): void {
    // Intentionally no-op: handled natively by the Sentry SDK.
  }

  /**
   * Scrub sensitive data from outgoing Sentry events (beforeSend hook)
   */
  private beforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
    try {
      if (event.message) {
        event.message = this.scrubString(event.message);
      }

      const values = event.exception?.values;
      if (values) {
        values.forEach((value) => {
          if (value.value) {
            value.value = this.scrubString(value.value);
          }
        });
      }

      if (event.request?.url) {
        event.request.url = this.scrubString(event.request.url);
      }
    } catch {
      // Never let scrubbing throw and drop the event silently.
    }

    return event;
  }

  /**
   * Set user context for error tracking
   */
  setUser(context: ErrorContext): void {
    this.userContext = { ...this.userContext, ...context };

    if (!this.initialized) return;

    Sentry.setUser({
      id: context.userId,
      email: context.email,
      username: context.email,
    });
    if (context.organizationId) {
      Sentry.setTag('organization_id', context.organizationId);
    }
    if (context.role) {
      Sentry.setTag('user_role', context.role);
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    this.userContext = {};
    if (!this.initialized) return;
    Sentry.setUser(null);
  }

  /**
   * Capture an exception
   */
  captureException(error: Error | string, context?: ErrorContext): string {
    const eventId = this.generateEventId();
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const mergedContext = { ...this.userContext, ...context };

    // Scrub sensitive data
    const scrubbedError = this.scrubSensitiveData(errorObj);
    const scrubbedContext = this.scrubContextData(mergedContext);

    // Get fingerprint for error grouping
    const fingerprint = this.getFingerprint(errorObj);

    // Log locally in development
    if (this.config.debug) {
      console.error('[Sentry] Captured exception:', {
        eventId,
        error: scrubbedError,
        context: scrubbedContext,
        fingerprint,
        breadcrumbs: this.breadcrumbs.slice(-10),
      });
    }

    if (this.initialized) {
      return Sentry.captureException(errorObj, {
        fingerprint,
        extra: scrubbedContext.extra,
        tags: {
          component: scrubbedContext.component,
          action: scrubbedContext.action,
        },
        user: scrubbedContext.userId
          ? { id: scrubbedContext.userId, email: scrubbedContext.email }
          : undefined,
      });
    }

    return eventId;
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: ErrorSeverity = 'info', context?: ErrorContext): string {
    const eventId = this.generateEventId();
    const mergedContext = { ...this.userContext, ...context };
    const scrubbedMessage = this.scrubString(message);
    const scrubbedContext = this.scrubContextData(mergedContext);

    if (this.config.debug) {
      console.log(`[Sentry] Captured message (${level}):`, {
        eventId,
        message: scrubbedMessage,
        context: scrubbedContext,
      });
    }

    if (this.initialized) {
      return Sentry.captureMessage(scrubbedMessage, {
        level: level as Sentry.SeverityLevel,
        extra: scrubbedContext.extra,
        tags: {
          component: scrubbedContext.component,
          action: scrubbedContext.action,
        },
      });
    }

    return eventId;
  }

  /**
   * Add a breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: BreadcrumbData): void {
    const scrubbedBreadcrumb: BreadcrumbData = {
      ...breadcrumb,
      message: this.scrubString(breadcrumb.message),
      data: breadcrumb.data ? this.scrubContextData({ extra: breadcrumb.data }).extra as Record<string, unknown> : undefined,
    };

    this.breadcrumbs.push(scrubbedBreadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    if (this.initialized) {
      Sentry.addBreadcrumb({
        category: scrubbedBreadcrumb.category,
        message: scrubbedBreadcrumb.message,
        level: scrubbedBreadcrumb.level as Sentry.SeverityLevel,
        data: scrubbedBreadcrumb.data,
      });
    }
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string): PerformanceTransaction {
    const transactionId = this.generateEventId();
    const startTime = performance.now();

    // In production with Sentry SDK:
    // const transaction = Sentry.startTransaction({ name, op });
    // return transaction;

    return {
      id: transactionId,
      name,
      op,
      startTime,
      finish: () => {
        const duration = performance.now() - startTime;
        if (this.config.debug) {
          console.log(`[Sentry] Transaction completed: ${name}`, {
            transactionId,
            duration: `${duration.toFixed(2)}ms`,
          });
        }
      },
      setTag: (key: string, value: string) => {
        if (this.config.debug) {
          console.log(`[Sentry] Transaction tag: ${key}=${value}`);
        }
      },
      setData: (key: string, value: unknown) => {
        if (this.config.debug) {
          console.log(`[Sentry] Transaction data: ${key}=`, value);
        }
      },
    };
  }

  /**
   * Get error fingerprint for grouping
   */
  private getFingerprint(error: Error): string[] {
    const message = error.message || error.toString();

    for (const rule of ERROR_FINGERPRINT_RULES) {
      if (rule.pattern.test(message)) {
        return rule.fingerprint;
      }
    }

    return ['{{ default }}'];
  }

  /**
   * Scrub sensitive data from error objects
   */
  private scrubSensitiveData(error: Error): Error {
    const scrubbedError = new Error(this.scrubString(error.message));
    scrubbedError.name = error.name;
    scrubbedError.stack = error.stack ? this.scrubString(error.stack) : undefined;
    return scrubbedError;
  }

  /**
   * Scrub sensitive data from strings
   */
  private scrubString(str: string): string {
    let result = str;
    SENSITIVE_PATTERNS.forEach(pattern => {
      // Replace values after sensitive keys in various formats
      result = result.replace(
        new RegExp(`(${pattern.source}[\\s]*[:=][\\s]*)([^\\s,;\\]\\}]+)`, 'gi'),
        '$1[REDACTED]'
      );
    });
    return result;
  }

  /**
   * Scrub context data
   */
  private scrubContextData(context: ErrorContext): ErrorContext {
    const scrubbed = { ...context };

    if (scrubbed.extra) {
      scrubbed.extra = Object.fromEntries(
        Object.entries(scrubbed.extra).map(([key, value]) => {
          if (SENSITIVE_PATTERNS.some(p => p.test(key))) {
            return [key, '[REDACTED]'];
          }
          if (typeof value === 'string') {
            return [key, this.scrubString(value)];
          }
          return [key, value];
        })
      );
    }

    return scrubbed;
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current configuration
   */
  getConfig(): SentryConfig {
    return { ...this.config };
  }

  /**
   * Check if Sentry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Performance transaction type
export interface PerformanceTransaction {
  id: string;
  name: string;
  op: string;
  startTime: number;
  finish: () => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: unknown) => void;
}

// Export singleton instance
export const sentryService = new SentryService();

// React Error Boundary helper
export const createErrorBoundaryHandler = (componentName: string) => {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    sentryService.captureException(error, {
      component: componentName,
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  };
};

// Convenience exports
export const captureException = (error: Error | string, context?: ErrorContext) =>
  sentryService.captureException(error, context);

export const captureMessage = (message: string, level?: ErrorSeverity, context?: ErrorContext) =>
  sentryService.captureMessage(message, level, context);

export const addBreadcrumb = (breadcrumb: BreadcrumbData) =>
  sentryService.addBreadcrumb(breadcrumb);

export const setUser = (context: ErrorContext) =>
  sentryService.setUser(context);

export const clearUser = () =>
  sentryService.clearUser();

export const startTransaction = (name: string, op: string) =>
  sentryService.startTransaction(name, op);
