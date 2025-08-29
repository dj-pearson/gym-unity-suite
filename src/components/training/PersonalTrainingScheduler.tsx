import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  Dumbbell,
  Star,
  MapPin
} from 'lucide-react';

const sessionSchema = z.object({
  trainer_id: z.string().min(1, 'Trainer is required'),
  session_date: z.string().min(1, 'Date is required'),
  session_time: z.string().min(1, 'Time is required'),
  duration_minutes: z.number().min(30, 'Minimum 30 minutes').max(180, 'Maximum 3 hours'),
  session_type: z.enum(['assessment', 'personal_training', 'group_training', 'consultation']),
  notes: z.string().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

export function PersonalTrainingScheduler() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { profile, organization } = useAuth();
  const { toast } = useToast();

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      duration_minutes: 60,
      session_type: 'personal_training' as const,
    },
  });

  useEffect(() => {
    fetchTrainers();
    fetchSessions();
  }, [organization?.id]);

  const fetchTrainers = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('role', 'trainer');

      if (error) throw error;
      setTrainers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading trainers',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchSessions = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      // Note: This would require a new table 'training_sessions' in the database
      // For now, we'll simulate the data structure
      setSessions([
        {
          id: 'session-1',
          trainer_id: 'trainer-1',
          trainer_name: 'John Smith',
          session_date: '2024-01-15',
          session_time: '10:00',
          duration_minutes: 60,
          session_type: 'personal_training',
          status: 'scheduled',
          notes: 'Focus on upper body strength',
        },
        {
          id: 'session-2',
          trainer_id: 'trainer-2',
          trainer_name: 'Sarah Johnson',
          session_date: '2024-01-18',
          session_time: '14:00',
          duration_minutes: 30,
          session_type: 'assessment',
          status: 'completed',
          notes: 'Initial fitness assessment',
        },
      ]);
    } catch (error: any) {
      toast({
        title: 'Error loading sessions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: SessionFormData) => {
    try {
      const selectedTrainer = trainers.find(t => t.id === data.trainer_id);
      
      const newSession = {
        id: `session-${Date.now()}`,
        member_id: profile?.id,
        trainer_id: data.trainer_id,
        trainer_name: selectedTrainer ? `${selectedTrainer.first_name} ${selectedTrainer.last_name}` : 'Unknown',
        session_date: data.session_date,
        session_time: data.session_time,
        duration_minutes: data.duration_minutes,
        session_type: data.session_type,
        notes: data.notes || '',
        status: 'scheduled',
        created_at: new Date().toISOString(),
      };

      // In a real implementation, this would save to the database
      setSessions(prev => [...prev, newSession]);

      toast({
        title: 'Session scheduled',
        description: `Your ${data.session_type.replace('_', ' ')} session has been scheduled.`,
      });

      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error scheduling session',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'assessment': return 'bg-blue-100 text-blue-700';
      case 'personal_training': return 'bg-green-100 text-green-700';
      case 'group_training': return 'bg-purple-100 text-purple-700';
      case 'consultation': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const isTrainerAvailable = () => {
    // Mock availability check - in real implementation, check trainer's schedule
    return Math.random() > 0.3; // 70% chance of availability
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
          <h2 className="text-2xl font-bold">Personal Training Sessions</h2>
          <p className="text-muted-foreground">
            Schedule and manage your personal training sessions
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                Schedule Training Session
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trainer_id">Select Trainer *</Label>
                  <Select value={form.watch('trainer_id')} onValueChange={(value) => form.setValue('trainer_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {trainer.first_name} {trainer.last_name}
                            {trainer.specialization && (
                              <Badge variant="outline" className="text-xs">
                                {trainer.specialization}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.trainer_id && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.trainer_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="session_type">Session Type *</Label>
                  <Select value={form.watch('session_type')} onValueChange={(value: any) => form.setValue('session_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessment">Fitness Assessment</SelectItem>
                      <SelectItem value="personal_training">Personal Training</SelectItem>
                      <SelectItem value="group_training">Small Group Training</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="session_date">Date *</Label>
                  <Input
                    id="session_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...form.register('session_date')}
                  />
                  {form.formState.errors.session_date && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.session_date.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="session_time">Time *</Label>
                  <Input
                    id="session_time"
                    type="time"
                    {...form.register('session_time')}
                  />
                  {form.formState.errors.session_time && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.session_time.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                  <Select 
                    value={form.watch('duration_minutes')?.toString()} 
                    onValueChange={(value) => form.setValue('duration_minutes', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Session Notes (optional)</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Any specific goals or requirements for this session..."
                  rows={3}
                />
              </div>

              {form.watch('trainer_id') && form.watch('session_date') && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    {isTrainerAvailable() ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-700">Trainer appears to be available at this time</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-orange-700">This time slot may conflict with trainer's schedule</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Schedule Session
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
        <div className="grid gap-4">
          {sessions
            .filter(session => session.status === 'scheduled')
            .map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(`${session.session_date}T${session.session_time}`).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{session.session_time}</span>
                        <Badge variant="outline">{session.duration_minutes}min</Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{session.trainer_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getSessionTypeColor(session.session_type)}>
                        {session.session_type.replace('_', ' ')}
                      </Badge>
                      <Badge variant={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {session.notes && (
                    <p className="text-sm text-muted-foreground mt-2 ml-6">
                      {session.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Session History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Session History</h3>
        <div className="grid gap-4">
          {sessions
            .filter(session => session.status === 'completed')
            .map((session) => (
              <Card key={session.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {new Date(`${session.session_date}T${session.session_time}`).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{session.trainer_name}</span>
                      </div>

                      <Badge className={getSessionTypeColor(session.session_type)}>
                        {session.session_type.replace('_', ' ')}
                      </Badge>
                    </div>

                    <Badge variant={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Training Sessions</h3>
            <p className="text-muted-foreground mb-4">
              Schedule your first personal training session to get started on your fitness journey.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}