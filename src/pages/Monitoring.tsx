import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import SystemHealthDashboard from "@/components/monitoring/SystemHealthDashboard";
import AlertsPanel from "@/components/monitoring/AlertsPanel";
import MetricsDashboard from "@/components/monitoring/MetricsDashboard";
import SecurityDashboard from "@/components/monitoring/SecurityDashboard";
import { Activity, Bell, BarChart3, Shield } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";

function TabErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
      <p className="text-sm mb-2">Something went wrong loading this section.</p>
      <button onClick={resetErrorBoundary} className="text-primary underline text-sm">
        Try again
      </button>
    </div>
  );
}

/**
 * Monitoring Page
 *
 * Provides system health monitoring, alerting, performance metrics,
 * and security dashboards for administrators and DevOps teams.
 */
export default function MonitoringPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor system health, performance metrics, and security alerts
            </p>
          </div>
        </div>

        <Tabs defaultValue="health" className="space-y-4">
          <TabsList>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-4">
            <ErrorBoundary FallbackComponent={TabErrorFallback}>
              <SystemHealthDashboard />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <ErrorBoundary FallbackComponent={TabErrorFallback}>
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                <AlertsPanel />
                <div className="space-y-4">
                  {/* Alert summary cards could go here */}
                </div>
              </div>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <ErrorBoundary FallbackComponent={TabErrorFallback}>
              <MetricsDashboard />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <ErrorBoundary FallbackComponent={TabErrorFallback}>
              <SecurityDashboard />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
