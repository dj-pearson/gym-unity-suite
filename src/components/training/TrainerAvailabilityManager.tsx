import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Edit, Trash2, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface TrainerAvailability {
  id: string;
  trainer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function TrainerAvailabilityManager() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const { profile } = useAuth();
  const canManageAvailability = permissions.hasRole('owner') || permissions.hasRole('manager') || permissions.hasRole('staff');
  const isTrainer = permissions.hasRole('trainer');
  
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [availability, setAvailability] = useState<TrainerAvailability[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<TrainerAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    if (selectedTrainer) {
      fetchAvailability();
    }
  }, [selectedTrainer]);

  useEffect(() => {
    // If user is a trainer, auto-select themselves
    if (isTrainer && !canManageAvailability && profile?.id) {
      setSelectedTrainer(profile.id);
    }
  }, [isTrainer, canManageAvailability, profile?.id]);

  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'trainer')
        .order('first_name');

      if (error) throw error;
      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast({
        title: "Error",
        description: "Failed to load trainers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedTrainer) return;

    try {
      const { data, error } = await supabase
        .from('trainer_availability')
        .select('*')
        .eq('trainer_id', selectedTrainer)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to load trainer availability",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true
    });
    setEditingAvailability(null);
  };

  const handleEdit = (availabilityRecord: TrainerAvailability) => {
    setFormData({
      day_of_week: availabilityRecord.day_of_week,
      start_time: availabilityRecord.start_time,
      end_time: availabilityRecord.end_time,
      is_available: availabilityRecord.is_available
    });
    setEditingAvailability(availabilityRecord);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTrainer) {
      toast({
        title: "Error",
        description: "Please select a trainer first",
        variant: "destructive"
      });
      return;
    }

    const canEdit = canManageAvailability || (isTrainer && selectedTrainer === profile?.id);
    if (!canEdit) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage this trainer's availability",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingAvailability) {
        // Update existing availability
        const { error } = await supabase
          .from('trainer_availability')
          .update({
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            is_available: formData.is_available
          })
          .eq('id', editingAvailability.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Availability updated successfully"
        });
      } else {
        // Create new availability
        const { error } = await supabase
          .from('trainer_availability')
          .insert({
            trainer_id: selectedTrainer,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            is_available: formData.is_available
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Availability added successfully"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (availabilityRecord: TrainerAvailability) => {
    const canEdit = canManageAvailability || (isTrainer && selectedTrainer === profile?.id);
    if (!canEdit) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage this trainer's availability",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trainer_availability')
        .delete()
        .eq('id', availabilityRecord.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability deleted successfully"
      });

      fetchAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: "Error",
        description: "Failed to delete availability",
        variant: "destructive"
      });
    }
  };

  const groupedAvailability = availability.reduce((acc, avail) => {
    const day = avail.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(avail);
    return acc;
  }, {} as Record<number, TrainerAvailability[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trainer Availability</h2>
          <p className="text-muted-foreground">
            Manage trainer schedules and availability
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Select 
          value={selectedTrainer} 
          onValueChange={setSelectedTrainer}
          disabled={isTrainer && !canManageAvailability}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a trainer" />
          </SelectTrigger>
          <SelectContent>
            {trainers.map((trainer) => (
              <SelectItem key={trainer.id} value={trainer.id}>
                {trainer.first_name} {trainer.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTrainer && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Availability
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAvailability ? 'Edit Availability' : 'Add Availability'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Day of Week</Label>
                  <Select 
                    value={formData.day_of_week.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                  <Label htmlFor="is_available">Available</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAvailability ? 'Update' : 'Add'} Availability
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!selectedTrainer ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trainer Selected</h3>
              <p className="text-muted-foreground">
                Please select a trainer to view and manage their availability.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS_OF_WEEK.map((day, dayIndex) => (
            <Card key={dayIndex}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {groupedAvailability[dayIndex]?.map((avail) => (
                  <div
                    key={avail.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">
                        {avail.start_time} - {avail.end_time}
                      </span>
                      {!avail.is_available && (
                        <Badge variant="outline" className="text-xs">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(avail)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(avail)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No availability set
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}