import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, DollarSign, Calendar, Target, BarChart3, PieChart } from 'lucide-react';
import RevenueAnalytics from './RevenueAnalytics';
import MemberAnalytics from './MemberAnalytics';
import ClassAnalytics from './ClassAnalytics';
import MarketingAnalytics from './MarketingAnalytics';
import StaffAnalytics from './StaffAnalytics';
import KPIDashboard from './KPIDashboard';

interface DashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  monthlyRevenue: number;
  membershipGrowth: number;
  churnRate: number;
  avgRevenuePerMember: number;
  classUtilization: number;
  marketingROI: number;
}

export default function AnalyticsDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    membershipGrowth: 0,
    churnRate: 0,
    avgRevenuePerMember: 0,
    classUtilization: 0,
    marketingROI: 0
  });

  useEffect(() => {
    fetchDashboardMetrics();
  }, [profile?.organization_id, timeRange]);

  const fetchDashboardMetrics = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      // Calculate date ranges
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));
      
      // Fetch member metrics
      const { data: members } = await supabase
        .from('profiles')
        .select('id, join_date, created_at')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member');

      const totalMembers = members?.length || 0;
      
      // Active members (with recent check-ins)
      const { data: recentCheckIns } = await supabase
        .from('check_ins')
        .select('member_id')
        .gte('checked_in_at', startDate.toISOString())
        .eq('is_guest', false);
      
      const activeMembers = new Set(recentCheckIns?.map(ci => ci.member_id)).size;

      // Revenue metrics
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('amount, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('payment_status', 'completed');

      const monthlyRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Calculate growth (compare with previous period)
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - parseInt(timeRange));
      
      const { data: prevMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .gte('join_date', prevStartDate.toISOString())
        .lt('join_date', startDate.toISOString());

      const membershipGrowth = totalMembers > 0 && prevMembers ? 
        ((totalMembers - prevMembers.length) / totalMembers) * 100 : 0;

      // Class utilization
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          max_capacity,
          bookings:class_bookings(count)
        `)
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', startDate.toISOString());

      let totalCapacity = 0;
      let totalBookings = 0;
      
      classes?.forEach(cls => {
        totalCapacity += cls.max_capacity;
        totalBookings += cls.bookings?.[0]?.count || 0;
      });
      
      const classUtilization = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0;

      setMetrics({
        totalMembers,
        activeMembers,
        monthlyRevenue,
        membershipGrowth,
        churnRate: 0, // Will be calculated by dedicated function
        avgRevenuePerMember: totalMembers > 0 ? monthlyRevenue / totalMembers : 0,
        classUtilization,
        marketingROI: 0 // Will be calculated by marketing analytics
      });

    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading analytics...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your gym's performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchDashboardMetrics} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.totalMembers}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
                <div className="text-xs text-green-600 mt-1">
                  {metrics.membershipGrowth > 0 && '+'}{metrics.membershipGrowth.toFixed(1)}% growth
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.activeMembers}</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.totalMembers > 0 && `${((metrics.activeMembers / metrics.totalMembers) * 100).toFixed(1)}% of total`}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${metrics.monthlyRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Period Revenue</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${metrics.avgRevenuePerMember.toFixed(0)} per member
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.classUtilization.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Class Utilization</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Capacity usage
                </div>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Analytics
          </CardTitle>
          <CardDescription>
            Comprehensive reports and insights across all business areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <KPIDashboard timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <RevenueAnalytics timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <MemberAnalytics timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="classes" className="space-y-4">
              <ClassAnalytics timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="marketing" className="space-y-4">
              <MarketingAnalytics timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              <StaffAnalytics timeRange={timeRange} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}