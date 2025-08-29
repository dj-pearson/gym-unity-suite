import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Calendar, 
  Target, 
  Trophy,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MemberActivitySummaryProps {
  memberId: string;
}

export function MemberActivitySummary({ memberId }: MemberActivitySummaryProps) {
  const [activityData, setActivityData] = useState<any>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setIsLoading(true);

        // Fetch check-ins for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: checkIns, error: checkInError } = await supabase
          .from('check_ins')
          .select('*')
          .eq('member_id', memberId)
          .gte('checked_in_at', thirtyDaysAgo.toISOString())
          .order('checked_in_at', { ascending: false });

        if (checkInError) throw checkInError;

        // Fetch loyalty points
        const { data: points, error: pointsError } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (pointsError) throw pointsError;

        // Fetch upcoming class bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from('class_bookings')
          .select(`
            *,
            classes (
              name,
              scheduled_at,
              duration_minutes,
              locations (name)
            )
          `)
          .eq('member_id', memberId)
          .eq('status', 'booked')
          .gte('classes.scheduled_at', new Date().toISOString())
          .order('classes.scheduled_at', { ascending: true })
          .limit(5);

        if (bookingsError) throw bookingsError;

        // Fetch fitness assessment
        const { data: assessment, error: assessmentError } = await supabase
          .from('fitness_assessments')
          .select('*')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (assessmentError) throw assessmentError;

        setActivityData({
          checkIns: checkIns || [],
          assessment: assessment?.[0] || null,
        });
        setLoyaltyPoints(points?.[0] || null);
        setUpcomingClasses(bookings || []);
      } catch (error: any) {
        toast({
          title: 'Error loading activity data',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, [memberId, toast]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const checkInsThisMonth = activityData?.checkIns?.length || 0;
  const currentPoints = loyaltyPoints?.current_balance || 0;
  const weeklyGoal = 3; // visits per week
  const weeklyProgress = Math.min((checkInsThisMonth / 4) / weeklyGoal * 100, 100);

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{checkInsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {checkInsThisMonth > 10 ? 'Great consistency!' : 'Keep it up!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentPoints}</div>
            <p className="text-xs text-muted-foreground">
              Available to redeem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{Math.round(weeklyProgress)}%</div>
            <Progress value={weeklyProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {weeklyGoal} visits per week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{upcomingClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Classes booked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fitness Goals */}
      {activityData?.assessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Fitness Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activityData.assessment.fitness_goals?.map((goal: string, index: number) => (
                <Badge key={index} variant="outline">
                  {goal}
                </Badge>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Experience Level:</span>
                <Badge variant="secondary" className="capitalize">
                  {activityData.assessment.experience_level}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Preferred Frequency:</span>
                <span className="font-medium">{activityData.assessment.workout_frequency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingClasses.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <h4 className="font-medium">{booking.classes.name}</h4>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(booking.classes.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    {booking.classes.locations?.name && (
                      <div className="text-xs text-muted-foreground mt-1">
                        📍 {booking.classes.locations.name}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">Booked</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activityData?.checkIns?.slice(0, 5).map((checkIn: any, index: number) => (
              <div key={checkIn.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Gym Visit</span>
                  {checkIn.is_guest && (
                    <Badge variant="secondary" className="text-xs">Guest</Badge>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {new Date(checkIn.checked_in_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            ))}
            {(!activityData?.checkIns || activityData.checkIns.length === 0) && (
              <p className="text-muted-foreground text-center py-4">
                No recent activity. Start your fitness journey today!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}