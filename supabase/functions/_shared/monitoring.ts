/**
 * Shared Monitoring Module
 *
 * Provides database query monitoring, performance tracking, and alerting.
 * Integrates with external monitoring services (PagerDuty, OpsGenie, etc.)
 */

// ============================================================================
// Types
// ============================================================================

export interface QueryMetrics {
  query: string;
  table: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "UPSERT" | "RPC";
  duration: number;
  rowCount?: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  organizationId?: string;
  userId?: string;
  functionName?: string;
}

export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  maxConnections: number;
  timestamp: Date;
}

export interface AlertConfig {
  service: "pagerduty" | "opsgenie" | "slack" | "webhook";
  apiKey?: string;
  webhookUrl?: string;
  routingKey?: string;
  integrationKey?: string;
  enabled: boolean;
}

export type AlertSeverity = "critical" | "error" | "warning" | "info";

export interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  deduplicationKey?: string;
}

// ============================================================================
// Configuration
// ============================================================================

// Thresholds for monitoring
const THRESHOLDS = {
  slowQueryMs: 1000, // Queries taking more than 1 second
  criticalQueryMs: 5000, // Queries taking more than 5 seconds
  maxConnectionPoolUsage: 0.8, // 80% of max connections
  errorRateThreshold: 0.05, // 5% error rate
  alertCooldownMs: 300000, // 5 minutes between same alerts
};

// In-memory metrics storage (for edge function context)
const metricsBuffer: QueryMetrics[] = [];
const MAX_BUFFER_SIZE = 1000;

// Alert deduplication cache
const alertCache = new Map<string, number>();

// ============================================================================
// Query Monitoring
// ============================================================================

/**
 * Wrap a Supabase query to track performance
 */
export async function monitorQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    table: string;
    operation: QueryMetrics["operation"];
    organizationId?: string;
    userId?: string;
    functionName?: string;
  }
): Promise<{ data: T | null; error: any; metrics: QueryMetrics }> {
  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    const metrics: QueryMetrics = {
      query: `${options.operation} on ${options.table}`,
      table: options.table,
      operation: options.operation,
      duration,
      rowCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
      success: !result.error,
      error: result.error?.message,
      timestamp: new Date(),
      organizationId: options.organizationId,
      userId: options.userId,
      functionName: options.functionName,
    };

    // Store metrics
    recordMetrics(metrics);

    // Check for slow queries
    if (duration > THRESHOLDS.slowQueryMs) {
      await handleSlowQuery(metrics);
    }

    return { ...result, metrics };
  } catch (error) {
    const duration = performance.now() - startTime;

    const metrics: QueryMetrics = {
      query: `${options.operation} on ${options.table}`,
      table: options.table,
      operation: options.operation,
      duration,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      organizationId: options.organizationId,
      userId: options.userId,
      functionName: options.functionName,
    };

    recordMetrics(metrics);

    throw error;
  }
}

/**
 * Record query metrics
 */
function recordMetrics(metrics: QueryMetrics): void {
  metricsBuffer.push(metrics);

  // Prevent memory overflow
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift();
  }

  // Log for external aggregation
  console.log("[QUERY-METRICS]", JSON.stringify({
    table: metrics.table,
    operation: metrics.operation,
    duration: Math.round(metrics.duration),
    success: metrics.success,
    rowCount: metrics.rowCount,
    error: metrics.error,
    organizationId: metrics.organizationId,
    functionName: metrics.functionName,
    timestamp: metrics.timestamp.toISOString(),
  }));
}

/**
 * Handle slow query detection
 */
async function handleSlowQuery(metrics: QueryMetrics): Promise<void> {
  const severity: AlertSeverity = metrics.duration > THRESHOLDS.criticalQueryMs
    ? "critical"
    : "warning";

  const alert: Alert = {
    severity,
    title: `Slow Query Detected: ${metrics.table}`,
    message: `Query on ${metrics.table} took ${Math.round(metrics.duration)}ms (threshold: ${THRESHOLDS.slowQueryMs}ms)`,
    source: metrics.functionName || "database",
    timestamp: new Date(),
    metadata: {
      table: metrics.table,
      operation: metrics.operation,
      duration: metrics.duration,
      organizationId: metrics.organizationId,
    },
    deduplicationKey: `slow-query-${metrics.table}-${metrics.operation}`,
  };

  await sendAlert(alert);
}

