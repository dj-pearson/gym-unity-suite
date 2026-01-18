import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import SystemHealthDashboard from "@/components/monitoring/SystemHealthDashboard";
import AlertsPanel from "@/components/monitoring/AlertsPanel";
import { Activity, Bell, BarChart3, Shield } from "lucide-react";

/**
 * Monitoring Page
 *
 * Provides system health monitoring, alerting, and security dashboards
 * for administrators and DevOps teams.
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
            <SystemHealthDashboard />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              <AlertsPanel />
              <div className="space-y-4">
                {/* Alert summary cards could go here */}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Metrics Dashboard</h3>
              <p className="max-w-md mx-auto">
                Detailed performance metrics, query analytics, and business KPIs
                will be displayed here. Configure your metrics in the settings.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Security Dashboard</h3>
              <p className="max-w-md mx-auto">
                Webhook verification status, failed authentication attempts,
                and security incident logs will be displayed here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
