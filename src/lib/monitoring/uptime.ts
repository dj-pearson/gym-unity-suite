/**
 * Uptime Monitoring Configuration
 *
 * Provides configuration for external uptime monitoring services
 * like Pingdom, UptimeRobot, Better Uptime, or StatusCake.
 *
 * @module monitoring/uptime
 */

import { logger } from './logger';
import { healthService } from './health';
import { supabaseConfig, edgeFunctions } from '@/integrations/supabase/client';

// Uptime check types
export type CheckType = 'http' | 'tcp' | 'ping' | 'dns' | 'ssl';
export type AlertChannel = 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';

// Uptime check configuration
export interface UptimeCheckConfig {
  name: string;
  url: string;
  type: CheckType;
  interval: number; // Check interval in seconds
  timeout: number; // Request timeout in seconds
  enabled: boolean;
  regions: string[];
  expectedStatus: number[];
  expectedResponse?: string;
  headers?: Record<string, string>;
  alerts: {
    channels: AlertChannel[];
    threshold: number; // Number of failures before alerting
    escalation: boolean;
  };
  ssl?: {
    checkCertificate: boolean;
    warnDaysBeforeExpiry: number;
  };
}

// Monitoring service configuration
export interface UptimeMonitoringConfig {
  enabled: boolean;
  provider: 'uptimerobot' | 'pingdom' | 'betteruptime' | 'statuscake' | 'custom';
  apiKey?: string;
  webhookUrl?: string;
  checks: UptimeCheckConfig[];
  statusPage?: {
    enabled: boolean;
    url: string;
    publicMetrics: boolean;
  };
  maintenance?: {
    enabled: boolean;
    schedule?: string; // Cron expression
  };
}

// Default monitoring checks - using dynamic configuration from Supabase client
const createDefaultChecks = (): UptimeCheckConfig[] => [
  // Main application
  {
    name: 'Gym Unity Suite - Main',
    url: 'https://gym-unity-suite.com',
    type: 'http',
    interval: 60, // 1 minute
    timeout: 30,
    enabled: true,
    regions: ['us-east', 'us-west', 'eu-west', 'ap-southeast'],
    expectedStatus: [200, 301, 302],
    alerts: {
      channels: ['email', 'slack'],
      threshold: 3,
      escalation: true,
    },
    ssl: {
      checkCertificate: true,
      warnDaysBeforeExpiry: 30,
    },
  },
  // Health check endpoint - uses functions subdomain for self-hosted
  {
    name: 'Gym Unity Suite - Health',
    url: edgeFunctions.getUrl('health-check'),
    type: 'http',
    interval: 60,
    timeout: 30,
    enabled: true,
    regions: ['us-east', 'eu-west'],
    expectedStatus: [200],
    expectedResponse: '"status":"healthy"',
    alerts: {
      channels: ['email', 'slack', 'pagerduty'],
      threshold: 2,
      escalation: true,
    },
  },
  // Readiness probe - uses functions subdomain for self-hosted
  {
    name: 'Gym Unity Suite - Readiness',
    url: edgeFunctions.getUrl('health-check/ready'),
    type: 'http',
    interval: 60,
    timeout: 15,
    enabled: true,
    regions: ['us-east'],
    expectedStatus: [200],
    alerts: {
      channels: ['email', 'slack'],
      threshold: 3,
      escalation: false,
    },
  },
  // API endpoint - uses api subdomain
  {
    name: 'Gym Unity Suite - API',
    url: `${supabaseConfig.url}/rest/v1/`,
    type: 'http',
    interval: 120, // 2 minutes
    timeout: 30,
    enabled: true,
    regions: ['us-east', 'eu-west'],
    expectedStatus: [200, 401], // 401 is expected without auth
    headers: {
      'apikey': supabaseConfig.anonKey,
    },
    alerts: {
      channels: ['email', 'slack'],
      threshold: 3,
      escalation: true,
    },
  },
  // SSL certificate check
  {
    name: 'Gym Unity Suite - SSL Certificate',
    url: 'https://gym-unity-suite.com',
    type: 'ssl',
    interval: 3600, // 1 hour
    timeout: 30,
    enabled: true,
    regions: ['us-east'],
    expectedStatus: [200],
    alerts: {
      channels: ['email'],
      threshold: 1,
      escalation: false,
    },
    ssl: {
      checkCertificate: true,
      warnDaysBeforeExpiry: 30,
    },
  },
];

