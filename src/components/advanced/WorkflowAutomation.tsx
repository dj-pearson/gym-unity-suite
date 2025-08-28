import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Clock, 
  Mail, 
  MessageSquare, 
  Users, 
  Calendar,
  DollarSign,
  Target,
  Workflow,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WorkflowAutomation = () => {
  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: 'New Member Onboarding',
      description: 'Automated welcome sequence for new members',
      status: 'active',
      triggers: 45,
      executions: 42,
      successRate: 93,
      steps: [
        { name: 'Send Welcome Email', type: 'email', status: 'completed' },
        { name: 'Schedule Orientation', type: 'calendar', status: 'completed' },
        { name: 'Assign Personal Trainer', type: 'assignment', status: 'active' },
        { name: 'Follow-up Survey', type: 'form', status: 'pending' }
      ],
      category: 'onboarding'
    },
    {
      id: 2,
      name: 'Payment Failure Recovery',
      description: 'Automated sequence for failed payment recovery',
      status: 'active',
      triggers: 23,
      executions: 18,
      successRate: 78,
      steps: [
        { name: 'Send Payment Notice', type: 'email', status: 'completed' },
        { name: 'SMS Reminder', type: 'sms', status: 'completed' },
        { name: 'Call Scheduling', type: 'calendar', status: 'active' },
        { name: 'Account Suspension', type: 'action', status: 'pending' }
      ],
      category: 'billing'
    },
    {
      id: 3,
      name: 'Churn Prevention Campaign',
      description: 'Re-engagement sequence for inactive members',
      status: 'active',
      triggers: 12,
      executions: 12,
      successRate: 67,
      steps: [
        { name: 'Identify At-Risk Members', type: 'analysis', status: 'completed' },
        { name: 'Send Re-engagement Email', type: 'email', status: 'completed' },
        { name: 'Offer Special Promotion', type: 'promotion', status: 'active' },
        { name: 'Schedule Retention Call', type: 'calendar', status: 'pending' }
      ],
      category: 'retention'
    },
    {
      id: 4,
      name: 'Birthday Campaign',
      description: 'Automated birthday wishes and special offers',
      status: 'paused',
      triggers: 8,
      executions: 8,
      successRate: 100,
      steps: [
        { name: 'Send Birthday Email', type: 'email', status: 'completed' },
        { name: 'Offer Birthday Discount', type: 'promotion', status: 'completed' }
      ],
      category: 'marketing'
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const toggleWorkflow = (id, currentStatus) => {
    setWorkflows(workflows.map(workflow => 
      workflow.id === id 
        ? { ...workflow, status: currentStatus === 'active' ? 'paused' : 'active' }
        : workflow
    ));
    
    toast({
      title: `Workflow ${currentStatus === 'active' ? 'Paused' : 'Activated'}`,
      description: 'Workflow status updated successfully',
    });
  };

  const workflowTemplates = [
    {
      name: 'Lead Nurturing Sequence',
      category: 'sales',
      description: 'Multi-touch email sequence for new leads',
      icon: Target
    },
    {
      name: 'Class Reminder System',
      category: 'classes',
      description: 'Automated reminders for upcoming classes',
      icon: Calendar
    },
    {
      name: 'Membership Renewal',
      category: 'retention',
      description: 'Automated renewal reminders and incentives',
      icon: DollarSign
    },
    {
      name: 'Equipment Maintenance',
      category: 'operations',
      description: 'Scheduled maintenance reminders and logging',
      icon: Settings
    }
  ];

  const CreateWorkflowForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Create New Workflow</CardTitle>
        <CardDescription>Build a custom automation workflow</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input id="workflow-name" placeholder="Enter workflow name" />
          </div>
          <div>
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea id="workflow-description" placeholder="Describe what this workflow does" />
          </div>
          <div>
            <Label htmlFor="workflow-category">Category</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="retention">Retention</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="trigger-condition">Trigger Condition</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="When should this workflow start?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-member">New member registration</SelectItem>
                <SelectItem value="payment-failed">Payment failure</SelectItem>
                <SelectItem value="inactivity">Member inactivity</SelectItem>
                <SelectItem value="birthday">Member birthday</SelectItem>
                <SelectItem value="renewal-due">Membership renewal due</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(false)}>Create Workflow</Button>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">Automate repetitive tasks and member interactions</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {showCreateForm && <CreateWorkflowForm />}

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Workflow className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`workflow-${workflow.id}`} className="text-sm">
                          {workflow.status === 'active' ? 'Active' : 'Paused'}
                        </Label>
                        <Switch
                          id={`workflow-${workflow.id}`}
                          checked={workflow.status === 'active'}
                          onCheckedChange={() => toggleWorkflow(workflow.id, workflow.status)}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Workflow Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{workflow.triggers}</div>
                        <div className="text-sm text-muted-foreground">Triggers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{workflow.executions}</div>
                        <div className="text-sm text-muted-foreground">Executions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{workflow.successRate}%</div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                      </div>
                    </div>

                    {/* Workflow Steps */}
                    <div>
                      <h4 className="font-medium mb-3">Workflow Steps</h4>
                      <div className="space-y-2">
                        {workflow.steps.map((step, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0">
                              {step.type === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                              {step.type === 'sms' && <MessageSquare className="h-4 w-4 text-green-500" />}
                              {step.type === 'calendar' && <Calendar className="h-4 w-4 text-purple-500" />}
                              {step.type === 'assignment' && <Users className="h-4 w-4 text-orange-500" />}
                              {step.type === 'form' && <Target className="h-4 w-4 text-pink-500" />}
                              {step.type === 'action' && <Zap className="h-4 w-4 text-red-500" />}
                              {step.type === 'analysis' && <Settings className="h-4 w-4 text-gray-500" />}
                              {step.type === 'promotion' && <DollarSign className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{step.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  step.status === 'completed' ? 'default' : 
                                  step.status === 'active' ? 'secondary' : 'outline'
                                }
                                className="text-xs"
                              >
                                {step.status}
                              </Badge>
                              {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            </div>
                            {index < workflow.steps.length - 1 && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        View Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {workflowTemplates.map((template, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <template.icon className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{template.category}</Badge>
                    <Button variant="outline" size="sm">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
                <CardDescription>Overall automation effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Active Workflows</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Executions (30d)</span>
                    <span className="font-semibold">80</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Success Rate</span>
                    <span className="font-semibold">84.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Time Saved (hours)</span>
                    <span className="font-semibold">127</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Workflows</CardTitle>
                <CardDescription>Most effective automations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows
                    .sort((a, b) => b.successRate - a.successRate)
                    .slice(0, 3)
                    .map((workflow, index) => (
                      <div key={workflow.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {workflow.executions} executions
                          </div>
                        </div>
                        <Badge variant="secondary">{workflow.successRate}%</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowAutomation;