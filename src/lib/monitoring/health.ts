/**
 * Health Check Service
 *
 * Provides health check functionality for monitoring application status,
 * dependencies, and service availability.
 *
 * @module monitoring/health
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

// Health status types
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

// Individual check result
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  latency: number; // in milliseconds
  message?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Overall health response
export interface HealthResponse {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  checks: HealthCheckResult[];
  environment: string;
  buildInfo?: {
    commit?: string;
    branch?: string;
    buildTime?: string;
  };
}

// Health check configuration
export interface HealthCheckConfig {
  timeout: number; // Max time for each check in ms
  cacheTime: number; // Cache results for this duration
  enableDatabaseCheck: boolean;
  enableStorageCheck: boolean;
  enableAuthCheck: boolean;
  enableEdgeFunctionCheck: boolean;
  customChecks: Array<{
    name: string;
    check: () => Promise<HealthCheckResult>;
  }>;
}

// Default configuration
const DEFAULT_CONFIG: HealthCheckConfig = {
  timeout: 5000,
  cacheTime: 10000, // 10 seconds
  enableDatabaseCheck: true,
  enableStorageCheck: true,
  enableAuthCheck: true,
  enableEdgeFunctionCheck: false, // Disabled by default to reduce load
  customChecks: [],
};

// Application start time for uptime calculation
const APP_START_TIME = Date.now();

/**
 * HealthService - Health check management
 */
class HealthService {
  private config: HealthCheckConfig;
  private cachedResult: HealthResponse | null = null;
  private cacheTimestamp: number = 0;

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run all health checks
   */
  async checkHealth(force: boolean = false): Promise<HealthResponse> {
    // Return cached result if valid
    if (!force && this.cachedResult && Date.now() - this.cacheTimestamp < this.config.cacheTime) {
      return this.cachedResult;
    }

    const checks: HealthCheckResult[] = [];

    // Database check
    if (this.config.enableDatabaseCheck) {
      checks.push(await this.withTimeout('database', this.checkDatabase()));
    }

    // Storage check
    if (this.config.enableStorageCheck) {
      checks.push(await this.withTimeout('storage', this.checkStorage()));
    }

    // Auth check
    if (this.config.enableAuthCheck) {
      checks.push(await this.withTimeout('auth', this.checkAuth()));
    }

    // Edge function check
    if (this.config.enableEdgeFunctionCheck) {
      checks.push(await this.withTimeout('edge_functions', this.checkEdgeFunctions()));
    }

    // Run custom checks
    for (const customCheck of this.config.customChecks) {
      checks.push(await this.withTimeout(customCheck.name, customCheck.check()));
    }

    // Memory check
    checks.push(this.checkMemory());

    // Determine overall status
    const overallStatus = this.calculateOverallStatus(checks);

    const response: HealthResponse = {
      status: overallStatus,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      uptime: Date.now() - APP_START_TIME,
      timestamp: new Date().toISOString(),
      checks,
      environment: import.meta.env.MODE || 'development',
      buildInfo: {
        commit: import.meta.env.VITE_GIT_COMMIT,
        branch: import.meta.env.VITE_GIT_BRANCH,
        buildTime: import.meta.env.VITE_BUILD_TIME,
      },
    };

    // Cache result
    this.cachedResult = response;
    this.cacheTimestamp = Date.now();

    // Log health check result
    logger.info('Health check completed', {
      component: 'health',
      metadata: {
        status: overallStatus,
        checksCount: checks.length,
        healthyCount: checks.filter(c => c.status === 'healthy').length,
      },
    });

    return response;
  }