// Default checks instance
const DEFAULT_CHECKS: UptimeCheckConfig[] = createDefaultChecks();

// Default configuration
const DEFAULT_CONFIG: UptimeMonitoringConfig = {
  enabled: true,
  provider: 'custom',
  checks: DEFAULT_CHECKS,
  statusPage: {
    enabled: false,
    url: 'https://status.gym-unity-suite.com',
    publicMetrics: true,
  },
  maintenance: {
    enabled: false,
  },
};

/**
 * UptimeMonitoringService - Manages uptime monitoring configuration
 */
class UptimeMonitoringService {
  private config: UptimeMonitoringConfig;
  private checkIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(config?: Partial<UptimeMonitoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start local uptime checks (for development/testing)
   */
  startLocalChecks(): void {
    if (!this.config.enabled) {
      logger.info('Uptime monitoring disabled', { component: 'uptime' });
      return;
    }

    logger.info('Starting local uptime checks', {
      component: 'uptime',
      metadata: { checksCount: this.config.checks.length },
    });

    for (const check of this.config.checks) {
      if (!check.enabled) continue;

      const interval = setInterval(
        () => this.runCheck(check),
        check.interval * 1000
      );

      this.checkIntervals.set(check.name, interval);
    }
  }

  /**
   * Stop local uptime checks
   */
  stopLocalChecks(): void {
    for (const [name, interval] of this.checkIntervals) {
      clearInterval(interval);
      logger.debug(`Stopped uptime check: ${name}`, { component: 'uptime' });
    }
    this.checkIntervals.clear();
  }

  /**
   * Run a single uptime check
   */
  private async runCheck(check: UptimeCheckConfig): Promise<void> {
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), check.timeout * 1000);

