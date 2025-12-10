/**
 * Application Performance Monitoring (APM) Service
 *
 * Provides performance monitoring and metrics collection for the application.
 * Designed to integrate with DataDog, New Relic, or similar APM tools.
 *
 * @module monitoring/apm
 */

import { logger } from './logger';

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: string;
  tags: Record<string, string>;
  metadata?: Record<string, unknown>;
}

// APM configuration
export interface APMConfig {
  enabled: boolean;
  serviceName: string;
  environment: string;
  version: string;
  sampleRate: number;
  endpoint?: string;
  apiKey?: string;
  flushInterval: number;
  maxQueueSize: number;
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableLongTasks: boolean;
  enableUserInteractions: boolean;
}

// Web Vitals types
interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Default configuration
const DEFAULT_CONFIG: APMConfig = {
  enabled: import.meta.env.PROD,
  serviceName: 'gym-unity-suite',
  environment: import.meta.env.MODE || 'development',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  sampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  endpoint: import.meta.env.VITE_APM_ENDPOINT,
  apiKey: import.meta.env.VITE_APM_API_KEY,
  flushInterval: 10000, // 10 seconds
  maxQueueSize: 100,
  enableWebVitals: true,
  enableResourceTiming: true,
  enableLongTasks: true,
  enableUserInteractions: true,
};

// Performance thresholds for ratings
const PERFORMANCE_THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: { good: 2500, needsImprovement: 4000 },
  // First Input Delay (FID)
  FID: { good: 100, needsImprovement: 300 },
  // Cumulative Layout Shift (CLS)
  CLS: { good: 0.1, needsImprovement: 0.25 },
  // Time to First Byte (TTFB)
  TTFB: { good: 800, needsImprovement: 1800 },
  // First Contentful Paint (FCP)
  FCP: { good: 1800, needsImprovement: 3000 },
  // Interaction to Next Paint (INP)
  INP: { good: 200, needsImprovement: 500 },
};

/**
 * APMService - Application Performance Monitoring
 */
class APMService {
  private config: APMConfig;
  private metricsQueue: PerformanceMetric[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private observers: PerformanceObserver[] = [];
  private navigationStart: number = 0;
  private initialized: boolean = false;

  constructor(config?: Partial<APMConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize APM service
   */
  init(): void {
    if (this.initialized) {
      return;
    }

    if (!this.config.enabled) {
      logger.info('APM disabled in this environment', { component: 'apm' });
      return;
    }

    try {
      this.navigationStart = performance.timeOrigin;

      // Set up performance observers
      if (this.config.enableWebVitals) {
        this.setupWebVitalsObserver();
      }

      if (this.config.enableResourceTiming) {
        this.setupResourceTimingObserver();
      }

      if (this.config.enableLongTasks) {
        this.setupLongTaskObserver();
      }

      // Start flush timer
      this.startFlushTimer();

      // Track initial page load
      this.trackPageLoadMetrics();

      // Set up beforeunload handler
      window.addEventListener('beforeunload', () => this.shutdown());

      this.initialized = true;
      logger.info('APM initialized', {
        component: 'apm',
        metadata: {
          serviceName: this.config.serviceName,
          environment: this.config.environment,
        },
      });
    } catch (error) {
      logger.error('Failed to initialize APM', error, { component: 'apm' });
    }
  }

  /**
   * Set up Web Vitals observer
   */
  private setupWebVitalsObserver(): void {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        const value = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
        this.recordWebVital('LCP', value);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const firstEntry = entries[0] as PerformanceEventTiming;
        if (firstEntry.processingStart) {
          const value = firstEntry.processingStart - firstEntry.startTime;
          this.recordWebVital('FID', value);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShift.hadRecentInput && layoutShift.value) {
            clsValue += layoutShift.value;
          }
        }
        this.recordWebVital('CLS', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.recordWebVital('FCP', fcpEntry.startTime);
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObserver);
    } catch (error) {
      logger.warn('Failed to set up Web Vitals observer', { component: 'apm', metadata: { error } });
    }
  }

