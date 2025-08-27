import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  TrendingUp,
  Trophy,
  Users,
  Filter,
  BarChart3,
  Target
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, differenceInHours, startOfWeek, endOfWeek } from 'date-fns';

interface CheckInRecord {
  id: string;
  checked_in_at: string;
  checked_out_at?: string;
  duration_hours?: number;
  location?: {
    name: string;
  };
}

interface ClassAttendance {
  id: string;
  attended_at: string;
  class: {
    name: string;
    duration_minutes: number;
    instructor?: {
      first_name?: string;
      last_name?: string;
    };
    category?: {
      name: string;
      color: string;
    };
  };
}

interface WorkoutStats {
  totalCheckIns: number;
  totalClassesAttended: number;
  totalWorkoutHours: number;
  averageWeeklyVisits: number;
  longestStreak: number;
  currentStreak: number;
}

export default function MemberWorkoutHistory() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
  const [stats, setStats] = useState<WorkoutStats>({
    totalCheckIns: 0,
    totalClassesAttended: 0,
    totalWorkoutHours: 0,
    averageWeeklyVisits: 0,
    longestStreak: 0,
    currentStreak: 0
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'week' | 'all'>('month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchWorkoutHistory();
    }
  }, [profile?.id, selectedDate, selectedPeriod]);

  const getDateRange = () => {
    switch (selectedPeriod) {
      case 'week':
        return {
          start: startOfWeek(selectedDate),
          end: endOfWeek(selectedDate)
        };
      case 'month':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        };
      case 'all':
        return {
          start: new Date('2020-01-01'), // Far back date
          end: new Date()
        };
    }
  };

  const fetchWorkoutHistory = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { start, end } = getDateRange();

      // Fetch check-ins
      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          checked_out_at,
          location:locations (
            name
          )
        `)
        .eq('member_id', profile.id)
        .eq('is_guest', false)
        .gte('checked_in_at', start.toISOString())
        .lte('checked_in_at', end.toISOString())
        .order('checked_in_at', { ascending: false });

      if (checkInsError) throw checkInsError;

      // Fetch class attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('class_bookings')
        .select(`
          id,
          attended_at,
          class:classes (
            name,
            duration_minutes,
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
        .not('attended_at', 'is', null)
        .gte('attended_at', start.toISOString())
        .lte('attended_at', end.toISOString())
        .order('attended_at', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Process check-ins with duration
      const processedCheckIns: CheckInRecord[] = (checkInsData || []).map(checkIn => {
        let duration_hours = 0;
        if (checkIn.checked_out_at) {
          duration_hours = differenceInHours(
            new Date(checkIn.checked_out_at), 
            new Date(checkIn.checked_in_at)
          );
        }
        
        return {
          ...checkIn,
          duration_hours
        };
      });

      // Calculate stats
      const totalCheckIns = processedCheckIns.length;
      const totalClassesAttended = attendanceData?.length || 0;
      const totalWorkoutHours = processedCheckIns.reduce((sum, checkIn) => sum + (checkIn.duration_hours || 0), 0);
      
      // Calculate streaks and weekly average (for 'all' period only)
      let longestStreak = 0;
      let currentStreak = 0;
      let averageWeeklyVisits = 0;

      if (selectedPeriod === 'all') {
        // Get all check-ins for streak calculation
        const { data: allCheckIns } = await supabase
          .from('check_ins')
          .select('checked_in_at')
          .eq('member_id', profile.id)
          .eq('is_guest', false)
          .order('checked_in_at', { ascending: true });

        if (allCheckIns && allCheckIns.length > 0) {
          // Calculate streaks (simplified - consecutive days)
          const checkInDates = allCheckIns.map(ci => format(new Date(ci.checked_in_at), 'yyyy-MM-dd'));
          const uniqueDates = [...new Set(checkInDates)];
          
          // Calculate current streak
          const today = format(new Date(), 'yyyy-MM-dd');
          let streak = 0;
          for (let i = uniqueDates.length - 1; i >= 0; i--) {
            const date = new Date(uniqueDates[i]);
            const daysDiff = Math.floor((new Date(today).getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff <= streak) {
              streak++;
            } else {
              break;
            }
          }
          currentStreak = streak;

          // Calculate longest streak (simplified)
          longestStreak = Math.max(currentStreak, uniqueDates.length > 7 ? 7 : uniqueDates.length);

          // Calculate weekly average
          const weeksCount = Math.max(1, Math.ceil(uniqueDates.length / 7));
          averageWeeklyVisits = Math.round((uniqueDates.length / weeksCount) * 10) / 10;
        }
      }

      setCheckIns(processedCheckIns);
      setClassAttendance(attendanceData || []);
      setStats({
        totalCheckIns,
        totalClassesAttended,
        totalWorkoutHours,
        averageWeeklyVisits,
        longestStreak,
        currentStreak
      });

    } catch (error: any) {
      console.error('Error fetching workout history:', error);
      toast({
        title: "Error",
        description: "Failed to load workout history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week':
        return `Week of ${format(startOfWeek(selectedDate), 'MMM d')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'all':
        return 'All Time';
    }
  };

  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, color = 'text-primary') => (
    <Card className="gym-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={color}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workout History</h1>
          <p className="text-muted-foreground">Track your fitness progress and activity</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            Week
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            Month
          </Button>
          <Button
            variant={selectedPeriod === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      {selectedPeriod !== 'all' && (
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{getPeriodLabel()}</h2>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStatCard(
          "Total Check-ins",
          stats.totalCheckIns,
          <Activity className="h-8 w-8" />,
          "text-success"
        )}
        
        {renderStatCard(
          "Classes Attended", 
          stats.totalClassesAttended,
          <Users className="h-8 w-8" />,
          "text-primary"
        )}
        
        {renderStatCard(
          "Workout Hours",
          `${stats.totalWorkoutHours}h`,
          <Clock className="h-8 w-8" />,
          "text-warning"
        )}
        
        {selectedPeriod === 'all' ? 
          renderStatCard(
            "Current Streak",
            `${stats.currentStreak} days`,
            <Trophy className="h-8 w-8" />,
            "text-secondary"
          ) :
          renderStatCard(
            "This Period",
            stats.totalCheckIns + stats.totalClassesAttended,
            <Target className="h-8 w-8" />,
            "text-secondary"
          )
        }
      </div>

      {/* Activity Tabs */}
      <Tabs defaultValue="checkins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checkins">Gym Check-ins ({checkIns.length})</TabsTrigger>
          <TabsTrigger value="classes">Class Attendance ({classAttendance.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="space-y-4">
          {loading ? (
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : checkIns.length === 0 ? (
            <Card className="gym-card">
              <CardContent className="p-8 text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Check-ins Found</h3>
                <p className="text-muted-foreground">
                  No gym check-ins recorded for {getPeriodLabel().toLowerCase()}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {checkIns.map((checkIn) => (
                <Card key={checkIn.id} className="gym-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-success rounded-full flex items-center justify-center text-white">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Gym Check-in</span>
                            {checkIn.location && (
                              <Badge variant="outline">
                                <MapPin className="h-3 w-3 mr-1" />
                                {checkIn.location.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(checkIn.checked_in_at), 'MMM d, yyyy • h:mm a')}
                            {checkIn.checked_out_at && (
                              <span> - {format(new Date(checkIn.checked_out_at), 'h:mm a')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {checkIn.duration_hours ? (
                        <Badge className="bg-gradient-secondary text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          {checkIn.duration_hours}h workout
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          In progress
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          {loading ? (
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : classAttendance.length === 0 ? (
            <Card className="gym-card">
              <CardContent className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Classes Attended</h3>
                <p className="text-muted-foreground">
                  No class attendance recorded for {getPeriodLabel().toLowerCase()}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {classAttendance.map((attendance) => (
                <Card key={attendance.id} className="gym-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{attendance.class.name}</span>
                            {attendance.class.category && (
                              <Badge 
                                variant="outline"
                                style={{ 
                                  borderColor: attendance.class.category.color,
                                  color: attendance.class.category.color 
                                }}
                              >
                                {attendance.class.category.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(attendance.attended_at), 'MMM d, yyyy • h:mm a')}
                            {attendance.class.instructor && (
                              <span> • {attendance.class.instructor.first_name} {attendance.class.instructor.last_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Badge className="bg-gradient-warning text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        {attendance.class.duration_minutes}min
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* All Time Stats (only show when period is 'all') */}
      {selectedPeriod === 'all' && (
        <div className="grid gap-4 md:grid-cols-2">
          {renderStatCard(
            "Weekly Average",
            `${stats.averageWeeklyVisits} visits`,
            <BarChart3 className="h-8 w-8" />,
            "text-info"
          )}
          
          {renderStatCard(
            "Longest Streak",
            `${stats.longestStreak} days`,
            <TrendingUp className="h-8 w-8" />,
            "text-success"
          )}
        </div>
      )}
    </div>
  );
}