/**
 * Structured Logging Service
 *
 * Provides comprehensive JSON-formatted logging with request IDs,
 * correlation tracking, and log level management for the application.
 *
 * @module monitoring/logger
 */

import { sentryService, addBreadcrumb } from './sentry';

// Log levels with numeric priorities
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Log level strings for output
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  http?: {
    method: string;
    url: string;
    statusCode?: number;
    responseTime?: number;
    userAgent?: string;
    ip?: string;
  };
  performance?: {
    heapUsed?: number;
    heapTotal?: number;
    loadTime?: number;
  };
}

// Logger configuration
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableBreadcrumbs: boolean;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  maxQueueSize: number;
  includePerformance: boolean;
  sensitiveFields: string[];
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: import.meta.env.PROD,
  enableBreadcrumbs: true,
  remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  maxQueueSize: 100,
  includePerformance: true,
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'creditCard',
    'credit_card',
    'ssn',
    'socialSecurity',
  ],
};

// Patterns to redact from log output
const REDACT_PATTERNS: RegExp[] = [
  /password["\s:=]+["']?[^"'\s,}]+/gi,
  /token["\s:=]+["']?[^"'\s,}]+/gi,
  /secret["\s:=]+["']?[^"'\s,}]+/gi,
  /api[_-]?key["\s:=]+["']?[^"'\s,}]+/gi,
  /authorization["\s:=]+["']?[^"'\s,}]+/gi,
  /bearer\s+[a-zA-Z0-9_-]+/gi,
];

/**
 * StructuredLogger - Main logging service
 */
