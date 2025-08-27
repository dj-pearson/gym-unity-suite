import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MemberBookingDialog from '@/components/classes/MemberBookingDialog';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { format, startOfDay, endOfDay, isToday, isTomorrow, isThisWeek } from 'date-fns';

interface ClassWithBooking {
  id: string;
  name: string;
  scheduled_at: string;
  max_capacity: number;
  duration_minutes: number;
  description?: string;
  location?: {
    name: string;
  };
  instructor?: {
    first_name?: string;
    last_name?: string;
  };
  category?: {
    name: string;
    color: string;
  };
  current_bookings: number;
  user_booking?: {
    id: string;
    status: string;
  };
  user_waitlist?: {
    id: string;
    priority_order: number;
    status: string;
  };
}

export default function MemberClasses() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassWithBooking[]>([]);
  const [bookedClasses, setBookedClasses] = useState<ClassWithBooking[]>([]);
  const [waitlistedClasses, setWaitlistedClasses] = useState<ClassWithBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithBooking | null>(null);

  useEffect(() => {
    fetchClasses();
    fetchMyBookings();
  }, [profile?.id, selectedDate]);

  const fetchClasses = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      const startDate = startOfDay(selectedDate).toISOString();
      const endDate = endOfDay(selectedDate).toISOString();

      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          scheduled_at,
          max_capacity,
          duration_minutes,
          description,
          location:locations (
            name
          ),
          instructor:profiles!classes_instructor_id_fkey (
            first_name,
            last_name
          ),
          category:class_categories (
            name,
            color
          )
        `)
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      if (!data) {
        setClasses([]);
        return;
      }

      // Get booking counts and user's booking status for each class
      const classesWithBookings = await Promise.all(
        data.map(async (classItem) => {
          // Get total bookings count
          const { count: bookingsCount } = await supabase
            .from('class_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id)
            .eq('status', 'booked');

          // Check user's booking status
          const { data: userBooking } = await supabase
            .from('class_bookings')
            .select('id, status')
            .eq('class_id', classItem.id)
            .eq('member_id', profile.id)
            .maybeSingle();

          // Check user's waitlist status
          const { data: userWaitlist } = await supabase
            .from('class_waitlists')
            .select('id, priority_order, status')
            .eq('class_id', classItem.id)
            .eq('member_id', profile.id)
            .eq('status', 'waiting')
            .maybeSingle();

          return {
            ...classItem,
            current_bookings: bookingsCount || 0,
            user_booking: userBooking,
            user_waitlist: userWaitlist
          };
        })
      );

      setClasses(classesWithBookings);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    if (!profile?.id) return;

    try {
      // Fetch booked classes
      const { data: booked } = await supabase
        .from('class_bookings')
        .select(`
          id,
          status,
          class:classes (
            id,
            name,
            scheduled_at,
            max_capacity,
            duration_minutes,
            description,
            location:locations (name),
            instructor:profiles!classes_instructor_id_fkey (
              first_name,
              last_name
            ),
            category:class_categories (
              name,
              color
            )
          )
        `)
        .eq('member_id', profile.id)
        .eq('status', 'booked')
        .gte('class.scheduled_at', new Date().toISOString())
        .order('class.scheduled_at', { ascending: true });

      // Fetch waitlisted classes
      const { data: waitlisted } = await supabase
        .from('class_waitlists')
        .select(`
          id,
          priority_order,
          status,
          class:classes (
            id,
            name,
            scheduled_at,
            max_capacity,
            duration_minutes,
            description,
            location:locations (name),
            instructor:profiles!classes_instructor_id_fkey (
              first_name,
              last_name
            ),
            category:class_categories (
              name,
              color
            )
          )
        `)
        .eq('member_id', profile.id)
        .eq('status', 'waiting')
        .gte('class.scheduled_at', new Date().toISOString())
        .order('class.scheduled_at', { ascending: true });

      // Transform data to match ClassWithBooking interface
      const bookedClassesData = booked?.map(booking => ({
        id: booking.class?.id || '',
        name: booking.class?.name || '',
        scheduled_at: booking.class?.scheduled_at || '',
        max_capacity: booking.class?.max_capacity || 0,
        duration_minutes: booking.class?.duration_minutes || 0,
        description: booking.class?.description,
        location: booking.class?.location,
        instructor: booking.class?.instructor,
        category: booking.class?.category,
        current_bookings: 0,
        user_booking: { id: booking.id, status: booking.status }
      })) || [];

      const waitlistedClassesData = waitlisted?.filter(waitlist => waitlist.class).map(waitlist => ({
        id: waitlist.class.id,
        name: waitlist.class.name,
        scheduled_at: waitlist.class.scheduled_at,
        max_capacity: waitlist.class.max_capacity,
        duration_minutes: waitlist.class.duration_minutes,
        description: waitlist.class.description,
        location: waitlist.class.location,
        instructor: waitlist.class.instructor,
        category: waitlist.class.category,
        current_bookings: 0,
        user_waitlist: { 
          id: waitlist.id, 
          priority_order: waitlist.priority_order, 
          status: waitlist.status 
        }
      })) || [];

      setBookedClasses(bookedClassesData);
      setWaitlistedClasses(waitlistedClassesData);
    } catch (error: any) {
      console.error('Error fetching my bookings:', error);
    }
  };

  const handleBookClass = (classItem: ClassWithBooking) => {
    setSelectedClass(classItem);
    setBookingDialogOpen(true);
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: "Your class booking has been cancelled successfully",
      });

      fetchClasses();
      fetchMyBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const leaveWaitlist = async (waitlistId: string) => {
    try {
      const { error } = await supabase
        .from('class_waitlists')
        .delete()
        .eq('id', waitlistId);

      if (error) throw error;

      toast({
        title: "Left Waitlist",
        description: "You have been removed from the waitlist",
      });

      fetchClasses();
      fetchMyBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to leave waitlist",
        variant: "destructive",
      });
    }
  };

  const getClassStatus = (classItem: ClassWithBooking) => {
    if (classItem.user_booking?.status === 'booked') {
      return { text: 'Booked', color: 'bg-gradient-success text-white', icon: CheckCircle };
    }
    if (classItem.user_waitlist?.status === 'waiting') {
      return { 
        text: `Waitlist #${classItem.user_waitlist.priority_order}`, 
        color: 'bg-gradient-warning text-white',
        icon: AlertCircle
      };
    }
    if (classItem.current_bookings >= classItem.max_capacity) {
      return { text: 'Full', color: 'bg-muted text-muted-foreground', icon: XCircle };
    }
    return { text: 'Available', color: 'bg-gradient-primary text-white', icon: CheckCircle };
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const renderClassCard = (classItem: ClassWithBooking, showActions = true) => {
    const status = getClassStatus(classItem);
    const StatusIcon = status.icon;

    return (
      <Card key={classItem.id} className="gym-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{classItem.name}</h3>
                {classItem.category && (
                  <Badge 
                    variant="outline" 
                    style={{ borderColor: classItem.category.color, color: classItem.category.color }}
                  >
                    {classItem.category.name}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(classItem.scheduled_at), 'h:mm a')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {classItem.current_bookings}/{classItem.max_capacity}
                  </div>
                </div>
                
                {classItem.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {classItem.location.name}
                  </div>
                )}
                
                {classItem.instructor && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {classItem.instructor.first_name} {classItem.instructor.last_name}
                  </div>
                )}
              </div>
            </div>
            
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.text}
            </Badge>
          </div>

          {classItem.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {classItem.description}
            </p>
          )}

          {showActions && (
            <div className="flex items-center gap-2">
              {classItem.user_booking?.status === 'booked' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelBooking(classItem.user_booking!.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Cancel Booking
                </Button>
              ) : classItem.user_waitlist?.status === 'waiting' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => leaveWaitlist(classItem.user_waitlist!.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Leave Waitlist
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleBookClass(classItem)}
                  disabled={classItem.current_bookings >= classItem.max_capacity}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {classItem.current_bookings >= classItem.max_capacity ? 'Join Waitlist' : 'Book Class'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground">Book and manage your fitness classes</p>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Classes</TabsTrigger>
          <TabsTrigger value="booked">My Bookings ({bookedClasses.length})</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlisted ({waitlistedClasses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border-0"
                  disabled={(date) => date < startOfDay(new Date())}
                />
              </CardContent>
            </Card>

            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Classes for {getDateLabel(selectedDate)}
                </h2>
                <Badge variant="outline">
                  {format(selectedDate, 'MMM d, yyyy')}
                </Badge>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : classes.length === 0 ? (
                <Card className="gym-card">
                  <CardContent className="p-8 text-center">
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Classes Scheduled</h3>
                    <p className="text-muted-foreground">
                      There are no classes scheduled for {format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {classes.map((classItem) => renderClassCard(classItem))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="booked" className="space-y-4">
          {bookedClasses.length === 0 ? (
            <Card className="gym-card">
              <CardContent className="p-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Booked Classes</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't booked any upcoming classes yet
                </p>
                <Button onClick={() => {/* TODO: Navigate to browse tab */}}>
                  Browse Classes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {bookedClasses.map((classItem) => renderClassCard(classItem))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          {waitlistedClasses.length === 0 ? (
            <Card className="gym-card">
              <CardContent className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Waitlisted Classes</h3>
                <p className="text-muted-foreground">
                  You're not currently on any waitlists
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {waitlistedClasses.map((classItem) => renderClassCard(classItem))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedClass && (
        <MemberBookingDialog
          isOpen={bookingDialogOpen}
          onClose={() => {
            setBookingDialogOpen(false);
            setSelectedClass(null);
          }}
          classData={{
            id: selectedClass.id,
            name: selectedClass.name,
            description: selectedClass.description,
            duration_minutes: selectedClass.duration_minutes,
            max_capacity: selectedClass.max_capacity,
            scheduled_at: selectedClass.scheduled_at,
            category: selectedClass.category,
            instructor: selectedClass.instructor ? {
              id: 'temp-id',
              first_name: selectedClass.instructor.first_name,
              last_name: selectedClass.instructor.last_name,
              email: 'temp@email.com',
              avatar_url: undefined
            } : null,
            location: selectedClass.location || { name: 'Unknown Location' },
            bookings: []
          }}
          onBookingChange={() => {
            fetchClasses();
            fetchMyBookings();
          }}
        />
      )}
    </div>
  );
}