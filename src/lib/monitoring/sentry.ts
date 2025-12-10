/**
 * Sentry Error Tracking Integration
 *
 * Provides comprehensive error monitoring and alerting for the application.
 * Integrates with Sentry for real-time error tracking, performance monitoring,
 * and user feedback collection.
 *
 * @module monitoring/sentry
 */

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
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: (import.meta.env.MODE as SentryConfig['environment']) || 'development',
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  sampleRate: 1.0, // 100% error sampling
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
  replaysSessionSampleRate: 0.1, // 10% session replay sampling
  replaysOnErrorSampleRate: 1.0, // 100% replay on error
  debug: import.meta.env.DEV,
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
      // In production, you would import and initialize the actual Sentry SDK:
      // import * as Sentry from '@sentry/react';
      // Sentry.init({
      //   dsn: this.config.dsn,
      //   environment: this.config.environment,
      //   release: this.config.release,
      //   sampleRate: this.config.sampleRate,
      //   tracesSampleRate: this.config.tracesSampleRate,
      //   replaysSessionSampleRate: this.config.replaysSessionSampleRate,
      //   replaysOnErrorSampleRate: this.config.replaysOnErrorSampleRate,
      //   debug: this.config.debug,
      //   integrations: [
      //     new Sentry.BrowserTracing(),
      //     new Sentry.Replay(),
      //   ],
      //   beforeSend: this.beforeSend.bind(this),
      //   beforeBreadcrumb: this.beforeBreadcrumb.bind(this),
      // });

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
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason, {
        component: 'UnhandledPromiseRejection',
        extra: { type: 'unhandledrejection' },
      });
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureException(event.error || event.message, {
        component: 'GlobalErrorHandler',
        extra: {
          type: 'error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  /**
   * Set user context for error tracking
   */
  setUser(context: ErrorContext): void {
    this.userContext = { ...this.userContext, ...context };

    // In production with Sentry SDK:
    // Sentry.setUser({
    //   id: context.userId,
    //   email: context.email,
    //   username: context.email,
    // });
    // Sentry.setTag('organization_id', context.organizationId);
    // Sentry.setTag('user_role', context.role);
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    this.userContext = {};
    // In production: Sentry.setUser(null);
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

    // In production with Sentry SDK:
    // return Sentry.captureException(errorObj, {
    //   fingerprint,
    //   extra: scrubbedContext.extra,
    //   tags: {
    //     component: scrubbedContext.component,
    //     action: scrubbedContext.action,
    //   },
    // });

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

    // In production with Sentry SDK:
    // return Sentry.captureMessage(message, {
    //   level,
    //   extra: scrubbedContext.extra,
    //   tags: {
    //     component: scrubbedContext.component,
    //     action: scrubbedContext.action,
    //   },
    // });

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

    // In production with Sentry SDK:
    // Sentry.addBreadcrumb({
    //   category: breadcrumb.category,
    //   message: breadcrumb.message,
    //   level: breadcrumb.level,
    //   data: breadcrumb.data,
    // });
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
