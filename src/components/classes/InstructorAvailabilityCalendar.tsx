import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  User,
  CalendarDays,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface InstructorAvailability {
  id: string;
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  instructor?: {
    first_name: string;
    last_name: string;
  };
}

interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function InstructorAvailabilityCalendar() {
  const { profile } = useAuth();
  const [availability, setAvailability] = useState<InstructorAvailability[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<InstructorAvailability | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    instructor_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    is_available: true
  });

  useEffect(() => {
    fetchInstructors();
    if (selectedInstructor) {
      fetchAvailability();
    }
  }, [profile?.organization_id, selectedInstructor]);

  const fetchInstructors = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .in('role', ['trainer', 'staff'])
        .order('first_name');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast.error('Failed to load instructors');
    }
  };

  const fetchAvailability = async () => {
    if (!selectedInstructor) return;

    try {
      const { data, error } = await supabase
        .from('instructor_availability')
        .select(`
          *,
          instructor:profiles(first_name, last_name)
        `)
        .eq('instructor_id', selectedInstructor)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const availabilityData = {
        instructor_id: formData.instructor_id || selectedInstructor,
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_available: formData.is_available
      };

      if (editingAvailability) {
        const { error } = await supabase
          .from('instructor_availability')
          .update(availabilityData)
          .eq('id', editingAvailability.id);

        if (error) throw error;
        toast.success('Availability updated successfully');
      } else {
        const { error } = await supabase
          .from('instructor_availability')
          .insert([availabilityData]);

        if (error) throw error;
        toast.success('Availability added successfully');
      }

      setFormData({
        instructor_id: '',
        day_of_week: '',
        start_time: '',
        end_time: '',
        is_available: true
      });
      setEditingAvailability(null);
      setShowAddDialog(false);
      fetchAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('instructor_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Availability deleted successfully');
      fetchAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Failed to delete availability');
    }
  };

  const handleEdit = (availability: InstructorAvailability) => {
    setEditingAvailability(availability);
    setFormData({
      instructor_id: availability.instructor_id,
      day_of_week: availability.day_of_week.toString(),
      start_time: availability.start_time,
      end_time: availability.end_time,
      is_available: availability.is_available
    });
    setShowAddDialog(true);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupedAvailability = daysOfWeek.map(day => ({
    ...day,
    slots: availability.filter(slot => slot.day_of_week === day.value)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Instructor Availability</h2>
          <p className="text-muted-foreground">Manage instructor schedules and availability</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select instructor" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.first_name} {instructor.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button disabled={!selectedInstructor}>
                <Plus className="mr-2 h-4 w-4" />
                Add Availability
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAvailability ? 'Edit' : 'Add'} Availability
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Day of Week</Label>
                  <Select 
                    value={formData.day_of_week} 
                    onValueChange={(value) => setFormData(prev => ({...prev, day_of_week: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="is_available"
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData(prev => ({...prev, is_available: e.target.checked}))}
                    className="rounded"
                  />
                  <Label htmlFor="is_available">Available for scheduling</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddDialog(false);
                    setEditingAvailability(null);
                    setFormData({
                      instructor_id: '',
                      day_of_week: '',
                      start_time: '',
                      end_time: '',
                      is_available: true
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAvailability ? 'Update' : 'Add'} Availability
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedInstructor ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select an Instructor</h3>
            <p className="text-muted-foreground">
              Choose an instructor from the dropdown to view and manage their availability
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {groupedAvailability.map((day) => (
            <Card key={day.value} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-center">
                  {day.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {day.slots.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No availability set
                  </div>
                ) : (
                  day.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-2 border rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {slot.is_available ? (
                            <CheckCircle className="w-3 h-3 text-success" />
                          ) : (
                            <XCircle className="w-3 h-3 text-destructive" />
                          )}
                          <Badge 
                            variant={slot.is_available ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {slot.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(slot)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(slot.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}