import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Edit,
  Trash2,
  Zap,
  Calendar,
  DollarSign,
  Mail,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';

const automationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  trigger_type: z.enum(['membership_renewal', 'payment_overdue', 'new_member', 'class_package_expiry']),
  action_type: z.enum(['send_invoice', 'send_reminder', 'apply_late_fee', 'suspend_membership']),
  trigger_days: z.number().min(-30).max(30),
  is_active: z.boolean(),
  conditions: z.object({
    member_types: z.array(z.string()).optional(),
    membership_plans: z.array(z.string()).optional(),
    amount_threshold: z.number().optional(),
  }),
});

type AutomationFormData = z.infer<typeof automationSchema>;

export function BillingAutomation() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      trigger_days: 7,
      is_active: true,
      conditions: {},
    },
  });

  useEffect(() => {
    fetchAutomations();
    fetchExecutionHistory();
  }, [profile?.organization_id]);

  const fetchAutomations = async () => {
    if (!profile?.organization_id) return;

    try {
      setIsLoading(true);
      // Note: This would require a new table 'billing_automations' in the database
      // For now, we'll simulate the data structure
      setAutomations([
        {
          id: 'auto-1',
          name: 'Membership Renewal Reminder',
          description: 'Send reminder 7 days before membership expires',
          trigger_type: 'membership_renewal',
          action_type: 'send_reminder',
          trigger_days: -7,
          is_active: true,
          executions_count: 45,
          last_executed: '2024-01-20T10:30:00Z',
          conditions: {
            member_types: ['premium', 'basic'],
          },
        },
        {
          id: 'auto-2',
          name: 'Overdue Payment Follow-up',
          description: 'Apply late fee after 3 days overdue',
          trigger_type: 'payment_overdue',
          action_type: 'apply_late_fee',
          trigger_days: 3,
          is_active: true,
          executions_count: 12,
          last_executed: '2024-01-19T14:15:00Z',
          conditions: {
            amount_threshold: 50,
          },
        },
        {
          id: 'auto-3',
          name: 'Welcome Invoice',
          description: 'Send invoice immediately for new members',
          trigger_type: 'new_member',
          action_type: 'send_invoice',
          trigger_days: 0,
          is_active: true,
          executions_count: 28,
          last_executed: '2024-01-21T09:45:00Z',
          conditions: {},
        }
      ]);
    } catch (error: any) {
      toast({
        title: 'Error loading automations',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExecutionHistory = async () => {
    try {
      // Simulate execution history
      setExecutionHistory([
        {
          id: 'exec-1',
          automation_name: 'Membership Renewal Reminder',
          member_name: 'John Doe',
          executed_at: '2024-01-21T10:30:00Z',
          status: 'success',
          action_taken: 'Email reminder sent',
        },
        {
          id: 'exec-2',
          automation_name: 'Welcome Invoice',
          member_name: 'Jane Smith',
          executed_at: '2024-01-21T09:45:00Z',
          status: 'success',
          action_taken: 'Invoice INV-2024-003 created and sent',
        },
        {
          id: 'exec-3',
          automation_name: 'Overdue Payment Follow-up',
          member_name: 'Mike Johnson',
          executed_at: '2024-01-19T14:15:00Z',
          status: 'failed',
          action_taken: 'Failed to apply late fee - payment method expired',
        }
      ]);
    } catch (error: any) {
      console.error('Error fetching execution history:', error);
    }
  };

  const handleSubmit = async (data: AutomationFormData) => {
    try {
      const automationData = {
        ...data,
        organization_id: profile?.organization_id,
        executions_count: 0,
      };

      if (editingAutomation) {
        setAutomations(prev => prev.map(a => 
          a.id === editingAutomation.id ? { ...a, ...automationData } : a
        ));
        toast({
          title: 'Automation updated',
          description: 'The billing automation has been updated successfully.',
        });
      } else {
        const newAutomation = {
          id: `auto-${Date.now()}`,
          ...automationData,
          created_at: new Date().toISOString(),
        };
        setAutomations(prev => [...prev, newAutomation]);
        toast({
          title: 'Automation created',
          description: 'The new billing automation has been created.',
        });
      }

      setIsDialogOpen(false);
      setEditingAutomation(null);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error saving automation',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (automation: any) => {
    setEditingAutomation(automation);
    form.reset(automation);
    setIsDialogOpen(true);
  };

  const handleDelete = async (automationId: string) => {
    try {
      setAutomations(prev => prev.filter(a => a.id !== automationId));
      toast({
        title: 'Automation deleted',
        description: 'The billing automation has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting automation',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (automationId: string) => {
    try {
      setAutomations(prev => prev.map(a => 
        a.id === automationId ? { ...a, is_active: !a.is_active } : a
      ));
      toast({
        title: 'Automation updated',
        description: 'Automation status has been changed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating automation',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getTriggerDescription = (type: string, days: number) => {
    const timing = days === 0 ? 'immediately' : 
                  days > 0 ? `${days} days after` : 
                  `${Math.abs(days)} days before`;
    
    switch (type) {
      case 'membership_renewal': return `${timing} membership expires`;
      case 'payment_overdue': return `${timing} payment becomes overdue`;
      case 'new_member': return `${timing} member joins`;
      case 'class_package_expiry': return `${timing} class package expires`;
      default: return type;
    }
  };

  const getActionDescription = (type: string) => {
    switch (type) {
      case 'send_invoice': return 'Send invoice';
      case 'send_reminder': return 'Send reminder email';
      case 'apply_late_fee': return 'Apply late fee';
      case 'suspend_membership': return 'Suspend membership';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-48 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Billing Automation</h2>
          <p className="text-muted-foreground">
            Automate billing processes and payment reminders
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAutomation(null); form.reset(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {editingAutomation ? 'Edit Automation' : 'Create New Automation'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="e.g., Membership Renewal Reminder"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  rows={2}
                  placeholder="Describe what this automation does..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trigger_type">Trigger Event *</Label>
                  <Select value={form.watch('trigger_type')} onValueChange={(value: any) => form.setValue('trigger_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="membership_renewal">Membership Renewal</SelectItem>
                      <SelectItem value="payment_overdue">Payment Overdue</SelectItem>
                      <SelectItem value="new_member">New Member</SelectItem>
                      <SelectItem value="class_package_expiry">Class Package Expiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action_type">Action *</Label>
                  <Select value={form.watch('action_type')} onValueChange={(value: any) => form.setValue('action_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_invoice">Send Invoice</SelectItem>
                      <SelectItem value="send_reminder">Send Reminder</SelectItem>
                      <SelectItem value="apply_late_fee">Apply Late Fee</SelectItem>
                      <SelectItem value="suspend_membership">Suspend Membership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="trigger_days">Timing (days) *</Label>
                <Input
                  id="trigger_days"
                  type="number"
                  {...form.register('trigger_days', { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Negative numbers = days before event, Positive = days after, 0 = immediately
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={form.watch('is_active')}
                  onCheckedChange={(checked) => form.setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAutomation ? 'Update' : 'Create'} Automation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automations List */}
      <div className="grid gap-4">
        {automations.map((automation) => (
          <Card key={automation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <Zap className="w-5 h-5" />
                    {automation.name}
                    <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                      {automation.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {automation.description}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(automation)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(automation.id)}
                  >
                    {automation.is_active ? <Settings className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(automation.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm">
                    <strong>Trigger:</strong> {getTriggerDescription(automation.trigger_type, automation.trigger_days)}
                  </div>
                  <div className="text-sm">
                    <strong>Action:</strong> {getActionDescription(automation.action_type)}
                  </div>
                </div>
                
                <div className="text-right text-sm text-muted-foreground">
                  <div>Executed {automation.executions_count} times</div>
                  {automation.last_executed && (
                    <div>
                      Last: {new Date(automation.last_executed).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Execution History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executionHistory.map((execution) => (
              <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(execution.status)}
                  <div>
                    <div className="font-medium">{execution.automation_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {execution.member_name} • {execution.action_taken}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(execution.executed_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          
          {executionHistory.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No automation executions yet
            </div>
          )}
        </CardContent>
      </Card>

      {automations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Automations Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first billing automation to streamline your payment processes.
            </p>
            <Button onClick={() => { setEditingAutomation(null); form.reset(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Automation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}