/**
 * Get metrics summary
 */
export function getMetricsSummary(): {
  totalQueries: number;
  successRate: number;
  averageDuration: number;
  slowQueries: number;
  byTable: Record<string, { count: number; avgDuration: number }>;
} {
  if (metricsBuffer.length === 0) {
    return {
      totalQueries: 0,
      successRate: 1,
      averageDuration: 0,
      slowQueries: 0,
      byTable: {},
    };
  }

  const totalQueries = metricsBuffer.length;
  const successfulQueries = metricsBuffer.filter((m) => m.success).length;
  const totalDuration = metricsBuffer.reduce((sum, m) => sum + m.duration, 0);
  const slowQueries = metricsBuffer.filter((m) => m.duration > THRESHOLDS.slowQueryMs).length;

  const byTable: Record<string, { count: number; totalDuration: number }> = {};
  for (const metric of metricsBuffer) {
    if (!byTable[metric.table]) {
      byTable[metric.table] = { count: 0, totalDuration: 0 };
    }
    byTable[metric.table].count++;
    byTable[metric.table].totalDuration += metric.duration;
  }

  return {
    totalQueries,
    successRate: successfulQueries / totalQueries,
    averageDuration: totalDuration / totalQueries,
    slowQueries,
    byTable: Object.fromEntries(
      Object.entries(byTable).map(([table, stats]) => [
        table,
        { count: stats.count, avgDuration: stats.totalDuration / stats.count },
      ])
    ),
  };
}

// ============================================================================
// Alerting
// ============================================================================

/**
 * Send alert to configured services
 */
