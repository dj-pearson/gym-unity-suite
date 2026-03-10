/**
 * MetricsDashboard - Displays application performance metrics
 * from the APM service. Shows Web Vitals, API response times,
 * and request volume data.
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Clock,
  Zap,
  TrendingUp,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface MetricSnapshot {
  label: string;
  value: string;
  unit: string;
  status: "good" | "warning" | "critical";
  description: string;
}

interface ApiMetric {
  endpoint: string;
  avgResponseMs: number;
  requestCount: number;
  errorRate: number;
}

export default function MetricsDashboard() {
  const [webVitals, setWebVitals] = useState<MetricSnapshot[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetric[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [dbResponseTime, setDbResponseTime] = useState<number | null>(null);

  const collectMetrics = async () => {
    // Collect Web Vitals from performance API
    const vitals: MetricSnapshot[] = [];

    if (typeof window !== "undefined" && window.performance) {
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];

        vitals.push({
          label: "Page Load Time",
          value: Math.round(nav.loadEventEnd - nav.startTime).toString(),
          unit: "ms",
          status: nav.loadEventEnd - nav.startTime < 2000 ? "good" : nav.loadEventEnd - nav.startTime < 4000 ? "warning" : "critical",
          description: "Time from navigation start to load event completion",
        });

        vitals.push({
          label: "DOM Content Loaded",
          value: Math.round(nav.domContentLoadedEventEnd - nav.startTime).toString(),
          unit: "ms",
          status: nav.domContentLoadedEventEnd - nav.startTime < 1500 ? "good" : "warning",
          description: "Time until DOM is fully parsed and loaded",
        });

        vitals.push({
          label: "Time to First Byte",
          value: Math.round(nav.responseStart - nav.requestStart).toString(),
          unit: "ms",
          status: nav.responseStart - nav.requestStart < 200 ? "good" : nav.responseStart - nav.requestStart < 500 ? "warning" : "critical",
          description: "Server response time for initial document",
        });

        vitals.push({
          label: "DNS Lookup",
          value: Math.round(nav.domainLookupEnd - nav.domainLookupStart).toString(),
          unit: "ms",
          status: nav.domainLookupEnd - nav.domainLookupStart < 50 ? "good" : "warning",
          description: "DNS resolution time",
        });
      }

      // Resource metrics
      const resourceEntries = performance.getEntriesByType("resource");
      const jsResources = resourceEntries.filter(r => r.name.endsWith(".js") || r.name.includes(".js?"));
      const cssResources = resourceEntries.filter(r => r.name.endsWith(".css") || r.name.includes(".css?"));

      vitals.push({
        label: "JS Bundle Requests",
        value: jsResources.length.toString(),
        unit: "files",
        status: jsResources.length < 20 ? "good" : jsResources.length < 40 ? "warning" : "critical",
        description: "Number of JavaScript files loaded",
      });

      vitals.push({
        label: "CSS Requests",
        value: cssResources.length.toString(),
        unit: "files",
        status: cssResources.length < 10 ? "good" : "warning",
        description: "Number of CSS files loaded",
      });

      // Memory usage if available
      const perfMemory = (performance as any).memory;
      if (perfMemory) {
        vitals.push({
          label: "JS Heap Used",
          value: (perfMemory.usedJSHeapSize / (1024 * 1024)).toFixed(1),
          unit: "MB",
          status: perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit < 0.7 ? "good" : "warning",
          description: "Current JavaScript heap memory usage",
        });
      }
    }

    setWebVitals(vitals);

    // Measure Supabase DB response time
    const dbStart = performance.now();
    try {
      await supabase.from("profiles").select("id").limit(1);
      const dbEnd = performance.now();
      setDbResponseTime(Math.round(dbEnd - dbStart));
    } catch {
      setDbResponseTime(null);
    }

    // Collect API metrics from resource timing
    const apiCalls: Record<string, { totalMs: number; count: number; errors: number }> = {};
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    resources.forEach((r) => {
      if (r.name.includes("supabase") || r.name.includes("functions")) {
        const url = new URL(r.name);
        const endpoint = url.pathname.split("/").slice(0, 4).join("/");
        if (!apiCalls[endpoint]) {
          apiCalls[endpoint] = { totalMs: 0, count: 0, errors: 0 };
        }
        apiCalls[endpoint].totalMs += r.responseEnd - r.requestStart;
        apiCalls[endpoint].count++;
        if (r.responseStatus && r.responseStatus >= 400) {
          apiCalls[endpoint].errors++;
        }
      }
    });

    setApiMetrics(
      Object.entries(apiCalls)
        .map(([endpoint, data]) => ({
          endpoint,
          avgResponseMs: Math.round(data.totalMs / data.count),
          requestCount: data.count,
          errorRate: data.count > 0 ? Math.round((data.errors / data.count) * 100) : 0,
        }))
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 10)
    );

    setLastRefresh(new Date());
  };

  useEffect(() => {
    collectMetrics();
  }, []);

  const getStatusColor = (status: "good" | "warning" | "critical") => {
    switch (status) {
      case "good": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "warning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  };

  const dbStatus = useMemo(() => {
    if (dbResponseTime === null) return "critical";
    if (dbResponseTime < 200) return "good";
    if (dbResponseTime < 500) return "warning";
    return "critical";
  }, [dbResponseTime]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Performance Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={collectMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Database Response Time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Database Response Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">
              {dbResponseTime !== null ? `${dbResponseTime}ms` : "N/A"}
            </span>
            <Badge className={getStatusColor(dbStatus)}>
              {dbStatus === "good" ? "Healthy" : dbStatus === "warning" ? "Slow" : "Degraded"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Round-trip time for a simple Supabase query
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Web Vitals
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            API Calls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {webVitals.map((metric) => (
              <Card key={metric.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{metric.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    <Badge className={getStatusColor(metric.status)}>{metric.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
            {webVitals.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No performance data available yet. Navigate around the app and refresh.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="api">
          {apiMetrics.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <span>Endpoint</span>
                    <span className="text-right">Avg Response</span>
                    <span className="text-right">Requests</span>
                    <span className="text-right">Error Rate</span>
                  </div>
                  {apiMetrics.map((metric) => (
                    <div key={metric.endpoint} className="grid grid-cols-4 text-sm py-1">
                      <span className="truncate font-mono text-xs">{metric.endpoint}</span>
                      <span className="text-right">{metric.avgResponseMs}ms</span>
                      <span className="text-right">{metric.requestCount}</span>
                      <span className="text-right">
                        <Badge variant={metric.errorRate > 10 ? "destructive" : "secondary"}>
                          {metric.errorRate}%
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No API call data captured yet. Use the app and refresh.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
