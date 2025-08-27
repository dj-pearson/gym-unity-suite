import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Activity, 
  Users, 
  MapPin,
  Star,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  upcomingClasses: number;
  totalCheckIns: number;
  loyaltyPoints: number;
  waitlistPosition?: number;
}

interface UpcomingClass {
  id: string;
  name: string;
  scheduled_at: string;
  location?: {
    name: string;
  };
  booking_status?: 'booked' | 'waitlisted';
  waitlist_position?: number;
}

interface RecentActivity {
  id: string;
  type: 'check_in' | 'class_booking' | 'loyalty_earned';
  description: string;
  created_at: string;
  points?: number;
}

export default function MemberDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    upcomingClasses: 0,
    totalCheckIns: 0,
    loyaltyPoints: 0
  });
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchMemberDashboardData();
    }
  }, [profile?.id]);

  const fetchMemberDashboardData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Fetch upcoming booked classes
      const { data: bookedClasses } = await supabase
        .from('class_bookings')
        .select(`
          id,
          class:classes (
            id,
            name,
            scheduled_at,
            location:locations (
              name
            )
          )
        `)
        .eq('member_id', profile.id)
        .eq('status', 'booked')
        .gte('class.scheduled_at', new Date().toISOString())
        .order('class.scheduled_at', { ascending: true })
        .limit(5);

      // Fetch waitlisted classes with position
      const { data: waitlistedClasses } = await supabase
        .from('class_waitlists')
        .select(`
          id,
          priority_order,
          class:classes (
            id,
            name,
            scheduled_at,
            location:locations (
              name
            )
          )
        `)
        .eq('member_id', profile.id)
        .eq('status', 'waiting')
        .gte('class.scheduled_at', new Date().toISOString())
        .order('class.scheduled_at', { ascending: true })
        .limit(3);

      // Fetch total check-ins
      const { count: checkInsCount } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', profile.id)
        .eq('is_guest', false);

      // Fetch loyalty points balance
      const { data: loyaltyData } = await supabase
        .from('loyalty_points')
        .select('current_balance')
        .eq('member_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch recent activities
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('id, checked_in_at')
        .eq('member_id', profile.id)
        .eq('is_guest', false)
        .order('checked_in_at', { ascending: false })
        .limit(5);

      const { data: recentBookings } = await supabase
        .from('class_bookings')
        .select(`
          id,
          booked_at,
          class:classes (name)
        `)
        .eq('member_id', profile.id)
        .order('booked_at', { ascending: false })
        .limit(3);

      const { data: recentPoints } = await supabase
        .from('loyalty_points')
        .select('id, points_earned, reason, created_at')
        .eq('member_id', profile.id)
        .gt('points_earned', 0)
        .order('created_at', { ascending: false })
        .limit(3);

      // Combine upcoming classes with null checks
      const combinedClasses: UpcomingClass[] = [
        ...(bookedClasses?.filter(bc => bc.class).map(bc => ({
          id: bc.class.id,
          name: bc.class.name,
          scheduled_at: bc.class.scheduled_at,
          location: bc.class.location,
          booking_status: 'booked' as const
        })) || []),
        ...(waitlistedClasses?.filter(wc => wc.class).map(wc => ({
          id: wc.class.id,
          name: wc.class.name,
          scheduled_at: wc.class.scheduled_at,
          location: wc.class.location,
          booking_status: 'waitlisted' as const,
          waitlist_position: wc.priority_order
        })) || [])
      ].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

      // Combine recent activities
      const activities: RecentActivity[] = [
        ...(checkIns?.map(ci => ({
          id: `checkin-${ci.id}`,
          type: 'check_in' as const,
          description: 'Checked into gym',
          created_at: ci.checked_in_at
        })) || []),
        ...(recentBookings?.map(rb => ({
          id: `booking-${rb.id}`,
          type: 'class_booking' as const,
          description: `Booked class: ${rb.class?.name || 'Unknown Class'}`,
          created_at: rb.booked_at
        })) || []),
        ...(recentPoints?.map(rp => ({
          id: `points-${rp.id}`,
          type: 'loyalty_earned' as const,
          description: rp.reason,
          created_at: rp.created_at,
          points: rp.points_earned
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 8);

      setStats({
        upcomingClasses: combinedClasses.length,
        totalCheckIns: checkInsCount || 0,
        loyaltyPoints: loyaltyData?.current_balance || 0
      });
      
      setUpcomingClasses(combinedClasses);
      setRecentActivities(activities);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'check_in': return <MapPin className="h-4 w-4" />;
      case 'class_booking': return <Calendar className="h-4 w-4" />;
      case 'loyalty_earned': return <Star className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'check_in': return 'bg-gradient-success';
      case 'class_booking': return 'bg-gradient-primary';
      case 'loyalty_earned': return 'bg-gradient-secondary';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {profile?.first_name || 'Member'}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your fitness journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Classes</p>
                <p className="text-2xl font-bold text-primary">{stats.upcomingClasses}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Check-ins</p>
                <p className="text-2xl font-bold text-success">{stats.totalCheckIns}</p>
              </div>
              <Activity className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Loyalty Points</p>
                <p className="text-2xl font-bold text-warning">{stats.loyaltyPoints}</p>
              </div>
              <Trophy className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-secondary">Active</p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Classes */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 opacity-50 mb-3" />
                <p className="text-sm">No upcoming classes</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Browse Classes
                </Button>
              </div>
            ) : (
              upcomingClasses.map((classItem) => (
                <div key={`${classItem.id}-${classItem.booking_status}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{classItem.name}</h4>
                      <Badge 
                        variant={classItem.booking_status === 'booked' ? 'default' : 'secondary'}
                        className={classItem.booking_status === 'booked' 
                          ? 'bg-gradient-success text-white' 
                          : 'bg-gradient-warning text-white'
                        }
                      >
                        {classItem.booking_status === 'booked' ? 'Booked' : `Waitlist #${classItem.waitlist_position}`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(classItem.scheduled_at), 'MMM d, h:mm a')}
                      </div>
                      {classItem.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {classItem.location.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 opacity-50 mb-3" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {activity.points && (
                    <Badge variant="outline" className="text-warning border-warning">
                      +{activity.points} pts
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}