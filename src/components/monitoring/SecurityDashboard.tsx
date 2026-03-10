/**
 * SecurityDashboard - Displays security events, failed auth attempts,
 * and audit log summaries from the security audit system.
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  RefreshCw,
  User,
  Clock,
} from "lucide-react";
import { getRecentAuditLogs, getSecurityStats, AuditSeverity } from "@/lib/security/security-audit";
import type { SecurityAuditEntry } from "@/lib/security/security-layers";

type TimeRange = "1h" | "6h" | "24h" | "7d";

const TIME_RANGES: Record<TimeRange, { label: string; ms: number }> = {
  "1h": { label: "Last Hour", ms: 60 * 60 * 1000 },
  "6h": { label: "Last 6 Hours", ms: 6 * 60 * 60 * 1000 },
  "24h": { label: "Last 24 Hours", ms: 24 * 60 * 60 * 1000 },
  "7d": { label: "Last 7 Days", ms: 7 * 24 * 60 * 60 * 1000 },
};

export default function SecurityDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [recentLogs, setRecentLogs] = useState<SecurityAuditEntry[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getSecurityStats> | null>(null);

  const refreshData = () => {
    const rangeMs = TIME_RANGES[timeRange].ms;
    const startTime = Date.now() - rangeMs;

    setRecentLogs(getRecentAuditLogs(50, { startTime }));
    setStats(getSecurityStats(undefined, rangeMs));
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30_000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const getSeverityColor = (severity: AuditSeverity | string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("login") || action.includes("auth")) return <Lock className="h-3 w-3" />;
    if (action.includes("permission") || action.includes("role")) return <Shield className="h-3 w-3" />;
    if (action.includes("violation") || action.includes("suspicious")) return <ShieldAlert className="h-3 w-3" />;
    return <ShieldCheck className="h-3 w-3" />;
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = Date.now();
    const diffMs = now - ts;

    if (diffMs < 60_000) return "Just now";
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Security Events</h3>
          <p className="text-sm text-muted-foreground">
            Authentication, authorization, and resource access audit trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Total Events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.totalEvents}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                Denied Events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.deniedEvents}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Critical Events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.bySeverity.critical + stats.bySeverity.high}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Auth Events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.byLayer.authentication}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Breakdown by Layer */}
      {stats && stats.totalEvents > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Events by Security Layer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byLayer).map(([layer, count]) => (
                <div key={layer} className="text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {layer.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Critical Events */}
      {stats && stats.recentCritical.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Recent Critical & Denied Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentCritical.map((log, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-md border text-sm">
                  {getActionIcon(log.action)}
                  <span className="font-medium capitalize">{log.action.replace(/_/g, " ")}</span>
                  <Badge className={getSeverityColor((log.metadata?.severity as string) || "medium")} variant="outline">
                    {(log.metadata?.severity as string) || "medium"}
                  </Badge>
                  <Badge variant={log.result === "denied" ? "destructive" : "secondary"}>
                    {log.result}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Security Logs</CardTitle>
          <CardDescription>Latest security-related events across all layers</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            <div className="space-y-1">
              {recentLogs.slice(0, 20).map((log, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b last:border-0 text-xs">
                  <span className="w-16 text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <Badge className={getSeverityColor((log.metadata?.severity as string) || "low")} variant="outline">
                    {log.layer.split("_")[0]}
                  </Badge>
                  <span className="font-mono">{log.action}</span>
                  <Badge variant={log.result === "allowed" ? "secondary" : "destructive"}>
                    {log.result}
                  </Badge>
                  {log.userId && (
                    <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      {log.userId.slice(0, 8)}...
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No security events recorded in this time period.</p>
              <p className="text-xs mt-1">Events are captured as users interact with the system.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
