import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  UserCheck,
  Clock,
  Activity,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  todayCheckins: number;
  monthlyRevenue: number;
  upcomingClasses: number;
  memberGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'checkin' | 'new_member' | 'class_booking' | 'lead_created';
  description: string;
  timestamp: string;
  member_name?: string;
}

export default function Dashboard() {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    todayCheckins: 0,
    monthlyRevenue: 0,
    upcomingClasses: 0,
    memberGrowth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchDashboardStats();
      fetchRecentActivity();
    }
  }, [profile?.organization_id]);

  const fetchDashboardStats = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Fetch total members
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member');

      // Fetch active members (simplified for now)
      const { count: activeMembers } = await supabase
        .from('memberships')
        .select('member_id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch today's check-ins
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCheckins } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .gte('checked_in_at', `${today}T00:00:00`)
        .lt('checked_in_at', `${today}T23:59:59`);

      // Fetch upcoming classes (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { count: upcomingClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', new Date().toISOString())
        .lt('scheduled_at', nextWeek.toISOString());

      // Calculate monthly revenue from membership plans
      const { data: membershipData } = await supabase
        .from('memberships')
        .select(`
          member_id,
          membership_plans (price)
        `)
        .eq('status', 'active');

      const monthlyRevenue = membershipData?.reduce((sum, membership) => {
        return sum + (Number(membership.membership_plans?.price) || 0);
      }, 0) || 0;

      // Calculate member growth (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { count: recentMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: previousMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const memberGrowth = previousMembers > 0 
        ? Math.round(((recentMembers - previousMembers) / previousMembers) * 100)
        : recentMembers > 0 ? 100 : 0;

      setStats({
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        todayCheckins: todayCheckins || 0,
        monthlyRevenue,
        upcomingClasses: upcomingClasses || 0,
        memberGrowth,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (!profile?.organization_id) return;

    try {
      const activities: RecentActivity[] = [];

      // Fetch recent check-ins
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          member_id,
          profiles:member_id (first_name, last_name, email)
        `)
        .order('checked_in_at', { ascending: false })
        .limit(5);

      checkIns?.forEach((checkIn: any) => {
        const memberName = checkIn.profiles?.first_name && checkIn.profiles?.last_name
          ? `${checkIn.profiles.first_name} ${checkIn.profiles.last_name}`
          : checkIn.profiles?.email || 'Member';
        
        activities.push({
          id: `checkin-${checkIn.id}`,
          type: 'checkin',
          description: `${memberName} checked in`,
          timestamp: checkIn.checked_in_at,
          member_name: memberName
        });
      });

      // Fetch recent new members
      const { data: newMembers } = await supabase
        .from('profiles')
        .select('id, created_at, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .order('created_at', { ascending: false })
        .limit(3);

      newMembers?.forEach((member: any) => {
        const memberName = member.first_name && member.last_name
          ? `${member.first_name} ${member.last_name}`
          : member.email;
        
        activities.push({
          id: `member-${member.id}`,
          type: 'new_member',
          description: `${memberName} joined the gym`,
          timestamp: member.created_at,
          member_name: memberName
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const quickActions = [
    {
      title: 'Add New Member',
      description: 'Register a new gym member',
      icon: Users,
      action: () => navigate('/members/new'),
      gradient: 'primary' as const,
    },
    {
      title: 'Schedule Class',
      description: 'Create a new class session',
      icon: Calendar,
      action: () => navigate('/classes/new'),
      gradient: 'secondary' as const,
    },
    {
      title: 'Member Check-in',
      description: 'Check in a member quickly',
      icon: UserCheck,
      action: () => navigate('/checkins'),
      gradient: 'success' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name || 'User'}! Here's what's happening at {organization?.name || 'your gym'}.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          change={{ value: `${stats.memberGrowth}%`, type: 'positive' }}
          icon={Users}
          gradient="primary"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          icon={Activity}
          gradient="success"
        />
        <StatCard
          title="Today's Check-ins"
          value={stats.todayCheckins}
          icon={UserCheck}
          gradient="secondary"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          gradient="warning"
        />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-4 transition-smooth hover:shadow-elevation-2"
                onClick={action.action}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br mr-4 ${
                  action.gradient === 'primary' ? 'from-primary to-primary-glow' :
                  action.gradient === 'secondary' ? 'from-secondary to-secondary-glow' :
                  'from-success to-green-400'
                }`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'checkin' ? 'bg-green-100 text-green-600' :
                      activity.type === 'new_member' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'class_booking' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {activity.type === 'checkin' && <UserCheck className="h-4 w-4" />}
                      {activity.type === 'new_member' && <Users className="h-4 w-4" />}
                      {activity.type === 'class_booking' && <Calendar className="h-4 w-4" />}
                      {activity.type === 'lead_created' && <Plus className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-12 w-12 opacity-50 mb-4" />
                  <p>No recent activity to display</p>
                  <p className="text-sm">Member activities will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Member Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="mx-auto h-12 w-12 opacity-50 mb-4" />
              <p>Growth analytics will appear here</p>
              <p className="text-sm">Track member acquisition over time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="mx-auto h-12 w-12 opacity-50 mb-4" />
              <p>Revenue analytics will appear here</p>
              <p className="text-sm">Track monthly and yearly revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}