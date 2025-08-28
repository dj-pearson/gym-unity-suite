import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import IntegrationsManager from '@/components/integrations/IntegrationsManager';
import WebhookManager from '@/components/integrations/WebhookManager';
import { 
  Link, 
  Webhook, 
  Key, 
  Activity,
  Zap,
  Shield,
  Database
} from 'lucide-react';

export default function IntegrationsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!profile) {
    return <div>Loading...</div>;
  }

  const integrationStats = [
    {
      title: "Active Integrations",
      value: "4",
      change: "+1 this month",
      icon: Link,
      color: "text-blue-600"
    },
    {
      title: "Webhook Endpoints",
      value: "2",
      change: "All healthy",
      icon: Webhook,
      color: "text-green-600"
    },
    {
      title: "API Requests",
      value: "12.4K",
      change: "+18% this week",
      icon: Activity,
      color: "text-purple-600"
    },
    {
      title: "Success Rate",
      value: "99.8%",
      change: "Last 30 days",
      icon: Shield,
      color: "text-green-600"
    }
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Integrations & API Management</h2>
        <Badge variant="outline" className="ml-auto">
          <Database className="w-4 h-4 mr-2" />
          System: Connected
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {integrationStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Integration Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Active Integrations
                </CardTitle>
                <CardDescription>
                  Currently connected third-party services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-medium">Stripe Payments</p>
                      <p className="text-sm text-muted-foreground">Payment processing</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-medium">Email Service</p>
                      <p className="text-sm text-muted-foreground">Member communications</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-medium">Analytics Platform</p>
                      <p className="text-sm text-muted-foreground">Business intelligence</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Configured
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest integration events and API calls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Payment webhook received - 2 min ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Member sync completed - 15 min ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>API key refreshed - 1 hour ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Webhook test successful - 3 hours ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Integration health check - 6 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>
                Popular third-party services you can connect to your gym
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: 'QuickBooks', icon: '📊', description: 'Accounting integration' },
                  { name: 'Mailchimp', icon: '📧', description: 'Email marketing' },
                  { name: 'Google Calendar', icon: '📅', description: 'Calendar sync' },
                  { name: 'Zapier', icon: '⚡', description: 'Workflow automation' },
                  { name: 'Slack', icon: '💬', description: 'Team notifications' },
                  { name: 'Facebook Ads', icon: '📢', description: 'Ad campaign tracking' },
                  { name: 'MindBody', icon: '🧘', description: 'Fitness platform sync' },
                  { name: 'Custom API', icon: '🔧', description: 'Build your own' }
                ].map((integration, index) => (
                  <div key={index} className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <span className="text-3xl mb-2">{integration.icon}</span>
                    <h4 className="font-medium text-center">{integration.name}</h4>
                    <p className="text-xs text-muted-foreground text-center">{integration.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsManager />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhookManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}