class StructuredLogger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private requestId: string | null = null;
  private correlationId: string | null = null;
  private context: Partial<LogEntry> = {};

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startFlushTimer();
  }

  /**
   * Set the current request ID for correlation
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Set the correlation ID for distributed tracing
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Generate a new request ID
   */
  generateRequestId(): string {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setRequestId(id);
    return id;
  }

  /**
   * Set persistent context for all log entries
   */
  setContext(context: Partial<LogEntry>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear persistent context
   */
  clearContext(): void {
    this.context = {};
    this.requestId = null;
    this.correlationId = null;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Partial<LogEntry>): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log at INFO level
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log at WARN level
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log at ERROR level
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const errorData = this.formatError(error);
    this.log(LogLevel.ERROR, message, { ...metadata, error: errorData });
  }

  /**
   * Log at FATAL level
   */
  fatal(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const errorData = this.formatError(error);
    this.log(LogLevel.FATAL, message, { ...metadata, error: errorData });
  }

  /**
   * Log HTTP request/response
   */
  http(
    method: string,
    url: string,
    statusCode?: number,
    responseTime?: number,
    metadata?: Record<string, unknown>
  ): void {
    const level = statusCode && statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `${method} ${url} ${statusCode || 'pending'}`, {
      ...metadata,
      http: {
        method,
        url: this.redactUrl(url),
        statusCode,
        responseTime,
      },
    });
  }

  /**
   * Log performance metrics
   */
  performance(action: string, duration: number, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, `Performance: ${action}`, {
      ...metadata,
      duration,
      action,
    });
  }

  /**
   * Time an async operation
   */
  async time<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      this.performance(name, performance.now() - start, { status: 'success' });
      return result;
    } catch (error) {
      this.performance(name, performance.now() - start, { status: 'error' });
      throw error;
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (level < this.config.minLevel) {
      return;
    }

    const entry = this.createLogEntry(level, message, metadata);

    // Console output
    if (this.config.enableConsole) {
      this.consoleOutput(entry);
    }

    // Add breadcrumb for Sentry
    if (this.config.enableBreadcrumbs && level >= LogLevel.INFO) {
      addBreadcrumb({
        category: entry.component || 'app',
        message: entry.message,
        level: this.mapLogLevelToBreadcrumb(level),
        data: entry.metadata,
      });
    }

    // Queue for remote logging
    if (this.config.enableRemote) {
      this.queueForRemote(entry);
    }

    // Capture errors in Sentry
    if (level >= LogLevel.ERROR && entry.error) {
      sentryService.captureException(
        new Error(entry.error.message),
        {
          component: entry.component,
          action: entry.action,
          extra: entry.metadata,
        }
      );
    }
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      message: this.redactMessage(message),
      requestId: this.requestId || undefined,
      correlationId: this.correlationId || undefined,
      ...this.context,
      ...this.redactMetadata(metadata),
    };

    // Add performance data if enabled
    if (this.config.includePerformance && typeof performance !== 'undefined') {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      if (memory) {
        entry.performance = {
          heapUsed: memory.usedJSHeapSize,
          heapTotal: memory.totalJSHeapSize,
        };
      }
    }

    return entry;
  }

  /**
   * Format error for logging
   */
  private formatError(error: unknown): LogEntry['error'] | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.redactMessage(error.message),
        stack: error.stack ? this.redactMessage(error.stack) : undefined,
        code: (error as Error & { code?: string }).code,
      };
    }

    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: this.redactMessage(error),
      };
    }

    return {
      name: 'UnknownError',
      message: this.redactMessage(JSON.stringify(error)),
    };
  }

  /**
   * Redact sensitive data from message
   */
  private redactMessage(message: string): string {
    let redacted = message;
    REDACT_PATTERNS.forEach(pattern => {
      redacted = redacted.replace(pattern, '[REDACTED]');
    });
    return redacted;
  }

  /**
   * Redact sensitive fields from metadata
   */
  private redactMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
    if (!metadata) return {};

    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (this.config.sensitiveFields.some(f => lowerKey.includes(f.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactMetadata(value as Record<string, unknown>);
      } else if (typeof value === 'string') {
        redacted[key] = this.redactMessage(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Redact sensitive query parameters from URL
   */
  private redactUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'apiKey'];

      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });

      return urlObj.toString();
    } catch {
      return this.redactMessage(url);
    }
  }

  /**
   * Console output with formatting
   */
  private consoleOutput(entry: LogEntry): void {
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] [${entry.level}]`;
    const reqId = entry.requestId ? ` [${entry.requestId}]` : '';
    const component = entry.component ? ` [${entry.component}]` : '';

    const level = entry.level as keyof typeof LOG_LEVEL_NAMES;
    const consoleMethod = this.getConsoleMethod(LOG_LEVEL_NAMES[level as unknown as LogLevel] ? (Object.entries(LOG_LEVEL_NAMES).find(([, v]) => v === level)?.[0] as unknown as LogLevel) : LogLevel.INFO);

    // Format for development readability
    if (import.meta.env.DEV) {
      const style = this.getLogStyle(entry.level);
      console[consoleMethod](
        `%c${prefix}${reqId}${component} ${entry.message}`,
        style,
        entry.metadata || ''
      );
    } else {
      // JSON format for production log aggregation
      console[consoleMethod](JSON.stringify(entry));
    }
  }

  /**
   * Get console method for log level
   */
  private getConsoleMethod(level: LogLevel): 'debug' | 'info' | 'warn' | 'error' {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Get console style for log level
   */
  private getLogStyle(level: string): string {
    switch (level) {
      case 'DEBUG':
        return 'color: #6b7280';
      case 'INFO':
        return 'color: #3b82f6';
      case 'WARN':
        return 'color: #f59e0b; font-weight: bold';
      case 'ERROR':
        return 'color: #ef4444; font-weight: bold';
      case 'FATAL':
        return 'color: #dc2626; font-weight: bold; background: #fef2f2';
      default:
        return 'color: inherit';
    }
  }

  /**
   * Map log level to Sentry breadcrumb level
   */
  private mapLogLevelToBreadcrumb(level: LogLevel): 'debug' | 'info' | 'warning' | 'error' | 'fatal' {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warning';
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.FATAL:
        return 'fatal';
      default:
        return 'info';
    }
  }

  /**
   * Queue log entry for remote sending
   */
  private queueForRemote(entry: LogEntry): void {
    this.logQueue.push(entry);

    if (this.logQueue.length >= this.config.maxQueueSize) {
      // Remove oldest entries if queue is full
      this.logQueue = this.logQueue.slice(-this.config.batchSize);
    }

    if (this.logQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Flush queued logs to remote endpoint
   */
  async flush(): Promise<void> {
    if (this.logQueue.length === 0 || !this.config.remoteEndpoint) {
      return;
    }

    const batch = this.logQueue.splice(0, this.config.batchSize);

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: batch,
          source: 'gym-unity-suite',
          environment: import.meta.env.MODE,
        }),
        keepalive: true,
      });
    } catch (error) {
      // Re-queue failed logs
      this.logQueue.unshift(...batch);
      console.warn('[Logger] Failed to send logs to remote:', error);
    }
  }

  /**
   * Update configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.flushInterval) {
      this.startFlushTimer();
    }
  }

  /**
   * Shutdown logger
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

/**
 * Child logger with additional context
 */
class ChildLogger {
  constructor(
    private parent: StructuredLogger,
    private childContext: Partial<LogEntry>
  ) {}

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.parent.debug(message, { ...this.childContext, ...metadata });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.parent.info(message, { ...this.childContext, ...metadata });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.parent.warn(message, { ...this.childContext, ...metadata });
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.parent.error(message, error, { ...this.childContext, ...metadata });
  }

  fatal(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.parent.fatal(message, error, { ...this.childContext, ...metadata });
  }

  child(context: Partial<LogEntry>): ChildLogger {
    return new ChildLogger(this.parent, { ...this.childContext, ...context });
  }
}

// Export singleton instance
export const logger = new StructuredLogger();

// Export types and utilities
export type { ChildLogger };
export { StructuredLogger };