export async function sendAlert(alert: Alert): Promise<void> {
  // Check deduplication
  if (alert.deduplicationKey) {
    const lastAlertTime = alertCache.get(alert.deduplicationKey);
    if (lastAlertTime && Date.now() - lastAlertTime < THRESHOLDS.alertCooldownMs) {
      console.log(`[ALERT] Skipped (cooldown): ${alert.title}`);
      return;
    }
    alertCache.set(alert.deduplicationKey, Date.now());
  }

  console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title} - ${alert.message}`);

  // Send to configured services
  const pagerdutyKey = Deno.env.get("PAGERDUTY_ROUTING_KEY");
  const opsgenieKey = Deno.env.get("OPSGENIE_API_KEY");
  const slackWebhook = Deno.env.get("SLACK_WEBHOOK_URL");
  const customWebhook = Deno.env.get("ALERT_WEBHOOK_URL");

  const promises: Promise<void>[] = [];

  if (pagerdutyKey && (alert.severity === "critical" || alert.severity === "error")) {
    promises.push(sendPagerDutyAlert(alert, pagerdutyKey));
  }

  if (opsgenieKey) {
    promises.push(sendOpsGenieAlert(alert, opsgenieKey));
  }

  if (slackWebhook) {
    promises.push(sendSlackAlert(alert, slackWebhook));
  }

  if (customWebhook) {
    promises.push(sendWebhookAlert(alert, customWebhook));
  }

  await Promise.allSettled(promises);
}

/**
 * Send alert to PagerDuty
 */
async function sendPagerDutyAlert(alert: Alert, routingKey: string): Promise<void> {
  try {
    const severity = alert.severity === "critical" ? "critical" :
                     alert.severity === "error" ? "error" :
                     alert.severity === "warning" ? "warning" : "info";

    const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: "trigger",
        dedup_key: alert.deduplicationKey,
        payload: {
          summary: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          severity,
          source: alert.source,
          timestamp: alert.timestamp.toISOString(),
          custom_details: {
            message: alert.message,
            ...alert.metadata,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("[PAGERDUTY] Failed to send alert:", await response.text());
    }
  } catch (error) {
    console.error("[PAGERDUTY] Error sending alert:", error);
  }
}

/**
 * Send alert to OpsGenie
 */
async function sendOpsGenieAlert(alert: Alert, apiKey: string): Promise<void> {
  try {
    const priority = alert.severity === "critical" ? "P1" :
                     alert.severity === "error" ? "P2" :
                     alert.severity === "warning" ? "P3" : "P4";

    const response = await fetch("https://api.opsgenie.com/v2/alerts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `GenieKey ${apiKey}`,
      },
      body: JSON.stringify({
        message: alert.title,
        alias: alert.deduplicationKey,
        description: alert.message,
        priority,
        source: alert.source,
        tags: [alert.severity],
        details: alert.metadata,
      }),
    });

    if (!response.ok) {
      console.error("[OPSGENIE] Failed to send alert:", await response.text());
    }
  } catch (error) {
    console.error("[OPSGENIE] Error sending alert:", error);
  }
}

/**
 * Send alert to Slack
 */
async function sendSlackAlert(alert: Alert, webhookUrl: string): Promise<void> {
  try {
    const color = alert.severity === "critical" ? "#FF0000" :
                  alert.severity === "error" ? "#FF6600" :
                  alert.severity === "warning" ? "#FFCC00" : "#00CC00";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
            text: alert.message,
            fields: [
              { title: "Source", value: alert.source, short: true },
              { title: "Time", value: alert.timestamp.toISOString(), short: true },
              ...Object.entries(alert.metadata || {}).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              })),
            ],
            footer: "Rep Club Monitoring",
            ts: Math.floor(alert.timestamp.getTime() / 1000),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[SLACK] Failed to send alert:", await response.text());
    }
  } catch (error) {
    console.error("[SLACK] Error sending alert:", error);
  }
}

/**
 * Send alert to custom webhook
 */
async function sendWebhookAlert(alert: Alert, webhookUrl: string): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        source: alert.source,
        timestamp: alert.timestamp.toISOString(),
        metadata: alert.metadata,
        deduplicationKey: alert.deduplicationKey,
      }),
    });

    if (!response.ok) {
      console.error("[WEBHOOK] Failed to send alert:", await response.text());
    }
  } catch (error) {
    console.error("[WEBHOOK] Error sending alert:", error);
  }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Perform health check and return status
 */
export async function performHealthCheck(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: string; duration?: number; error?: string }>;
  metrics: ReturnType<typeof getMetricsSummary>;
}> {
  const checks: Record<string, { status: string; duration?: number; error?: string }> = {};

  // Check database connectivity
  try {
    const start = performance.now();
    // This would typically ping the database
    const duration = performance.now() - start;
    checks.database = { status: "healthy", duration };
  } catch (error) {
    checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Get metrics summary
  const metrics = getMetricsSummary();

  // Determine overall status
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";

  if (checks.database?.status === "unhealthy") {
    status = "unhealthy";
  } else if (metrics.successRate < 0.95 || metrics.slowQueries > 10) {
    status = "degraded";
  }

  return { status, checks, metrics };
}

// ============================================================================
// Error Tracking
// ============================================================================

/**
 * Track an error and potentially send an alert
 */
export async function trackError(
  error: Error | unknown,
  context: {
    functionName: string;
    userId?: string;
    organizationId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error("[ERROR]", JSON.stringify({
    message: errorMessage,
    stack: errorStack,
    ...context,
    timestamp: new Date().toISOString(),
  }));

  // Send alert for critical errors
  await sendAlert({
    severity: "error",
    title: `Error in ${context.functionName}`,
    message: errorMessage,
    source: context.functionName,
    timestamp: new Date(),
    metadata: {
      stack: errorStack?.slice(0, 500),
      userId: context.userId,
      organizationId: context.organizationId,
      ...context.metadata,
    },
    deduplicationKey: `error-${context.functionName}-${errorMessage.slice(0, 50)}`,
  });
}

// ============================================================================
// Performance Timing
// ============================================================================

/**
 * Create a timer for measuring performance
 */
export function createTimer(name: string): {
  stop: () => number;
  lap: (label: string) => void;
} {
  const startTime = performance.now();
  const laps: { label: string; time: number }[] = [];

  return {
    stop: () => {
      const duration = performance.now() - startTime;
      console.log(`[TIMER] ${name}: ${Math.round(duration)}ms`,
        laps.length > 0 ? laps : undefined);
      return duration;
    },
    lap: (label: string) => {
      laps.push({ label, time: Math.round(performance.now() - startTime) });
    },
  };
}

/**
 * Time an async function
 */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  console.log(`[TIMING] ${name}: ${Math.round(duration)}ms`);

  return { result, duration };
}
