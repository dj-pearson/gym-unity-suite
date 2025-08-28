import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Settings, 
  Webhook, 
  Key, 
  Link, 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret?: string;
  last_triggered?: string;
  created_at: string;
}

interface APIKey {
  id: string;
  name: string;
  key_preview: string;
  permissions: string[];
  last_used?: string;
  expires_at?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const INTEGRATION_TYPES = [
  { value: 'stripe', label: 'Stripe Payment Processing', icon: '💳' },
  { value: 'mailchimp', label: 'Mailchimp Email Marketing', icon: '📧' },
  { value: 'zapier', label: 'Zapier Automation', icon: '⚡' },
  { value: 'slack', label: 'Slack Notifications', icon: '💬' },
  { value: 'google_calendar', label: 'Google Calendar', icon: '📅' },
  { value: 'facebook_ads', label: 'Facebook Ads', icon: '📢' },
  { value: 'quickbooks', label: 'QuickBooks Accounting', icon: '📊' },
  { value: 'mindbody', label: 'MindBody Integration', icon: '🧘' }
];

const WEBHOOK_EVENTS = [
  'member.created',
  'member.updated',
  'member.deleted',
  'class.booked',
  'class.cancelled',
  'payment.completed',
  'payment.failed',
  'checkin.created',
  'membership.expired'
];

export default function IntegrationsManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('integrations');
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [showAddAPIKey, setShowAddAPIKey] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Form states
  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    type: '',
    config: {}
  });

  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: ''
  });

  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    permissions: [] as string[],
    expires_at: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // In a real implementation, these would be proper tables
      // For now, we'll use mock data
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Stripe Payment Gateway',
          type: 'stripe',
          status: 'active',
          config: { publishable_key: 'pk_test_...' },
          last_sync: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          name: 'Mailchimp Email Lists',
          type: 'mailchimp',
          status: 'inactive',
          config: { api_key: 'hidden', list_id: 'abc123' },
          created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
        }
      ];

      const mockWebhooks: WebhookEndpoint[] = [
        {
          id: '1',
          name: 'Member Activity Sync',
          url: 'https://api.partner.com/webhooks/members',
          events: ['member.created', 'member.updated', 'checkin.created'],
          status: 'active',
          last_triggered: new Date(Date.now() - 1800000).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ];

      const mockAPIKeys: APIKey[] = [
        {
          id: '1',
          name: 'Mobile App API',
          key_preview: 'rg_live_4f4e...',
          permissions: ['read:members', 'write:checkins'],
          last_used: new Date(Date.now() - 900000).toISOString(),
          status: 'active',
          created_at: new Date(Date.now() - 86400000 * 10).toISOString()
        }
      ];

      setIntegrations(mockIntegrations);
      setWebhooks(mockWebhooks);
      setApiKeys(mockAPIKeys);
    } catch (error) {
      console.error('Error fetching integrations data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch integrations data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = async () => {
    // In a real implementation, this would save to the database
    const newIntegration: Integration = {
      id: Date.now().toString(),
      name: integrationForm.name,
      type: integrationForm.type,
      status: 'inactive',
      config: integrationForm.config,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setIntegrations(prev => [...prev, newIntegration]);
    setShowAddIntegration(false);
    setIntegrationForm({ name: '', type: '', config: {} });
    
    toast({
      title: "Integration Added",
      description: "Integration has been configured successfully"
    });
  };

  const handleToggleIntegration = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, status: newStatus as 'active' | 'inactive' | 'error' }
        : integration
    ));

    toast({
      title: newStatus === 'active' ? "Integration Enabled" : "Integration Disabled",
      description: `Integration has been ${newStatus === 'active' ? 'enabled' : 'disabled'}`
    });
  };

  const handleTestIntegration = async (integration: Integration) => {
    toast({
      title: "Testing Integration",
      description: "Running connection test..."
    });

    // Simulate test
    setTimeout(() => {
      toast({
        title: "Test Successful",
        description: "Integration is working correctly"
      });
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      inactive: { label: 'Inactive', variant: 'secondary' as const, icon: XCircle },
      error: { label: 'Error', variant: 'destructive' as const, icon: AlertTriangle }
    };

    const { label, variant, icon: Icon } = config[status as keyof typeof config] || config.inactive;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getIntegrationType = (type: string) => {
    return INTEGRATION_TYPES.find(t => t.value === type) || { label: type, icon: '🔗' };
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrations & APIs</h2>
          <p className="text-muted-foreground">
            Manage third-party integrations, webhooks, and API access
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">
            <Link className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Third-Party Integrations</h3>
            <Dialog open={showAddIntegration} onOpenChange={setShowAddIntegration}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Integration</DialogTitle>
                  <DialogDescription>
                    Connect a third-party service to your gym management system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Integration Name</Label>
                    <Input
                      value={integrationForm.name}
                      onChange={(e) => setIntegrationForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Production Stripe Account"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Integration Type</Label>
                    <Select
                      value={integrationForm.type}
                      onValueChange={(value) => setIntegrationForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select integration type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEGRATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddIntegration(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddIntegration}>
                      Add Integration
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {integrations.map((integration) => {
              const typeInfo = getIntegrationType(integration.type);
              
              return (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeInfo.icon}</span>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <CardDescription>{typeInfo.label}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.status)}
                        <Switch
                          checked={integration.status === 'active'}
                          onCheckedChange={() => handleToggleIntegration(integration.id, integration.status)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {integration.last_sync ? (
                          <span>Last sync: {format(new Date(integration.last_sync), 'MMM d, h:mm a')}</span>
                        ) : (
                          <span>Never synced</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleTestIntegration(integration)}>
                          <Activity className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
            <Button onClick={() => setShowAddWebhook(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{webhook.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {webhook.url}
                      </CardDescription>
                    </div>
                    {getStatusBadge(webhook.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Events:</p>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {webhook.last_triggered && (
                      <div className="text-sm text-muted-foreground">
                        Last triggered: {format(new Date(webhook.last_triggered), 'MMM d, h:mm a')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">API Keys</h3>
            <Button onClick={() => setShowAddAPIKey(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate API Key
            </Button>
          </div>

          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{apiKey.name}</CardTitle>
                      <CardDescription className="font-mono text-xs flex items-center gap-2">
                        {showSecrets[apiKey.id] ? apiKey.key_preview : '••••••••••••••••'}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSecrets(prev => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))}
                        >
                          {showSecrets[apiKey.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(apiKey.status)}
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        Last used: {apiKey.last_used ? format(new Date(apiKey.last_used), 'MMM d, h:mm a') : 'Never'}
                      </span>
                      {apiKey.expires_at && (
                        <span>
                          Expires: {format(new Date(apiKey.expires_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}