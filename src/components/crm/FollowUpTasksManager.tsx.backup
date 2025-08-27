import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, Phone, Mail, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FollowUpTask {
  id: string;
  lead_id: string;
  assigned_to: string;
  task_type: 'call' | 'email' | 'appointment' | 'follow_up' | 'proposal' | 'contract';
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  completed_at: string | null;
  result_notes: string | null;
  created_at: string;
  lead?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  assigned_staff?: {
    first_name: string;
    last_name: string;
  };
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

const taskTypeIcons = {
  call: Phone,
  email: Mail,
  appointment: Calendar,
  follow_up: Clock,
  proposal: Mail,
  contract: CheckCircle,
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800',
};

export const FollowUpTasksManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [formData, setFormData] = useState({
    lead_id: '',
    assigned_to: '',
    task_type: 'call' as FollowUpTask['task_type'],
    title: '',
    description: '',
    priority: 'medium' as FollowUpTask['priority'],
    due_date: '',
    due_time: '',
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTasks();
      fetchLeads();
      fetchStaff();
    }
  }, [profile?.organization_id]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_follow_up_tasks')
        .select(`
          *,
          lead:leads(first_name, last_name, email, phone),
          assigned_staff:profiles!assigned_to(first_name, last_name)
        `)
        .in('lead_id', 
          await supabase
            .from('leads')
            .select('id')
            .eq('organization_id', profile?.organization_id)
            .then(({ data }) => data?.map(l => l.id) || [])
        )
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Update overdue status
      const now = new Date();
      const updatedTasks = (data || []).map(task => ({
        ...task,
        status: task.status === 'pending' && new Date(task.due_date) < now ? 'overdue' : task.status
      }));
      
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile?.organization_id)
        .neq('status', 'member')
        .order('first_name');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('organization_id', profile?.organization_id)
        .in('role', ['owner', 'manager', 'staff'])
        .order('first_name');

      if (error) throw error;
      setStaff(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dueDateTime = formData.due_time 
        ? `${formData.due_date}T${formData.due_time}:00`
        : `${formData.due_date}T09:00:00`;

      const taskData = {
        lead_id: formData.lead_id,
        assigned_to: formData.assigned_to,
        task_type: formData.task_type,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        due_date: dueDateTime,
        status: 'pending',
        created_by: user?.id,
      };

      const { error } = await supabase
        .from('lead_follow_up_tasks')
        .insert([taskData]);

      if (error) throw error;

      toast.success('Task created successfully!');
      setIsDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, resultNotes: string = '') => {
    try {
      const { error } = await supabase
        .from('lead_follow_up_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_notes: resultNotes || null,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task completed!');
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleUpdateStatus = async (taskId: string, status: FollowUpTask['status']) => {
    try {
      const { error } = await supabase
        .from('lead_follow_up_tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task status updated!');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const resetForm = () => {
    setFormData({
      lead_id: '',
      assigned_to: user?.id || '',
      task_type: 'call',
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      due_time: '',
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterAssignee !== 'all' && task.assigned_to !== filterAssignee) return false;
    return true;
  });

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Follow-up Tasks</h2>
          <p className="text-gray-600">Manage and track lead follow-up activities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Follow-up Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead_id">Lead *</Label>
                <Select
                  value={formData.lead_id}
                  onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.first_name} {lead.last_name} ({lead.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To *</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task_type">Task Type</Label>
                  <Select
                    value={formData.task_type}
                    onValueChange={(value: FollowUpTask['task_type']) =>
                      setFormData({ ...formData, task_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: FollowUpTask['priority']) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Follow up on gym tour"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional task details..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_time">Due Time</Label>
                  <Input
                    id="due_time"
                    type="time"
                    value={formData.due_time}
                    onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {staff.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.first_name} {member.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const IconComponent = taskTypeIcons[task.task_type];
                const isOverdue = task.status === 'overdue';
                
                return (
                  <TableRow key={task.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {task.lead?.first_name} {task.lead?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{task.lead?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.assigned_staff?.first_name} {task.assigned_staff?.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <IconComponent className="w-4 h-4 mr-2 text-gray-500" />
                        {task.task_type.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(task.due_date).toLocaleDateString()}
                      <br />
                      <span className="text-sm text-gray-500">
                        {new Date(task.due_date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[task.status]}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {task.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredTasks.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tasks found</p>
              <p className="text-sm text-gray-400 mb-4">
                Create your first follow-up task to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};