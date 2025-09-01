import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, User, Plus, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import SessionBookingDialog from './SessionBookingDialog';
import SessionDetailDialog from './SessionDetailDialog';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TrainingSession {
  id: string;
  trainer_id: string;
  member_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  session_type: string;
  status: string;
  price: number;
  notes?: string;
  trainer_name?: string;
  member_name?: string;
}

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function PersonalTrainingScheduler() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const { profile } = useAuth();
  const canManageTraining = permissions.hasRole('owner') || permissions.hasRole('manager') || permissions.hasRole('staff');
  const isTrainer = permissions.hasRole('trainer');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainers();
    fetchSessions();
  }, [selectedTrainer]);

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
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('personal_training_sessions')
        .select(`
          *,
          trainer:profiles!trainer_id(first_name, last_name),
          member:profiles!member_id(first_name, last_name)
        `)
        .order('session_date', { ascending: true });

      // Filter by trainer if selected
      if (selectedTrainer !== 'all') {
        query = query.eq('trainer_id', selectedTrainer);
      }

      // If user is a trainer, only show their sessions
      if (isTrainer && !canManageTraining) {
        query = query.eq('trainer_id', profile?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedSessions = (data || []).map(session => ({
        ...session,
        trainer_name: session.trainer ? `${session.trainer.first_name} ${session.trainer.last_name}` : 'Unknown Trainer',
        member_name: session.member ? `${session.member.first_name} ${session.member.last_name}` : 'Unknown Member'
      }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load training sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents = sessions.map(session => {
    const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`);
    const endDateTime = new Date(`${session.session_date}T${session.end_time}`);

    return {
      id: session.id,
      title: `${session.member_name} - ${session.trainer_name}`,
      start: sessionDateTime,
      end: endDateTime,
      resource: session,
      className: `training-session-${session.status}`
    };
  });

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3174ad';
    
    switch (event.resource.status) {
      case 'scheduled':
        backgroundColor = '#10b981';
        break;
      case 'completed':
        backgroundColor = '#6b7280';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        break;
      case 'no_show':
        backgroundColor = '#f59e0b';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const handleSelectEvent = (event: any) => {
    setSelectedSession(event.resource);
    setIsDetailDialogOpen(true);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (canManageTraining) {
      setIsBookingDialogOpen(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: { variant: 'default', label: 'Scheduled' },
      completed: { variant: 'secondary', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      no_show: { variant: 'outline', label: 'No Show' }
    };

    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by trainer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trainers</SelectItem>
              {trainers.map((trainer) => (
                <SelectItem key={trainer.id} value={trainer.id}>
                  {trainer.first_name} {trainer.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {canManageTraining && (
          <Button onClick={() => setIsBookingDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Book Session
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Training Schedule
          </CardTitle>
          <CardDescription>
            {canManageTraining ? 'Click on a time slot to book a new session or click existing sessions to view details' : 'View your upcoming training sessions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'week', 'day']}
              defaultView="week"
              step={30}
              timeslots={2}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable={canManageTraining}
              popup
              tooltipAccessor={(event: any) => 
                `${event.resource.member_name} with ${event.resource.trainer_name}\n${event.resource.session_type} - ${event.resource.status}`
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today's Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {sessions.filter(s => s.session_date === format(new Date(), 'yyyy-MM-dd')).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {sessions.filter(s => {
                const sessionDate = new Date(s.session_date);
                const today = new Date();
                const weekStart = startOfWeek(today);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);
                return sessionDate >= weekStart && sessionDate < weekEnd;
              }).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {trainers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <SessionBookingDialog
        open={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
        onSuccess={fetchSessions}
        trainers={trainers}
      />

      <SessionDetailDialog
        session={selectedSession}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onSuccess={fetchSessions}
      />
    </div>
  );
}