  /**
   * Run a liveness check (basic check that app is responding)
   */
  async checkLiveness(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Run a readiness check (check that app is ready to accept traffic)
   */
  async checkReadiness(): Promise<HealthResponse> {
    // For readiness, we only check critical services
    const checks: HealthCheckResult[] = [];

    // Database is critical
    if (this.config.enableDatabaseCheck) {
      checks.push(await this.withTimeout('database', this.checkDatabase()));
    }

    // Auth is critical
    if (this.config.enableAuthCheck) {
      checks.push(await this.withTimeout('auth', this.checkAuth()));
    }

    const overallStatus = this.calculateOverallStatus(checks);

    return {
      status: overallStatus,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      uptime: Date.now() - APP_START_TIME,
      timestamp: new Date().toISOString(),
      checks,
      environment: import.meta.env.MODE || 'development',
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      // Simple query to test connectivity
      const { error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1);

      const latency = performance.now() - start;

      if (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          latency,
          message: `Database query failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        name: 'database',
        status: latency > 2000 ? 'degraded' : 'healthy',
        latency,
        message: latency > 2000 ? 'Database response time is slow' : 'Database is responding normally',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        latency: performance.now() - start,
        message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check storage connectivity
   */
  private async checkStorage(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      // List buckets to test storage connectivity
      const { error } = await supabase.storage.listBuckets();

      const latency = performance.now() - start;

      if (error) {
        return {
          name: 'storage',
          status: 'unhealthy',
          latency,
          message: `Storage check failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        name: 'storage',
        status: latency > 2000 ? 'degraded' : 'healthy',
        latency,
        message: 'Storage is accessible',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'storage',
        status: 'unhealthy',
        latency: performance.now() - start,
        message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check auth service
   */
  private async checkAuth(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      // Get session to test auth service
      const { error } = await supabase.auth.getSession();

      const latency = performance.now() - start;

      if (error) {
        return {
          name: 'auth',
          status: 'unhealthy',
          latency,
          message: `Auth check failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        name: 'auth',
        status: latency > 1000 ? 'degraded' : 'healthy',
        latency,
        message: 'Auth service is responding',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'auth',
        status: 'unhealthy',
        latency: performance.now() - start,
        message: `Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check edge functions availability
   */
  private async checkEdgeFunctions(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      // Test rate-limit function as it doesn't require auth
      const { error } = await supabase.functions.invoke('rate-limit', {
        body: { action: 'health-check', key: 'health-check' },
      });

      const latency = performance.now() - start;

      // Rate limit function might return an error for health check, that's ok
      // We just want to verify it's reachable
      return {
        name: 'edge_functions',
        status: latency > 3000 ? 'degraded' : 'healthy',
        latency,
        message: error ? 'Edge functions reachable but returned error' : 'Edge functions are responding',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'edge_functions',
        status: 'unhealthy',
        latency: performance.now() - start,
        message: `Edge functions check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): HealthCheckResult {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;

    if (!memory) {
      return {
        name: 'memory',
        status: 'healthy',
        latency: 0,
        message: 'Memory info not available in this browser',
        timestamp: new Date().toISOString(),
      };
    }

    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    let status: HealthStatus = 'healthy';
    let message = `Memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent.toFixed(1)}%)`;

    if (usagePercent > 90) {
      status = 'unhealthy';
      message = `Critical memory usage: ${usagePercent.toFixed(1)}%`;
    } else if (usagePercent > 75) {
      status = 'degraded';
      message = `High memory usage: ${usagePercent.toFixed(1)}%`;
    }

    return {
      name: 'memory',
      status,
      latency: 0,
      message,
      details: {
        usedHeap: memory.usedJSHeapSize,
        totalHeap: memory.totalJSHeapSize,
        heapLimit: memory.jsHeapSizeLimit,
        usagePercent,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Wrap check with timeout
   */
  private async withTimeout(name: string, checkPromise: Promise<HealthCheckResult>): Promise<HealthCheckResult> {
    const timeoutPromise = new Promise<HealthCheckResult>((resolve) => {
      setTimeout(() => {
        resolve({
          name,
          status: 'unhealthy',
          latency: this.config.timeout,
          message: `Health check timed out after ${this.config.timeout}ms`,
          timestamp: new Date().toISOString(),
        });
      }, this.config.timeout);
    });

    return Promise.race([checkPromise, timeoutPromise]);
  }

  /**
   * Calculate overall health status from individual checks
   */
  private calculateOverallStatus(checks: HealthCheckResult[]): HealthStatus {
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    const hasDegraded = checks.some(c => c.status === 'degraded');

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }

  /**
   * Add a custom health check
   */
  addCheck(name: string, check: () => Promise<HealthCheckResult>): void {
    this.config.customChecks.push({ name, check });
  }

  /**
   * Remove a custom health check
   */
  removeCheck(name: string): void {
    this.config.customChecks = this.config.customChecks.filter(c => c.name !== name);
  }

  /**
   * Update configuration
   */
  configure(config: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear cached health check result
   */
  clearCache(): void {
    this.cachedResult = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get application uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - APP_START_TIME;
  }

  /**
   * Format uptime as human-readable string
   */
  formatUptime(): string {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}

// Export singleton instance
export const healthService = new HealthService();

// Convenience export
export const checkHealth = (force?: boolean) => healthService.checkHealth(force);