      const response = await fetch(check.url, {
        method: 'GET',
        headers: check.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = performance.now() - start;
      const isStatusOk = check.expectedStatus.includes(response.status);

      let isResponseOk = true;
      if (check.expectedResponse) {
        const body = await response.text();
        isResponseOk = body.includes(check.expectedResponse);
      }

      const isHealthy = isStatusOk && isResponseOk;

      logger.info(`Uptime check: ${check.name}`, {
        component: 'uptime',
        metadata: {
          status: isHealthy ? 'up' : 'down',
          latency: `${latency.toFixed(0)}ms`,
          httpStatus: response.status,
        },
      });

      if (!isHealthy) {
        this.handleCheckFailure(check, response.status, latency);
      }
    } catch (error) {
      const latency = performance.now() - start;

      logger.error(`Uptime check failed: ${check.name}`, error, {
        component: 'uptime',
        metadata: {
          latency: `${latency.toFixed(0)}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      this.handleCheckFailure(check, 0, latency, error);
    }
  }

  /**
   * Handle check failure
   */
  private handleCheckFailure(
    check: UptimeCheckConfig,
    statusCode: number,
    latency: number,
    error?: unknown
  ): void {
    // In production, this would trigger alerts via the configured channels
    // For now, we just log the failure
    logger.warn(`Service degradation detected: ${check.name}`, {
      component: 'uptime',
      metadata: {
        checkName: check.name,
        url: check.url,
        statusCode,
        latency,
        error: error instanceof Error ? error.message : undefined,
        alertChannels: check.alerts.channels,
      },
    });
  }

  /**
   * Get configuration for UptimeRobot
   */
  generateUptimeRobotConfig(): object {
    return {
      monitors: this.config.checks
        .filter(c => c.enabled)
        .map(check => ({
          friendly_name: check.name,
          url: check.url,
          type: this.mapCheckType(check.type, 'uptimerobot'),
          interval: check.interval,
          timeout: check.timeout,
          http_method: 1, // GET
          alert_contacts: check.alerts.channels.join(','),
        })),
    };
  }

  /**
   * Get configuration for Pingdom
   */
  generatePingdomConfig(): object {
    return {
      checks: this.config.checks
        .filter(c => c.enabled)
        .map(check => ({
          name: check.name,
          host: new URL(check.url).hostname,
          type: this.mapCheckType(check.type, 'pingdom'),
          resolution: check.interval / 60, // Minutes
          sendnotificationwhendown: check.alerts.threshold,
        })),
    };
  }

  /**
   * Get configuration for Better Uptime
   */
  generateBetterUptimeConfig(): object {
    return {
      monitors: this.config.checks
        .filter(c => c.enabled)
        .map(check => ({
          monitor_type: this.mapCheckType(check.type, 'betteruptime'),
          url: check.url,
          pronounceable_name: check.name,
          check_frequency: check.interval,
          request_timeout: check.timeout,
          confirmation_period: check.alerts.threshold * check.interval,
          regions: check.regions,
          expected_status_codes: check.expectedStatus,
          ...(check.expectedResponse && {
            match_type: 'contains',
            required_keyword: check.expectedResponse,
          }),
        })),
    };
  }

  /**
   * Map check type to provider-specific type
   */
  private mapCheckType(type: CheckType, provider: string): string | number {
    const mappings: Record<string, Record<CheckType, string | number>> = {
      uptimerobot: {
        http: 1,
        tcp: 4,
        ping: 3,
        dns: 5,
        ssl: 1, // HTTP with SSL check
      },
      pingdom: {
        http: 'http',
        tcp: 'tcp',
        ping: 'ping',
        dns: 'dns',
        ssl: 'http',
      },
      betteruptime: {
        http: 'status',
        tcp: 'tcp',
        ping: 'ping',
        dns: 'dns',
        ssl: 'ssl',
      },
    };

    return mappings[provider]?.[type] || type;
  }

  /**
   * Run immediate health check
   */
  async checkNow(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: string;
      latency: number;
    }>;
  }> {
    const results = await Promise.all(
      this.config.checks
        .filter(c => c.enabled)
        .map(async check => {
          const start = performance.now();
          try {
            const response = await fetch(check.url, {
              method: 'GET',
              headers: check.headers,
            });
            return {
              name: check.name,
              status: check.expectedStatus.includes(response.status) ? 'up' : 'down',
              latency: performance.now() - start,
            };
          } catch {
            return {
              name: check.name,
              status: 'down',
              latency: performance.now() - start,
            };
          }
        })
    );

    const hasDown = results.some(r => r.status === 'down');

    return {
      status: hasDown ? 'unhealthy' : 'healthy',
      checks: results,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): UptimeMonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  configure(config: Partial<UptimeMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add a new check
   */
  addCheck(check: UptimeCheckConfig): void {
    this.config.checks.push(check);
  }

  /**
   * Remove a check
   */
  removeCheck(name: string): void {
    this.config.checks = this.config.checks.filter(c => c.name !== name);
    const interval = this.checkIntervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(name);
    }
  }

  /**
   * Export configuration for external monitoring service
   */
  exportConfig(provider: UptimeMonitoringConfig['provider']): string {
    switch (provider) {
      case 'uptimerobot':
        return JSON.stringify(this.generateUptimeRobotConfig(), null, 2);
      case 'pingdom':
        return JSON.stringify(this.generatePingdomConfig(), null, 2);
      case 'betteruptime':
        return JSON.stringify(this.generateBetterUptimeConfig(), null, 2);
      default:
        return JSON.stringify(this.config, null, 2);
    }
  }
}

// Export singleton instance
export const uptimeMonitoring = new UptimeMonitoringService();

// Convenience exports
export const startUptimeChecks = () => uptimeMonitoring.startLocalChecks();
export const stopUptimeChecks = () => uptimeMonitoring.stopLocalChecks();
export const checkUptimeNow = () => uptimeMonitoring.checkNow();
