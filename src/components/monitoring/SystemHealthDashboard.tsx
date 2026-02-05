import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { invokeEdgeFunction } from "@/integrations/supabase/client";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  TrendingUp,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: string; duration?: number; error?: string }>;
  metrics: {
    totalQueries: number;
    successRate: number;
    averageDuration: number;
    slowQueries: number;
    byTable: Record<string, { count: number; avgDuration: number }>;
  };
}

interface QueryMetric {
  table: string;
  operation: string;
  duration: number;
  success: boolean;
  timestamp: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "healthy":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Healthy
        </Badge>
      );
    case "degraded":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Degraded
        </Badge>
      );
    case "unhealthy":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="mr-1 h-3 w-3" />
          Unhealthy
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const MetricCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: "up" | "down" | "neutral";
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          {trend === "up" && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
          {trend === "down" && <TrendingUp className="h-3 w-3 mr-1 text-red-500 rotate-180" />}
          {description}
        </p>
      )}
    </CardContent>
  </Card>
);

const HealthCheckRow = ({
  name,
  check,
}: {
  name: string;
  check: { status: string; duration?: number; error?: string };
}) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0">
    <div className="flex items-center gap-2">
      {check.status === "healthy" ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="font-medium capitalize">{name}</span>
    </div>
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      {check.duration !== undefined && (
        <span className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {check.duration.toFixed(0)}ms
        </span>
      )}
      {check.error && (
        <span className="text-red-500 text-xs">{check.error}</span>
      )}
    </div>
  </div>
);

const TableMetricsTable = ({
  metrics,
}: {
  metrics: Record<string, { count: number; avgDuration: number }>;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 px-2 font-medium">Table</th>
          <th className="text-right py-2 px-2 font-medium">Queries</th>
          <th className="text-right py-2 px-2 font-medium">Avg Duration</th>
          <th className="text-right py-2 px-2 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(metrics).map(([table, stats]) => (
          <tr key={table} className="border-b last:border-0 hover:bg-muted/50">
            <td className="py-2 px-2 font-mono text-xs">{table}</td>
            <td className="text-right py-2 px-2">{stats.count}</td>
            <td className="text-right py-2 px-2">
              <span
                className={
                  stats.avgDuration > 1000
                    ? "text-red-500"
                    : stats.avgDuration > 500
                    ? "text-yellow-500"
                    : "text-green-500"
                }
              >
                {stats.avgDuration.toFixed(0)}ms
              </span>
            </td>
            <td className="text-right py-2 px-2">
              {stats.avgDuration > 1000 ? (
                <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function SystemHealthDashboard() {
  const {
    data: healthData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<HealthStatus>({
    queryKey: ["system-health"],
    queryFn: async () => {
      // Call the health-check edge function
      const { data, error } = await invokeEdgeFunction("health-check");
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Health Data</AlertTitle>
        <AlertDescription>
          Failed to fetch system health status. Please try again.
          <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { status, checks, metrics } = healthData || {
    status: "unknown",
    checks: {},
    metrics: {
      totalQueries: 0,
      successRate: 1,
      averageDuration: 0,
      slowQueries: 0,
      byTable: {},
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
          <StatusBadge status={status} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status Alert */}
      {status === "degraded" && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Performance Degradation Detected</AlertTitle>
          <AlertDescription>
            Some services are experiencing slower than normal response times.
            {metrics.slowQueries > 0 && ` ${metrics.slowQueries} slow queries detected.`}
          </AlertDescription>
        </Alert>
      )}

      {status === "unhealthy" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>System Unhealthy</AlertTitle>
          <AlertDescription>
            Critical services are unavailable. Please check the infrastructure status.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Queries"
          value={metrics.totalQueries.toLocaleString()}
          icon={Database}
          description="In current session"
        />
        <MetricCard
          title="Success Rate"
          value={`${(metrics.successRate * 100).toFixed(1)}%`}
          icon={CheckCircle}
          description={metrics.successRate > 0.95 ? "Within threshold" : "Below threshold"}
          trend={metrics.successRate > 0.95 ? "up" : "down"}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.averageDuration.toFixed(0)}ms`}
          icon={Clock}
          description={
            metrics.averageDuration < 200
              ? "Excellent"
              : metrics.averageDuration < 500
              ? "Good"
              : "Needs attention"
          }
          trend={metrics.averageDuration < 500 ? "up" : "down"}
        />
        <MetricCard
          title="Slow Queries"
          value={metrics.slowQueries}
          icon={AlertTriangle}
          description={metrics.slowQueries > 0 ? "Queries > 1000ms" : "All queries fast"}
          trend={metrics.slowQueries === 0 ? "up" : "down"}
        />
      </div>

      {/* Health Checks */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Service Health Checks
            </CardTitle>
            <CardDescription>Real-time status of critical services</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(checks).length > 0 ? (
              Object.entries(checks).map(([name, check]) => (
                <HealthCheckRow key={name} name={name} check={check} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No health checks available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Database Performance
            </CardTitle>
            <CardDescription>Query metrics by table</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.byTable).length > 0 ? (
              <TableMetricsTable metrics={metrics.byTable} />
            ) : (
              <p className="text-sm text-muted-foreground">No query metrics available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Query Success Rate</CardTitle>
          <CardDescription>Overall API success rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span className="font-medium">{(metrics.successRate * 100).toFixed(2)}%</span>
            </div>
            <Progress
              value={metrics.successRate * 100}
              className={
                metrics.successRate > 0.99
                  ? "[&>div]:bg-green-500"
                  : metrics.successRate > 0.95
                  ? "[&>div]:bg-yellow-500"
                  : "[&>div]:bg-red-500"
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: 99.5%</span>
              <span>
                {metrics.successRate >= 0.995 ? (
                  <span className="text-green-500">Target met</span>
                ) : (
                  <span className="text-yellow-500">Below target</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
