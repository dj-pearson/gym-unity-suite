import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Edit, 
  Check, 
  Clock, 
  AlertCircle,
  Calendar,
  Wrench,
  User,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

interface MaintenanceSchedule {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  title: string;
  description?: string;
  scheduled_date: string;
  estimated_duration_minutes: number;
  assigned_to?: string;
  priority: string;
  status: string;
  completion_date?: string;
  completion_notes?: string;
  cost?: number;
  equipment?: {
    name: string;
    equipment_type: string;
  } | null;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
}

export default function MaintenanceScheduler() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);

  const [formData, setFormData] = useState({
    equipment_id: '',
    maintenance_type: 'routine',
    title: '',
    description: '',
    scheduled_date: '',
    estimated_duration_minutes: '60',
    assigned_to: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Fetch maintenance schedules with equipment and staff info
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('maintenance_schedules')
        .select(`
          *,
          equipment:equipment_id (
            name,
            equipment_type
          ),
          profiles:assigned_to (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('scheduled_date', { ascending: true });

      if (schedulesError) throw schedulesError;

      // Fetch equipment for dropdown
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, equipment_type')
        .eq('organization_id', profile?.organization_id)
        .eq('status', 'active')
        .order('name');

      if (equipmentError) throw equipmentError;

      // Fetch staff for assignment
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('organization_id', profile?.organization_id)
        .in('role', ['owner', 'manager', 'staff'])
        .order('first_name');

      if (staffError) throw staffError;

      setSchedules((schedulesData || []).map(schedule => {
        const equipment = schedule.equipment && 
          typeof schedule.equipment === 'object' && 
          schedule.equipment !== null && 
          !Array.isArray(schedule.equipment) &&
          'name' in schedule.equipment ? schedule.equipment : null;
        
        const profiles = schedule.profiles && 
          typeof schedule.profiles === 'object' && 
          schedule.profiles !== null && 
          !Array.isArray(schedule.profiles) &&
          'first_name' in schedule.profiles ? schedule.profiles : null;
        
        return {
          ...schedule,
          equipment,
          profiles
        };
      }));
      setEquipment(equipmentData || []);
      setStaff(staffData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    try {
      const scheduleData = {
        ...formData,
        organization_id: profile.organization_id,
        estimated_duration_minutes: parseInt(formData.estimated_duration_minutes) || 60,
        assigned_to: formData.assigned_to || null
      };

      let error;
      if (editingSchedule) {
        const { error: updateError } = await supabase
          .from('maintenance_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('maintenance_schedules')
          .insert([scheduleData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingSchedule ? "Schedule Updated" : "Maintenance Scheduled",
        description: `${formData.title} has been ${editingSchedule ? 'updated' : 'scheduled'} successfully.`
      });

      setShowAddDialog(false);
      setEditingSchedule(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Failed to save maintenance schedule",
        variant: "destructive"
      });
    }
  };

  const handleCompleteTask = async (schedule: MaintenanceSchedule) => {
    try {
      const { error } = await supabase
        .from('maintenance_schedules')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString()
        })
        .eq('id', schedule.id);

      if (error) throw error;

      // Log the maintenance completion
      const { error: logError } = await supabase
        .from('maintenance_logs')
        .insert([{
          organization_id: profile?.organization_id,
          equipment_id: schedule.equipment_id,
          maintenance_schedule_id: schedule.id,
          performed_by: profile?.id,
          maintenance_type: schedule.maintenance_type,
          description: schedule.title,
          maintenance_date: new Date().toISOString()
        }]);

      if (logError) throw logError;

      toast({
        title: "Task Completed",
        description: "Maintenance task has been marked as completed."
      });

      fetchData();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete maintenance task",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      equipment_id: '',
      maintenance_type: 'routine',
      title: '',
      description: '',
      scheduled_date: '',
      estimated_duration_minutes: '60',
      assigned_to: '',
      priority: 'medium'
    });
  };

  const getStatusBadge = (status: string, scheduledDate: string) => {
    const isOverdue = new Date(scheduledDate) < new Date() && status === 'scheduled';
    
    const statusConfig = {
      scheduled: { 
        label: isOverdue ? 'Overdue' : 'Scheduled', 
        variant: isOverdue ? 'destructive' as const : 'secondary' as const,
        icon: isOverdue ? AlertCircle : Clock 
      },
      in_progress: { label: 'In Progress', variant: 'default' as const, icon: Wrench },
      completed: { label: 'Completed', variant: 'outline' as const, icon: Check },
      cancelled: { label: 'Cancelled', variant: 'outline' as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorities = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <Badge variant="outline" className={priorities[priority as keyof typeof priorities] || priorities.medium}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || schedule.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return <div className="flex justify-center p-4">Loading maintenance schedules...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingSchedule(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Edit Maintenance Task' : 'Schedule Maintenance'}
              </DialogTitle>
              <DialogDescription>
                {editingSchedule ? 'Update maintenance task details' : 'Schedule a new maintenance task'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment_id">Equipment *</Label>
                  <Select
                    value={formData.equipment_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.equipment_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance_type">Type *</Label>
                  <Select
                    value={formData.maintenance_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, maintenance_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Monthly belt lubrication"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="estimated_duration_minutes"
                    type="number"
                    value={formData.estimated_duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_minutes: e.target.value }))}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the maintenance task..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSchedule ? 'Update Task' : 'Schedule Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Maintenance Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedule ({filteredSchedules.length} tasks)</CardTitle>
          <CardDescription>
            Track and manage equipment maintenance tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'No maintenance tasks found matching your filters.' 
                : 'No maintenance tasks scheduled. Click "Schedule Maintenance" to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{schedule.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.maintenance_type.charAt(0).toUpperCase() + schedule.maintenance_type.slice(1)}
                          {schedule.estimated_duration_minutes && ` • ${schedule.estimated_duration_minutes}min`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{schedule.equipment?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.equipment?.equipment_type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(schedule.scheduled_date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(schedule.status, schedule.scheduled_date)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(schedule.priority)}
                    </TableCell>
                    <TableCell>
                      {schedule.profiles ? (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {schedule.profiles.first_name} {schedule.profiles.last_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {schedule.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteTask(schedule)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setFormData({
                              equipment_id: schedule.equipment_id,
                              maintenance_type: schedule.maintenance_type,
                              title: schedule.title,
                              description: schedule.description || '',
                              scheduled_date: schedule.scheduled_date,
                              estimated_duration_minutes: schedule.estimated_duration_minutes.toString(),
                              assigned_to: schedule.assigned_to || '',
                              priority: schedule.priority
                            });
                            setShowAddDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}