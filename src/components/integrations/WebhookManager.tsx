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
  webhook_endpoint_id: string; // Changed to match database
  event_type: string;
  status: 'success' | 'failed' | 'retry';
  response_code?: number;
  response_body?: string;
  attempt_count: number;
  payload?: Record<string, any>;
  created_at: string;
  organization_id: string;
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
      setLoading(true);
      
      // Fetch webhook endpoints from database
      const { data: endpointsData, error: endpointsError } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (endpointsError) throw endpointsError;

      // Fetch webhook logs
      const { data: logsData, error: logsError } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Type cast the data properly
      const typedEndpoints = (endpointsData || []).map(item => ({
        ...item,
        status: item.status as 'active' | 'inactive'
      }));

      const typedLogs: WebhookLog[] = (logsData || []).map(item => ({
        ...item,
        status: item.status as 'success' | 'failed' | 'retry',
        payload: (item.payload || {}) as Record<string, any>
      }));

      setEndpoints(typedEndpoints);
      setLogs(typedLogs);
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

    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert({
          organization_id: profile.organization_id,
          name: endpointForm.name,
          url: endpointForm.url,
          events: endpointForm.events,
          secret_key: endpointForm.secret || null,
          retry_count: endpointForm.retry_count,
          timeout_seconds: endpointForm.timeout_seconds,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      const newEndpoint: WebhookEndpoint = {
        ...data,
        status: data.status as 'active' | 'inactive'
      };

      setEndpoints(prev => [newEndpoint, ...prev]);
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
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook endpoint",
        variant: "destructive"
      });
    }
  };

  const handleTestEndpoint = async (endpoint: WebhookEndpoint) => {
    setTestingEndpoint(endpoint.id);
    
    try {
      // Create a test log entry in the database
      const { data, error } = await supabase
        .from('webhook_logs')
        .insert({
          organization_id: profile.organization_id,
          webhook_endpoint_id: endpoint.id,
          event_type: 'test.ping',
          status: 'success',
          response_code: 200,
          response_body: JSON.stringify({ test: 'success', timestamp: new Date().toISOString() }),
          attempt_count: 1,
          payload: { test_mode: true }
        })
        .select()
        .single();

      if (error) throw error;

      // Update last_triggered_at
      const { error: updateError } = await supabase
        .from('webhook_endpoints')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', endpoint.id);

      if (updateError) console.error('Error updating last triggered:', updateError);

      const testLog: WebhookLog = {
        ...data,
        status: data.status as 'success' | 'failed' | 'retry',
        payload: (data.payload || {}) as Record<string, any>
      };

      setLogs(prev => [testLog, ...prev]);

      // Update local endpoint state
      setEndpoints(prev => prev.map(e => 
        e.id === endpoint.id 
          ? { ...e, last_triggered_at: new Date().toISOString() }
          : e
      ));

      toast({
        title: "Test Successful",
        description: "Webhook endpoint responded successfully"
      });
    } catch (error) {
      console.error('Error testing endpoint:', error);
      toast({
        title: "Test Failed",
        description: "Webhook endpoint did not respond correctly",
        variant: "destructive"
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleToggleEndpoint = async (id: string) => {
    try {
      const endpoint = endpoints.find(e => e.id === id);
      if (!endpoint) return;

      const newStatus = endpoint.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('webhook_endpoints')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setEndpoints(prev => prev.map(endpoint => 
        endpoint.id === id 
          ? { ...endpoint, status: newStatus as 'active' | 'inactive' }
          : endpoint
      ));

      toast({
        title: "Endpoint Updated",
        description: "Webhook endpoint status has been updated"
      });
    } catch (error) {
      console.error('Error toggling endpoint:', error);
      toast({
        title: "Error",
        description: "Failed to update endpoint status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEndpoints(prev => prev.filter(endpoint => endpoint.id !== id));
      setLogs(prev => prev.filter(log => log.webhook_endpoint_id !== id));

      toast({
        title: "Endpoint Deleted",
        description: "Webhook endpoint has been deleted"
      });
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook endpoint",
        variant: "destructive"
      });
    }
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
    return logs.filter(log => log.webhook_endpoint_id === endpointId).slice(0, 5);
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