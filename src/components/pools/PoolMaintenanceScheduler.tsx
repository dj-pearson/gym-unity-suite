import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, AlertCircle, CheckCircle, Plus, Edit, Trash2, Play, User, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface PoolMaintenanceSchedule {
  id: string;
  pool_id?: string;
  equipment_id?: string;
  maintenance_type: string;
  title: string;
  description?: string;
  estimated_duration_minutes: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  next_due_date?: string;
  scheduled_date?: string;
  status?: string;
  created_at: string;
  pool_name?: string;
  assigned_staff_name?: string;
}

interface Pool {
  id: string;
  name: string;
  equipment_type?: string;
  status?: string;
}

export default function PoolMaintenanceScheduler() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<PoolMaintenanceSchedule[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PoolMaintenanceSchedule | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterPool, setFilterPool] = useState<string>('all');

  const [formData, setFormData] = useState({
    equipment_id: '',
    maintenance_type: '',
    title: '',
    description: '',
    estimated_duration_minutes: 60,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assigned_to: '',
    scheduled_date: '',
    status: 'scheduled' as const
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchSchedules();
      fetchPools();
      fetchStaff();
    }
  }, [profile?.organization_id]);

  const fetchSchedules = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select(`
          *,
          equipment!inner(name),
          profiles:assigned_to(first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('equipment.equipment_type', 'pool')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const schedulesWithNames = data?.map((schedule: any) => ({
        ...schedule,
        pool_name: schedule.equipment?.name || 'Pool',
        assigned_staff_name: schedule.profiles ? `${schedule.profiles.first_name} ${schedule.profiles.last_name}` : undefined,
        next_due_date: schedule.scheduled_date,
        maintenance_type: schedule.maintenance_type || 'general',
        priority: (schedule.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical'
      })) || [];

      setSchedules(schedulesWithNames);
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPools = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, equipment_type, status')
        .eq('organization_id', profile.organization_id)
        .eq('equipment_type', 'pool')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setPools(data || []);
    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  };

  const fetchStaff = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('organization_id', profile.organization_id)
        .in('role', ['owner', 'manager', 'staff'])
        .order('first_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id || !profile.id) return;

    try {
      const scheduleData = {
        ...formData,
        organization_id: profile.organization_id
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('maintenance_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Maintenance schedule updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('maintenance_schedules')
          .insert([scheduleData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Maintenance schedule created successfully"
        });
      }

      fetchSchedules();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving maintenance schedule:', error);
      toast({
        title: "Error",
        description: "Failed to save maintenance schedule",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async (schedule: PoolMaintenanceSchedule) => {
    if (!profile?.id) return;

    try {
      // Update maintenance schedule as completed
      const { error } = await supabase
        .from('maintenance_schedules')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          completion_notes: `Completed scheduled maintenance: ${schedule.title}`
        })
        .eq('id', schedule.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance task marked as completed"
      });

      fetchSchedules();
    } catch (error) {
      console.error('Error completing maintenance task:', error);
      toast({
        title: "Error",
        description: "Failed to complete maintenance task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance schedule?')) return;

    try {
      const { error } = await supabase
        .from('maintenance_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance schedule deleted successfully"
      });

      fetchSchedules();
    } catch (error) {
      console.error('Error deleting maintenance schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete maintenance schedule",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      equipment_id: '',
      maintenance_type: '',
      title: '',
      description: '',
      estimated_duration_minutes: 60,
      priority: 'medium',
      assigned_to: '',
      scheduled_date: '',
      status: 'scheduled'
    });
    setEditingSchedule(null);
  };

  const openEditDialog = (schedule: PoolMaintenanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      equipment_id: schedule.pool_id || schedule.equipment_id || '',
      maintenance_type: schedule.maintenance_type,
      title: schedule.title,
      description: schedule.description || '',
      estimated_duration_minutes: schedule.estimated_duration_minutes,
      priority: schedule.priority,
      assigned_to: schedule.assigned_to || '',
      scheduled_date: schedule.next_due_date || schedule.scheduled_date || '',
      status: 'scheduled'
    });
    setDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (schedule: PoolMaintenanceSchedule) => {
    const dueDate = new Date(schedule.next_due_date);
    const today = new Date();
    const isOverdue = dueDate < today;
    const isDueSoon = dueDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    if (isOverdue) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (isDueSoon) return <Clock className="h-4 w-4 text-orange-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const maintenanceTypes = [
    'Water Chemistry Check',
    'Filter Cleaning',
    'Skimmer Cleaning',
    'Pump Maintenance',
    'Heater Service',
    'Deck Cleaning',
    'Tile Cleaning',
    'Equipment Inspection',
    'Chemical Adjustment',
    'Deep Cleaning',
    'Safety Equipment Check',
    'Other'
  ];

  const filteredSchedules = schedules.filter(schedule => {
    if (filterPriority !== 'all' && schedule.priority !== filterPriority) return false;
    if (filterPool !== 'all' && schedule.pool_id !== filterPool) return false;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center p-4">Loading maintenance schedules...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pool Maintenance Scheduler</h2>
          <p className="text-muted-foreground">
            Schedule and track pool maintenance tasks and water chemistry checks
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? 'Edit Maintenance Schedule' : 'Schedule Pool Maintenance'}</DialogTitle>
              <DialogDescription>
                {editingSchedule ? 'Update maintenance schedule details' : 'Create a new recurring maintenance schedule'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment_id">Pool Equipment *</Label>
                  <Select value={formData.equipment_id} onValueChange={(value) => setFormData({...formData, equipment_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pool equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {pools.map(pool => (
                        <SelectItem key={pool.id} value={pool.id}>
                          {pool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance_type">Maintenance Type *</Label>
                  <Select value={formData.maintenance_type} onValueChange={(value) => setFormData({...formData, maintenance_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Weekly Water Chemistry Check"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of maintenance tasks..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_duration_minutes">Duration (Minutes)</Label>
                  <Input
                    id="estimated_duration_minutes"
                    type="number"
                    min="15"
                    max="480"
                    value={formData.estimated_duration_minutes}
                    onChange={(e) => setFormData({...formData, estimated_duration_minutes: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assigned Staff</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData({...formData, assigned_to: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                    required
                  />
                </div>
              </div>


              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPool} onValueChange={setFilterPool}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Pools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pools</SelectItem>
            {pools.map(pool => (
              <SelectItem key={pool.id} value={pool.id}>{pool.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Maintenance Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedule ({filteredSchedules.length} tasks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(schedule)}
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{schedule.title}</h4>
                        <Badge className={getPriorityColor(schedule.priority)}>
                          {schedule.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {schedule.pool_name} • {schedule.maintenance_type}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {format(new Date(schedule.next_due_date), 'MMM d, yyyy')}</span>
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{schedule.estimated_duration_minutes} min</span>
                        </span>
                        
                        {schedule.assigned_staff_name && (
                          <span className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{schedule.assigned_staff_name}</span>
                          </span>
                        )}
                        
                        <span>Status: {schedule.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCompleteTask(schedule)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditDialog(schedule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Maintenance Scheduled</h3>
                <p className="text-muted-foreground mb-4">
                  {schedules.length === 0 
                    ? 'No maintenance tasks scheduled. Click "Schedule Maintenance" to get started.'
                    : 'No maintenance tasks match the current filters.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}