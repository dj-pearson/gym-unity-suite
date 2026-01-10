import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  BellOff,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Settings,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  severity: "critical" | "error" | "warning" | "info";
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  metadata?: Record<string, unknown>;
}

interface AlertConfig {
  pagerduty_enabled: boolean;
  pagerduty_routing_key: string;
  opsgenie_enabled: boolean;
  opsgenie_api_key: string;
  slack_enabled: boolean;
  slack_webhook_url: string;
  email_enabled: boolean;
  email_recipients: string;
}

const SeverityIcon = ({ severity }: { severity: Alert["severity"] }) => {
  switch (severity) {
    case "critical":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const SeverityBadge = ({ severity }: { severity: Alert["severity"] }) => {
  const styles = {
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    error: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <Badge className={styles[severity]}>
      {severity.toUpperCase()}
    </Badge>
  );
};

const AlertCard = ({
  alert,
  onAcknowledge,
  onDismiss,
}: {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
}) => (
  <div
    className={`p-4 border rounded-lg mb-2 ${
      alert.acknowledged
        ? "bg-muted/50 opacity-75"
        : alert.severity === "critical"
        ? "border-red-500 bg-red-50 dark:bg-red-950"
        : alert.severity === "error"
        ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
        : ""
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <SeverityIcon severity={alert.severity} />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{alert.title}</span>
            <SeverityBadge severity={alert.severity} />
          </div>
          <p className="text-sm text-muted-foreground">{alert.message}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </span>
            <span>Source: {alert.source}</span>
          </div>
          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
            <details className="text-xs mt-2">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View details
              </summary>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                {JSON.stringify(alert.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        {!alert.acknowledged && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAcknowledge(alert.id)}
            title="Acknowledge"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(alert.id)}
          title="Dismiss"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
);

const AlertConfigDialog = ({
  open,
  onClose,
  config,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  config: AlertConfig;
  onSave: (config: AlertConfig) => void;
}) => {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Alert Configuration</DialogTitle>
          <DialogDescription>
            Configure how alerts are delivered to your team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* PagerDuty */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">PagerDuty</Label>
                <p className="text-sm text-muted-foreground">
                  Send critical alerts to PagerDuty
                </p>
              </div>
              <Switch
                checked={localConfig.pagerduty_enabled}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, pagerduty_enabled: checked })
                }
              />
            </div>
            {localConfig.pagerduty_enabled && (
              <div className="ml-4">
                <Label htmlFor="pagerduty-key">Routing Key</Label>
                <Input
                  id="pagerduty-key"
                  type="password"
                  value={localConfig.pagerduty_routing_key}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, pagerduty_routing_key: e.target.value })
                  }
                  placeholder="Enter PagerDuty routing key"
                />
              </div>
            )}
          </div>

          {/* OpsGenie */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">OpsGenie</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts to OpsGenie
                </p>
              </div>
              <Switch
                checked={localConfig.opsgenie_enabled}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, opsgenie_enabled: checked })
                }
              />
            </div>
            {localConfig.opsgenie_enabled && (
              <div className="ml-4">
                <Label htmlFor="opsgenie-key">API Key</Label>
                <Input
                  id="opsgenie-key"
                  type="password"
                  value={localConfig.opsgenie_api_key}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, opsgenie_api_key: e.target.value })
                  }
                  placeholder="Enter OpsGenie API key"
                />
              </div>
            )}
          </div>

          {/* Slack */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Slack</Label>
                <p className="text-sm text-muted-foreground">
                  Post alerts to a Slack channel
                </p>
              </div>
              <Switch
                checked={localConfig.slack_enabled}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, slack_enabled: checked })
                }
              />
            </div>
            {localConfig.slack_enabled && (
              <div className="ml-4">
                <Label htmlFor="slack-webhook">Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  type="password"
                  value={localConfig.slack_webhook_url}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, slack_webhook_url: e.target.value })
                  }
                  placeholder="Enter Slack webhook URL"
                />
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications
                </p>
              </div>
              <Switch
                checked={localConfig.email_enabled}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, email_enabled: checked })
                }
              />
            </div>
            {localConfig.email_enabled && (
              <div className="ml-4">
                <Label htmlFor="email-recipients">Recipients (comma-separated)</Label>
                <Input
                  id="email-recipients"
                  value={localConfig.email_recipients}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, email_recipients: e.target.value })
                  }
                  placeholder="admin@example.com, ops@example.com"
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(localConfig)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AlertsPanel() {
  const [configOpen, setConfigOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["system-alerts"],
    queryFn: async () => {
      // In a real implementation, this would fetch from an alerts table
      // For now, return mock data
      return [
        {
          id: "1",
          severity: "warning",
          title: "Slow Query Detected",
          message: "Query on members table took 1523ms",
          source: "database-monitor",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          acknowledged: false,
          metadata: { table: "members", duration: 1523 },
        },
        {
          id: "2",
          severity: "info",
          title: "High Traffic Detected",
          message: "API requests increased by 50% in the last hour",
          source: "traffic-monitor",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          acknowledged: true,
        },
      ];
    },
    refetchInterval: 30000,
  });

  // Alert config
  const { data: alertConfig } = useQuery<AlertConfig>({
    queryKey: ["alert-config"],
    queryFn: async () => ({
      pagerduty_enabled: false,
      pagerduty_routing_key: "",
      opsgenie_enabled: false,
      opsgenie_api_key: "",
      slack_enabled: false,
      slack_webhook_url: "",
      email_enabled: false,
      email_recipients: "",
    }),
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation, update the alert in the database
      console.log("Acknowledging alert:", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-alerts"] });
    },
  });

  const dismissAlert = useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation, delete or archive the alert
      console.log("Dismissing alert:", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-alerts"] });
    },
  });

  const saveConfig = useMutation({
    mutationFn: async (config: AlertConfig) => {
      // Save config to database or environment
      console.log("Saving config:", config);
    },
    onSuccess: () => {
      setConfigOpen(false);
      queryClient.invalidateQueries({ queryKey: ["alert-config"] });
    },
  });

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time system alerts and notifications
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </CardHeader>
      <CardContent>
        {criticalCount > 0 && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium">
              {criticalCount} critical alert{criticalCount > 1 ? "s" : ""} require immediate attention
            </span>
          </div>
        )}

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Active ({activeAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="acknowledged" className="flex items-center gap-2">
              <BellOff className="h-4 w-4" />
              Acknowledged ({acknowledgedAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <ScrollArea className="h-[400px] pr-4">
              {activeAlerts.length > 0 ? (
                activeAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
                    onDismiss={(id) => dismissAlert.mutate(id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
                  <p className="text-lg font-medium">All Clear</p>
                  <p className="text-sm">No active alerts</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="acknowledged">
            <ScrollArea className="h-[400px] pr-4">
              {acknowledgedAlerts.length > 0 ? (
                acknowledgedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
                    onDismiss={(id) => dismissAlert.mutate(id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BellOff className="h-12 w-12 mb-4" />
                  <p className="text-sm">No acknowledged alerts</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {alertConfig && (
        <AlertConfigDialog
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          config={alertConfig}
          onSave={(config) => saveConfig.mutate(config)}
        />
      )}
    </Card>
  );
}
