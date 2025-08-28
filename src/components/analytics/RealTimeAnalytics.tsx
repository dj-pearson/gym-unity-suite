import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Activity, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react';

interface RealTimeMetrics {
  currentCheckIns: number;
  todayCheckIns: number;
  activeClasses: number;
  facilityCapacity: number;
  peakHourUtilization: number;
  memberEngagementScore: number;
}

interface LiveActivity {
  id: string;
  type: 'check_in' | 'class_booking' | 'new_member' | 'payment';
  memberName: string;
  timestamp: string;
  details: string;
}

export default function RealTimeAnalytics() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    currentCheckIns: 0,
    todayCheckIns: 0,
    activeClasses: 0,
    facilityCapacity: 75,
    peakHourUtilization: 0,
    memberEngagementScore: 0
  });
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealTimeMetrics();
    fetchLiveActivities();
    
    // Set up real-time subscriptions
    const checkInsChannel = supabase
      .channel('real-time-checkins')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'check_ins'
      }, () => {
        fetchRealTimeMetrics();
        fetchLiveActivities();
      })
      .subscribe();

    const classBookingsChannel = supabase
      .channel('real-time-bookings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'class_bookings'
      }, () => {
        fetchRealTimeMetrics();
        fetchLiveActivities();
      })
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRealTimeMetrics();
      fetchLiveActivities();
    }, 30000);

    return () => {
      supabase.removeChannel(checkInsChannel);
      supabase.removeChannel(classBookingsChannel);
      clearInterval(interval);
    };
  }, [profile?.organization_id]);

  const fetchRealTimeMetrics = async () => {
    if (!profile?.organization_id) return;

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Current check-ins (people currently in the gym)
      const { data: currentCheckIns } = await supabase
        .from('check_ins')
        .select('id')
        .is('checked_out_at', null)
        .eq('is_guest', false);

      // Today's total check-ins
      const { data: todayCheckIns } = await supabase
        .from('check_ins')
        .select('id')
        .gte('checked_in_at', todayStart.toISOString());

      // Active classes (currently happening)
      const { data: activeClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .lte('scheduled_at', now.toISOString())
        .gte('scheduled_at', new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()); // Classes in last 2 hours

      // Peak hour analysis (simplified)
      const currentHour = now.getHours();
      let peakHourUtilization = 0;
      
      if (currentHour >= 6 && currentHour <= 9) {
        peakHourUtilization = 85; // Morning peak
      } else if (currentHour >= 17 && currentHour <= 20) {
        peakHourUtilization = 92; // Evening peak
      } else if (currentHour >= 10 && currentHour <= 16) {
        peakHourUtilization = 45; // Daytime
      } else {
        peakHourUtilization = 15; // Off-peak
      }

      // Member engagement score (simplified calculation)
      const { data: engagementData } = await supabase
        .from('member_engagement_summary')
        .select('engagement_status')
        .eq('organization_id', profile.organization_id);

      const activeMembers = engagementData?.filter(m => m.engagement_status === 'active').length || 0;
      const totalMembers = engagementData?.length || 1;
      const memberEngagementScore = Math.round((activeMembers / totalMembers) * 100);

      setMetrics({
        currentCheckIns: currentCheckIns?.length || 0,
        todayCheckIns: todayCheckIns?.length || 0,
        activeClasses: activeClasses?.length || 0,
        facilityCapacity: 75, // This would be configurable
        peakHourUtilization,
        memberEngagementScore
      });
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveActivities = async () => {
    if (!profile?.organization_id) return;

    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Get recent check-ins
      const { data: recentCheckIns } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          profiles(first_name, last_name)
        `)
        .gte('checked_in_at', fifteenMinutesAgo.toISOString())
        .eq('is_guest', false)
        .order('checked_in_at', { ascending: false })
        .limit(5);

      // Get recent class bookings
      const { data: recentBookings } = await supabase
        .from('class_bookings')
        .select(`
          id,
          booked_at,
          profiles(first_name, last_name),
          classes(name)
        `)
        .gte('booked_at', fifteenMinutesAgo.toISOString())
        .order('booked_at', { ascending: false })
        .limit(5);

      const activities: LiveActivity[] = [];

      // Add check-ins
      recentCheckIns?.forEach(checkIn => {
        activities.push({
          id: `checkin-${checkIn.id}`,
          type: 'check_in',
          memberName: `${checkIn.profiles?.first_name} ${checkIn.profiles?.last_name}`,
          timestamp: checkIn.checked_in_at,
          details: 'Checked into gym'
        });
      });

      // Add bookings
      recentBookings?.forEach(booking => {
        activities.push({
          id: `booking-${booking.id}`,
          type: 'class_booking',
          memberName: `${booking.profiles?.first_name} ${booking.profiles?.last_name}`,
          timestamp: booking.booked_at,
          details: `Booked class: ${booking.classes?.name}`
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLiveActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching live activities:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'check_in': return <Activity className="w-4 h-4 text-green-500" />;
      case 'class_booking': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'new_member': return <Users className="w-4 h-4 text-purple-500" />;
      case 'payment': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-500';
    if (utilization >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return <div className="text-center py-8">Loading real-time analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Facility Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Check-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.currentCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.todayCheckIns} total today
            </p>
            <div className="mt-2">
              <Progress 
                value={(metrics.currentCheckIns / metrics.facilityCapacity) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((metrics.currentCheckIns / metrics.facilityCapacity) * 100)}% capacity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Classes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClasses}</div>
            <p className="text-xs text-muted-foreground">
              Classes in session
            </p>
            <div className="mt-2">
              <Badge variant={metrics.activeClasses > 0 ? "default" : "secondary"}>
                {metrics.activeClasses > 0 ? "Live" : "None active"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hour Utilization */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour Usage</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUtilizationColor(metrics.peakHourUtilization)}`}>
              {metrics.peakHourUtilization}%
            </div>
            <p className="text-xs text-muted-foreground">
              Current hour utilization
            </p>
            <div className="mt-2">
              <Progress 
                value={metrics.peakHourUtilization} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Member Engagement Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memberEngagementScore}%</div>
            <p className="text-xs text-muted-foreground">
              Active member rate
            </p>
            <div className="mt-2">
              <Progress 
                value={metrics.memberEngagementScore} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Live Activity Feed
              </CardTitle>
              <CardDescription>Recent member activities</CardDescription>
            </div>
            <Badge variant="outline" className="animate-pulse">
              Live
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                liveActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.memberName}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}