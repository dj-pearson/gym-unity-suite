import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, User, MapPin, Calendar, DollarSign, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface StaffAssignment {
  id: string;
  staff_id: string;
  location_id: string;
  assignment_type: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  is_active: boolean;
  staff_member: { first_name: string; last_name: string; email: string; role: string };
  location: { name: string; location_code: string };
}

export function StaffLocationAssignments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StaffAssignment | null>(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    location_id: '',
    assignment_type: 'primary',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    hourly_rate: '',
    permissions: {}
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['staff-location-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cross_location_assignments')
        .select(`
          *,
          staff_member:profiles!cross_location_assignments_staff_id_fkey(first_name, last_name, email, role),
          location:locations!cross_location_assignments_location_id_fkey(name, location_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, location_code')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const { data: staff } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .in('role', ['staff', 'manager'])
        .order('first_name');

      if (error) throw error;
      return data;
    },
  });

  const saveAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedAssignment) {
        const { error } = await supabase
          .from('cross_location_assignments')
          .update(data)
          .eq('id', selectedAssignment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cross_location_assignments')
          .insert({
            ...data,
            organization_id: user?.user_metadata?.organization_id,
            created_by: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-location-assignments'] });
      toast.success(selectedAssignment ? 'Assignment updated successfully' : 'Assignment created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save assignment');
    },
  });

  const toggleAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, isActive }: { assignmentId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('cross_location_assignments')
        .update({ 
          is_active: !isActive,
          end_date: !isActive ? null : new Date().toISOString().split('T')[0]
        })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-location-assignments'] });
      toast.success('Assignment status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assignment status');
    },
  });

  const resetForm = () => {
    setFormData({
      staff_id: '',
      location_id: '',
      assignment_type: 'primary',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      hourly_rate: '',
      permissions: {}
    });
    setSelectedAssignment(null);
  };

  const handleEdit = (assignment: StaffAssignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      staff_id: assignment.staff_id,
      location_id: assignment.location_id,
      assignment_type: assignment.assignment_type,
      start_date: assignment.start_date,
      end_date: assignment.end_date || '',
      hourly_rate: assignment.hourly_rate?.toString() || '',
      permissions: {}
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      end_date: formData.end_date || null,
    };

    saveAssignmentMutation.mutate(submissionData);
  };

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-blue-500';
      case 'secondary': return 'bg-green-500';
      case 'floating': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStaffRoleIcon = (role: string) => {
    return <User className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Staff Location Assignments</h2>
          <p className="text-muted-foreground">Manage staff assignments across locations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAssignment ? 'Edit Assignment' : 'Create Staff Assignment'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staff_id">Staff Member</Label>
                  <Select 
                    value={formData.staff_id} 
                    onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location_id">Location</Label>
                  <Select 
                    value={formData.location_id} 
                    onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} {location.location_code && `(${location.location_code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignment_type">Assignment Type</Label>
                  <Select 
                    value={formData.assignment_type} 
                    onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="floating">Floating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    placeholder="e.g., 25.00"
                  />
                </div>

                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveAssignmentMutation.isPending}>
                  {saveAssignmentMutation.isPending ? 'Saving...' : selectedAssignment ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>Staff assignments across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments?.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStaffRoleIcon(assignment.staff_member?.role)}
                      <div>
                        <div className="font-medium">
                          {assignment.staff_member?.first_name} {assignment.staff_member?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.staff_member?.role}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{assignment.location?.name}</span>
                      {assignment.location?.location_code && (
                        <Badge variant="outline" className="text-xs">
                          {assignment.location.location_code}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAssignmentTypeColor(assignment.assignment_type)} variant="outline">
                      {assignment.assignment_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(assignment.start_date), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.hourly_rate ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        ${assignment.hourly_rate.toFixed(2)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
                      {assignment.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAssignmentMutation.mutate({ 
                          assignmentId: assignment.id, 
                          isActive: assignment.is_active 
                        })}
                      >
                        {assignment.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}