  /**
   * Set up resource timing observer
   */
  private setupResourceTimingObserver(): void {
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const resource = entry as PerformanceResourceTiming;

          // Only track significant resources
          if (resource.duration > 100 || resource.transferSize > 50000) {
            this.recordMetric({
              name: 'resource_load',
              value: resource.duration,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              tags: {
                resource_type: this.getResourceType(resource.name),
                initiator_type: resource.initiatorType,
              },
              metadata: {
                url: this.sanitizeUrl(resource.name),
                transferSize: resource.transferSize,
                encodedBodySize: resource.encodedBodySize,
                decodedBodySize: resource.decodedBodySize,
              },
            });
          }
        }
      });
      observer.observe({ type: 'resource', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to set up resource timing observer', { component: 'apm', metadata: { error } });
    }
  }

  /**
   * Set up long task observer
   */
  private setupLongTaskObserver(): void {
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.recordMetric({
            name: 'long_task',
            value: entry.duration,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: {
              task_name: entry.name,
            },
            metadata: {
              startTime: entry.startTime,
            },
          });

          // Alert on very long tasks
          if (entry.duration > 200) {
            logger.warn('Long task detected', {
              component: 'apm',
              metadata: {
                duration: entry.duration,
                name: entry.name,
              },
            });
          }
        }
      });
      observer.observe({ type: 'longtask', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      // Long task observer not supported in all browsers
      logger.debug('Long task observer not available', { component: 'apm' });
    }
  }

  /**
   * Record a Web Vital metric
   */
  private recordWebVital(name: string, value: number): void {
    const thresholds = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
    let rating: WebVitalsMetric['rating'] = 'good';

    if (thresholds) {
      if (value > thresholds.needsImprovement) {
        rating = 'poor';
      } else if (value > thresholds.good) {
        rating = 'needs-improvement';
      }
    }

    this.recordMetric({
      name: `web_vital_${name.toLowerCase()}`,
      value,
      unit: name === 'CLS' ? 'count' : 'ms',
      timestamp: new Date().toISOString(),
      tags: {
        vital_name: name,
        rating,
      },
    });

    logger.info(`Web Vital: ${name}`, {
      component: 'apm',
      metadata: {
        value: name === 'CLS' ? value.toFixed(4) : `${value.toFixed(0)}ms`,
        rating,
      },
    });
  }

  /**
   * Track page load metrics
   */
  private trackPageLoadMetrics(): void {
    // Wait for load event
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (navigation) {
          // DOM Content Loaded
          this.recordMetric({
            name: 'dom_content_loaded',
            value: navigation.domContentLoadedEventEnd - navigation.startTime,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: { page: window.location.pathname },
          });

          // Full Load
          this.recordMetric({
            name: 'page_load_complete',
            value: navigation.loadEventEnd - navigation.startTime,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: { page: window.location.pathname },
          });

          // Time to First Byte (TTFB)
          const ttfb = navigation.responseStart - navigation.requestStart;
          this.recordWebVital('TTFB', ttfb);

          // DNS lookup time
          this.recordMetric({
            name: 'dns_lookup',
            value: navigation.domainLookupEnd - navigation.domainLookupStart,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: { page: window.location.pathname },
          });

          // TCP connection time
          this.recordMetric({
            name: 'tcp_connect',
            value: navigation.connectEnd - navigation.connectStart,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: { page: window.location.pathname },
          });
        }
      }, 0);
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.config.enabled) return;

    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // Add service tags
    const enrichedMetric: PerformanceMetric = {
      ...metric,
      tags: {
        ...metric.tags,
        service: this.config.serviceName,
        environment: this.config.environment,
        version: this.config.version,
      },
    };

    this.metricsQueue.push(enrichedMetric);

    // Flush if queue is full
    if (this.metricsQueue.length >= this.config.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Track a custom event duration
   */
  trackDuration(name: string, startTime: number, tags?: Record<string, string>): void {
    const duration = performance.now() - startTime;
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags: tags || {},
    });
  }

  /**
   * Create a timer for measuring operations
   */
  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = performance.now();
    return () => this.trackDuration(name, startTime, tags);
  }

  /**
   * Track API call performance
   */
  trackApiCall(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    this.recordMetric({
      name: 'api_call',
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags: {
        method,
        endpoint: this.sanitizeUrl(endpoint),
        status_code: String(statusCode),
        status_class: `${Math.floor(statusCode / 100)}xx`,
      },
      metadata,
    });
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(
    interactionType: string,
    target: string,
    duration?: number
  ): void {
    if (!this.config.enableUserInteractions) return;

    this.recordMetric({
      name: 'user_interaction',
      value: duration || 0,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags: {
        interaction_type: interactionType,
        target,
        page: window.location.pathname,
      },
    });
  }

  /**
   * Track route change
   */
  trackRouteChange(from: string, to: string, duration: number): void {
    this.recordMetric({
      name: 'route_change',
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags: {
        from_route: from,
        to_route: to,
      },
    });
  }

  /**
   * Track component render
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric({
      name: 'component_render',
      value: renderTime,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags: {
        component: componentName,
        page: window.location.pathname,
      },
    });
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase();
    const typeMap: Record<string, string> = {
      js: 'script',
      css: 'stylesheet',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      webp: 'image',
      woff: 'font',
      woff2: 'font',
      ttf: 'font',
      json: 'data',
    };
    return typeMap[extension || ''] || 'other';
  }

  /**
   * Sanitize URL for logging (remove sensitive params)
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'apiKey'];
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });
      return urlObj.pathname + urlObj.search;
    } catch {
      return url.split('?')[0];
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.metricsQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Flush metrics to endpoint
   */
  async flush(): Promise<void> {
    if (this.metricsQueue.length === 0) return;

    const batch = this.metricsQueue.splice(0, this.config.maxQueueSize);

    // If no endpoint configured, just log locally
    if (!this.config.endpoint) {
      logger.debug('APM metrics batch (no endpoint configured)', {
        component: 'apm',
        metadata: { metricsCount: batch.length },
      });
      return;
    }

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { 'DD-API-KEY': this.config.apiKey } : {}),
        },
        body: JSON.stringify({
          series: batch.map(metric => ({
            metric: `${this.config.serviceName}.${metric.name}`,
            points: [[Math.floor(Date.now() / 1000), metric.value]],
            type: 'gauge',
            tags: Object.entries(metric.tags).map(([k, v]) => `${k}:${v}`),
          })),
        }),
        keepalive: true,
      });
    } catch (error) {
      // Re-queue on failure
      this.metricsQueue.unshift(...batch);
      logger.warn('Failed to send APM metrics', { component: 'apm', metadata: { error } });
    }
  }

  /**
   * Shutdown APM service
   */
  shutdown(): void {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    this.flush();

    this.initialized = false;
  }

  /**
   * Get current configuration
   */
  getConfig(): APMConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const apmService = new APMService();

// Convenience exports
export const measurePerformance = <T>(
  name: string,
  operation: () => T,
  tags?: Record<string, string>
): T => {
  const stopTimer = apmService.startTimer(name, tags);
  try {
    const result = operation();
    stopTimer();
    return result;
  } catch (error) {
    stopTimer();
    throw error;
  }
};

export const trackPageLoad = () => {
  apmService.trackRouteChange('', window.location.pathname, 0);
};

export const trackApiCall = (
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, unknown>
) => apmService.trackApiCall(method, endpoint, statusCode, duration, metadata);

export const trackUserInteraction = (
  interactionType: string,
  target: string,
  duration?: number
) => apmService.trackUserInteraction(interactionType, target, duration);
