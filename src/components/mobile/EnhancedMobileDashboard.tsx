import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Calendar,
  Target,
  Activity,
  Clock,
  MapPin,
  Zap,
  TrendingUp,
  Bell,
  Settings,
  QrCode,
  CreditCard,
  Users
} from 'lucide-react';

interface MobileDashboardStats {
  todayCheckIns: number;
  weeklyClasses: number;
  monthlyGoal: number;
  monthlyProgress: number;
  nextClass: {
    name: string;
    time: string;
    instructor: string;
  } | null;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

export default function EnhancedMobileDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MobileDashboardStats>({
    todayCheckIns: 0,
    weeklyClasses: 0,
    monthlyGoal: 12,
    monthlyProgress: 8,
    nextClass: null,
    recentActivity: []
  });

  useEffect(() => {
    fetchDashboardStats();
  }, [profile?.id]);

  const fetchDashboardStats = async () => {
    if (!profile?.id) return;

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Fetch today's check-ins
      const { data: todayCheckIns } = await supabase
        .from('check_ins')
        .select('*')
        .eq('member_id', profile.id)
        .gte('checked_in_at', startOfDay.toISOString());

      // Fetch weekly classes
      const { data: weeklyBookings } = await supabase
        .from('class_bookings')
        .select('*, classes(*)')
        .eq('member_id', profile.id)
        .gte('booked_at', startOfWeek.toISOString())
        .eq('status', 'booked');

      // Fetch next class
      const { data: upcomingClasses } = await supabase
        .from('class_bookings')
        .select(`
          *,
          classes (
            name,
            scheduled_at,
            profiles!classes_instructor_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('member_id', profile.id)
        .eq('status', 'booked')
        .gte('classes.scheduled_at', new Date().toISOString())
        .order('classes.scheduled_at', { ascending: true })
        .limit(1);

      // Mock recent activity - in real app would fetch from multiple tables
      const recentActivity = [
        {
          type: 'checkin',
          description: 'Checked in to Main Gym',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          type: 'class',
          description: 'Completed HIIT Training',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          type: 'booking',
          description: 'Booked Yoga Flow class',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ];

      const nextClass = upcomingClasses?.[0]?.classes ? {
        name: upcomingClasses[0].classes.name,
        time: new Date(upcomingClasses[0].classes.scheduled_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        instructor: upcomingClasses[0].classes.profiles
          ? `${upcomingClasses[0].classes.profiles.first_name} ${upcomingClasses[0].classes.profiles.last_name}`
          : 'TBA'
      } : null;

      setStats({
        todayCheckIns: todayCheckIns?.length || 0,
        weeklyClasses: weeklyBookings?.length || 0,
        monthlyGoal: 12,
        monthlyProgress: weeklyBookings?.length || 0,
        nextClass,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckIn = () => {
    // Would implement QR code scanner or location-based check-in
    window.location.href = '/mobile/check-in';
  };

  const progressPercentage = (stats.monthlyProgress / stats.monthlyGoal) * 100;

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="h-32 bg-gradient-primary rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-primary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {profile?.first_name}!
            </h1>
            <p className="text-white/80">
              Ready for another great workout?
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-full">
            <User className="h-6 w-6" />
          </div>
        </div>
        
        <Button 
          onClick={handleQuickCheckIn}
          className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
        >
          <QrCode className="h-4 w-4 mr-2" />
          Quick Check-In
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-success/10 rounded-full w-fit mx-auto mb-2">
              <MapPin className="h-5 w-5 text-success" />
            </div>
            <div className="text-2xl font-bold text-success">{stats.todayCheckIns}</div>
            <div className="text-xs text-muted-foreground">Check-ins Today</div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{stats.weeklyClasses}</div>
            <div className="text-xs text-muted-foreground">Classes This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress */}
      <Card className="gym-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-secondary" />
            Monthly Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{stats.monthlyProgress} classes completed</span>
              <span className="text-muted-foreground">{stats.monthlyGoal} goal</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}% complete</span>
              <span>{stats.monthlyGoal - stats.monthlyProgress} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Class */}
      {stats.nextClass && (
        <Card className="gym-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-warning" />
              Next Class
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{stats.nextClass.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.nextClass.time} • {stats.nextClass.instructor}
                </p>
              </div>
              <Badge variant="outline">Today</Badge>
            </div>
            <Button variant="outline" className="w-full mt-3" size="sm">
              View Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="gym-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Book Class</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Users className="h-4 w-4" />
              <span className="text-xs">Find Friends</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs">Payments</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="gym-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  {activity.type === 'checkin' && <MapPin className="h-3 w-3" />}
                  {activity.type === 'class' && <Calendar className="h-3 w-3" />}
                  {activity.type === 'booking' && <Clock className="h-3 w-3" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp.toLocaleDateString()} at{' '}
                    {activity.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}