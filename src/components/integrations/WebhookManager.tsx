import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Webhook, 
  Activity, 
  Settings,
  Trash2,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret?: string;
  retry_count: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  endpoint_id: string;
  event_type: string;
  status: 'success' | 'failed' | 'retry';
  response_code?: number;
  response_body?: string;
  attempt_count: number;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { id: 'member.created', label: 'Member Created', description: 'When a new member signs up' },
  { id: 'member.updated', label: 'Member Updated', description: 'When member information changes' },
  { id: 'member.deleted', label: 'Member Deleted', description: 'When a member account is deleted' },
  { id: 'class.booked', label: 'Class Booked', description: 'When a member books a class' },
  { id: 'class.cancelled', label: 'Class Cancelled', description: 'When a class booking is cancelled' },
  { id: 'payment.completed', label: 'Payment Completed', description: 'When a payment is successfully processed' },
  { id: 'payment.failed', label: 'Payment Failed', description: 'When a payment fails' },
  { id: 'checkin.created', label: 'Member Check-in', description: 'When a member checks in' },
  { id: 'membership.expired', label: 'Membership Expired', description: 'When a membership expires' },
  { id: 'incident.reported', label: 'Incident Reported', description: 'When a safety incident is reported' }
];

export default function WebhookManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  const [endpointForm, setEndpointForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    retry_count: 3,
    timeout_seconds: 30
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Mock data for webhook endpoints
      const mockEndpoints: WebhookEndpoint[] = [
        {
          id: '1',
          name: 'Member Activity Sync',
          url: 'https://api.partner.com/webhooks/members',
          events: ['member.created', 'member.updated', 'checkin.created'],
          status: 'active',
          secret: 'wh_secret_123...',
          retry_count: 3,
          timeout_seconds: 30,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          name: 'Payment Notifications',
          url: 'https://accounting.system.com/gym-payments',
          events: ['payment.completed', 'payment.failed', 'membership.expired'],
          status: 'active',
          retry_count: 5,
          timeout_seconds: 15,
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      // Mock webhook logs
      const mockLogs: WebhookLog[] = [
        {
          id: '1',
          endpoint_id: '1',
          event_type: 'checkin.created',
          status: 'success',
          response_code: 200,
          response_body: '{"status": "received"}',
          attempt_count: 1,
          created_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '2',
          endpoint_id: '2',
          event_type: 'payment.completed',
          status: 'failed',
          response_code: 503,
          response_body: '{"error": "Service temporarily unavailable"}',
          attempt_count: 3,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          endpoint_id: '1',
          event_type: 'member.created',
          status: 'success',
          response_code: 201,
          attempt_count: 1,
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      setEndpoints(mockEndpoints);
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching webhook data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch webhook data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEndpoint = async () => {
    if (!endpointForm.name || !endpointForm.url || endpointForm.events.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newEndpoint: WebhookEndpoint = {
      id: Date.now().toString(),
      ...endpointForm,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEndpoints(prev => [...prev, newEndpoint]);
    setShowAddEndpoint(false);
    setEndpointForm({
      name: '',
      url: '',
      events: [],
      secret: '',
      retry_count: 3,
      timeout_seconds: 30
    });

    toast({
      title: "Webhook Created",
      description: "Webhook endpoint has been created successfully"
    });
  };

  const handleTestEndpoint = async (endpoint: WebhookEndpoint) => {
    setTestingEndpoint(endpoint.id);
    
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add test log entry
      const testLog: WebhookLog = {
        id: Date.now().toString(),
        endpoint_id: endpoint.id,
        event_type: 'test.ping',
        status: 'success',
        response_code: 200,
        response_body: '{"test": "success", "timestamp": "' + new Date().toISOString() + '"}',
        attempt_count: 1,
        created_at: new Date().toISOString()
      };

      setLogs(prev => [testLog, ...prev]);

      toast({
        title: "Test Successful",
        description: "Webhook endpoint responded successfully"
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Webhook endpoint did not respond correctly",
        variant: "destructive"
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleToggleEndpoint = (id: string) => {
    setEndpoints(prev => prev.map(endpoint => 
      endpoint.id === id 
        ? { ...endpoint, status: endpoint.status === 'active' ? 'inactive' : 'active' }
        : endpoint
    ));

    toast({
      title: "Endpoint Updated",
      description: "Webhook endpoint status has been updated"
    });
  };

  const handleDeleteEndpoint = (id: string) => {
    setEndpoints(prev => prev.filter(endpoint => endpoint.id !== id));
    setLogs(prev => prev.filter(log => log.endpoint_id !== id));

    toast({
      title: "Endpoint Deleted",
      description: "Webhook endpoint has been deleted"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'retry':
        return <RefreshCw className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEndpointLogs = (endpointId: string) => {
    return logs.filter(log => log.endpoint_id === endpointId).slice(0, 5);
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading webhooks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Management</h2>
          <p className="text-muted-foreground">
            Configure webhooks to send real-time data to external systems
          </p>
        </div>
        <Dialog open={showAddEndpoint} onOpenChange={setShowAddEndpoint}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Webhook Endpoint</DialogTitle>
              <DialogDescription>
                Set up a new webhook to receive real-time notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Endpoint Name *</Label>
                  <Input
                    value={endpointForm.name}
                    onChange={(e) => setEndpointForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Member Activity Sync"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL *</Label>
                  <Input
                    value={endpointForm.url}
                    onChange={(e) => setEndpointForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-app.com/webhooks/gym"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Events to Subscribe *</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.id}
                        checked={endpointForm.events.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEndpointForm(prev => ({ ...prev, events: [...prev.events, event.id] }));
                          } else {
                            setEndpointForm(prev => ({ ...prev, events: prev.events.filter(e => e !== event.id) }));
                          }
                        }}
                      />
                      <label htmlFor={event.id} className="text-sm font-medium">
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Secret Key (Optional)</Label>
                  <Input
                    type="password"
                    value={endpointForm.secret}
                    onChange={(e) => setEndpointForm(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="webhook_secret_key"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retry Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={endpointForm.retry_count}
                    onChange={(e) => setEndpointForm(prev => ({ ...prev, retry_count: parseInt(e.target.value) || 3 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (seconds)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="120"
                    value={endpointForm.timeout_seconds}
                    onChange={(e) => setEndpointForm(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) || 30 }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddEndpoint(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEndpoint}>
                  Create Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhook Endpoints */}
      <div className="grid gap-4">
        {endpoints.map((endpoint) => (
          <Card key={endpoint.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Webhook className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{endpoint.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {endpoint.url}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={endpoint.status === 'active' ? 'default' : 'secondary'}>
                    {endpoint.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestEndpoint(endpoint)}
                    disabled={testingEndpoint === endpoint.id}
                  >
                    {testingEndpoint === endpoint.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Send className="w-4 h-4 mr-1" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEndpoint(endpoint.id)}
                  >
                    {endpoint.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEndpoint(endpoint.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Subscribed Events:</p>
                  <div className="flex flex-wrap gap-1">
                    {endpoint.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Recent Activity:</p>
                  <div className="space-y-2">
                    {getEndpointLogs(endpoint.id).length > 0 ? (
                      getEndpointLogs(endpoint.id).map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span>{log.event_type}</span>
                            {log.response_code && (
                              <Badge variant="outline" className="text-xs">
                                {log.response_code}
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {endpoints.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Webhooks Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set up webhooks to receive real-time notifications about gym activities
            </p>
            <Button onClick={() => setShowAddEndpoint(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Webhook
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}