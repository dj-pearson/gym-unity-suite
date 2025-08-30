import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, MapPin } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfDay, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Class {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  max_capacity: number;
  scheduled_at: string;
  category: {
    name: string;
    color: string;
  } | null;
  instructor: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
  } | null;
  location: {
    name: string;
  };
  bookings: Array<{
    id: string;
    status: string;
    member_id: string;
  }>;
}

interface ClassCalendarViewProps {
  onClassClick?: (classItem: Class) => void;
  onScheduleClick?: () => void;
}

type ViewModeType = 'week' | 'month';

export default function ClassCalendarView({ onClassClick, onScheduleClick }: ClassCalendarViewProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewModeType>('week');

  useEffect(() => {
    fetchClasses();
  }, [profile?.organization_id, selectedDate, viewMode]);

  const fetchClasses = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Calculate date range based on view mode
      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'week') {
        startDate = startOfWeek(selectedDate);
        endDate = endOfWeek(selectedDate);
      } else {
        // Month view - get classes for the whole month
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      }

      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          duration_minutes,
          max_capacity,
          scheduled_at,
          class_categories (
            name,
            color
          ),
          profiles!classes_instructor_id_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          locations (
            name
          ),
          class_bookings (
            id,
            status,
            member_id
          )
        `)
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', startDate.toISOString())
        .lt('scheduled_at', endDate.toISOString())
        .order('scheduled_at');

      if (error) throw error;

      const transformedClasses = data.map(classItem => ({
        ...classItem,
        category: classItem.class_categories,
        instructor: classItem.profiles,
        location: classItem.locations,
        bookings: classItem.class_bookings || []
      }));

      setClasses(transformedClasses);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInstructorName = (instructor: Class['instructor']) => {
    if (!instructor) return 'No Instructor';
    if (instructor.first_name && instructor.last_name) {
      return `${instructor.first_name} ${instructor.last_name}`;
    }
    return instructor.email;
  };

  const getInstructorInitials = (instructor: Class['instructor']) => {
    if (!instructor) return 'NI';
    if (instructor.first_name && instructor.last_name) {
      return `${instructor.first_name[0]}${instructor.last_name[0]}`.toUpperCase();
    }
    return instructor.email[0].toUpperCase();
  };

  const getClassesForDay = (date: Date) => {
    return classes.filter(classItem => 
      isSameDay(new Date(classItem.scheduled_at), date)
    ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const canScheduleClasses = profile?.role && ['owner', 'manager', 'staff'].includes(profile.role);

  const handleViewModeChange = (mode: ViewModeType) => {
    setViewMode(mode);
  };

  // View mode buttons component to avoid type narrowing issues
  const ViewModeButtons = () => (
    <div className="flex space-x-2">
      <Button
        variant={viewMode === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleViewModeChange('week')}
      >
        Week
      </Button>
      <Button
        variant={viewMode === 'month' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleViewModeChange('month')}
      >
        Month
      </Button>
    </div>
  );

  if (viewMode === 'month') {
    return (
      <div className="space-y-4">
        {/* Month Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(selectedDate, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <ViewModeButtons />
        </div>

        {/* Calendar */}
        <Card className="gym-card">
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="w-full"
              components={{
                Day: ({ date, ...props }) => {
                  const dayClasses = getClassesForDay(date);
                  return (
                    <div className="relative">
                      <button {...props} className="w-full h-full min-h-[40px] p-1">
                        <div className="text-sm">{date.getDate()}</div>
                        {dayClasses.length > 0 && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Classes */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Classes on {format(selectedDate, 'PPP')}</span>
              {canScheduleClasses && (
                <Button size="sm" onClick={onScheduleClick} className="bg-gradient-secondary hover:opacity-90">
                  Schedule Class
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <DayClassList 
                classes={getClassesForDay(selectedDate)} 
                onClassClick={onClassClick}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Week view
  const weekStart = startOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(selectedDate) });

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(weekStart, 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d, yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <ViewModeButtons />
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayClasses = getClassesForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={day.toISOString()} className={`gym-card ${isToday ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">
                  <div className="font-medium">{format(day, 'EEE')}</div>
                  <div className={`text-lg ${isToday ? 'text-primary font-bold' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {loading ? (
                  <div className="text-xs text-muted-foreground text-center py-2">Loading...</div>
                ) : dayClasses.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No classes
                  </div>
                ) : (
                  <DayClassList classes={dayClasses} onClassClick={onClassClick} compact />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface DayClassListProps {
  classes: Class[];
  onClassClick?: (classItem: Class) => void;
  compact?: boolean;
}

function DayClassList({ classes, onClassClick, compact = false }: DayClassListProps) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <CalendarIcon className="mx-auto h-8 w-8 opacity-50 mb-2" />
        <p className="text-sm">No classes scheduled</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {classes.map((classItem) => {
        const bookedCount = classItem.bookings.filter(b => b.status === 'booked').length;
        const capacityPercentage = (bookedCount / classItem.max_capacity) * 100;

        return (
          <div
            key={classItem.id}
            className={`border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
              compact ? 'space-y-1' : 'space-y-2'
            }`}
            onClick={() => onClassClick?.(classItem)}
          >
            {/* Class Category */}
            {classItem.category && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: classItem.category.color,
                  color: classItem.category.color,
                  fontSize: '10px'
                }}
              >
                {classItem.category.name}
              </Badge>
            )}

            {/* Class Name */}
            <h4 className={`font-medium text-foreground ${compact ? 'text-sm' : ''}`}>
              {classItem.name}
            </h4>

            {/* Time */}
            <div className={`flex items-center text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
              <Clock className="mr-1 h-3 w-3" />
              <span>{format(new Date(classItem.scheduled_at), 'h:mm a')}</span>
            </div>

            {!compact && (
              <>
                {/* Location */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-3 w-3" />
                  <span>{classItem.location.name}</span>
                </div>

                {/* Instructor */}
                {classItem.instructor && (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={classItem.instructor.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-white text-xs">
                        {classItem.instructor.first_name?.[0] || classItem.instructor.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground truncate">
                      {classItem.instructor.first_name && classItem.instructor.last_name
                        ? `${classItem.instructor.first_name} ${classItem.instructor.last_name}`
                        : classItem.instructor.email}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Capacity */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
                <Users className="mr-1 h-3 w-3" />
                <span>{bookedCount}/{classItem.max_capacity}</span>
              </div>
              <div className={`w-12 bg-muted rounded-full ${compact ? 'h-1' : 'h-2'}`}>
                <div 
                  className={`${compact ? 'h-1' : 'h-2'} rounded-full transition-smooth ${
                    capacityPercentage >= 90 ? 'bg-gradient-to-r from-warning to-destructive' :
                    capacityPercentage >= 70 ? 'bg-gradient-to-r from-primary to-warning' :
                    'bg-gradient-primary'
                  }`}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}