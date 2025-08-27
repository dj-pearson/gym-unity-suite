import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Calendar,
  Download,
  Filter,
  Clock,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  memberGrowth: Array<{ month: string; members: number; growth: number }>;
  revenueData: Array<{ month: string; revenue: number; subscriptions: number }>;
  checkInTrends: Array<{ day: string; checkins: number; hour: number }>;
  membershipBreakdown: Array<{ plan: string; count: number; revenue: number; color: string }>;
  classAttendance: Array<{ class: string; booked: number; attended: number; capacity: number }>;
  peakHours: Array<{ hour: string; checkins: number }>;
}

interface ReportStats {
  totalRevenue: number;
  memberRetention: number;
  avgClassAttendance: number;
  memberSatisfaction: number;
  revenueGrowth: number;
  attendanceGrowth: number;
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    memberGrowth: [],
    revenueData: [],
    checkInTrends: [],
    membershipBreakdown: [],
    classAttendance: [],
    peakHours: []
  });
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    memberRetention: 0,
    avgClassAttendance: 0,
    memberSatisfaction: 0,
    revenueGrowth: 0,
    attendanceGrowth: 0
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [profile?.organization_id]);

  const fetchAnalyticsData = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Generate mock data based on real database structure
      const memberGrowth = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11 + i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          members: Math.floor(Math.random() * 50) + 100 + i * 8,
          growth: Math.floor(Math.random() * 15) + 5
        };
      });

      // Fetch actual membership plans for revenue breakdown
      const { data: membershipPlans } = await supabase
        .from('membership_plans')
        .select('name, price')
        .eq('organization_id', profile.organization_id);

      const membershipBreakdown = (membershipPlans || []).map((plan, i) => ({
        plan: plan.name,
        count: Math.floor(Math.random() * 30) + 10,
        revenue: Number(plan.price) * (Math.floor(Math.random() * 30) + 10),
        color: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][i % 4]
      }));

      // Generate realistic check-in trends
      const checkInTrends = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          checkins: Math.floor(Math.random() * 100) + 50,
          hour: Math.floor(Math.random() * 24)
        };
      });

      // Peak hours analysis (realistic gym usage)
      const peakHours = [
        { hour: '6 AM', checkins: 45 },
        { hour: '7 AM', checkins: 78 },
        { hour: '8 AM', checkins: 92 },
        { hour: '12 PM', checkins: 65 },
        { hour: '1 PM', checkins: 58 },
        { hour: '5 PM', checkins: 95 },
        { hour: '6 PM', checkins: 115 },
        { hour: '7 PM', checkins: 88 },
        { hour: '8 PM', checkins: 62 }
      ];

      const revenueData = memberGrowth.map((item, i) => ({
        month: item.month,
        revenue: Math.floor(Math.random() * 50000) + 30000,
        subscriptions: Math.floor(Math.random() * 20) + 10
      }));

      const classAttendance = [
        { class: 'Morning Yoga', booked: 25, attended: 22, capacity: 30 },
        { class: 'HIIT Training', booked: 20, attended: 18, capacity: 25 },
        { class: 'Pilates', booked: 15, attended: 14, capacity: 20 },
        { class: 'Strength Training', booked: 18, attended: 16, capacity: 22 },
        { class: 'Cardio Blast', booked: 22, attended: 20, capacity: 25 }
      ];

      setAnalytics({
        memberGrowth,
        revenueData,
        checkInTrends,
        membershipBreakdown,
        classAttendance,
        peakHours
      });

      // Calculate stats
      const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
      const avgAttendanceRate = classAttendance.reduce((sum, cls) => sum + (cls.attended / cls.booked), 0) / classAttendance.length;

      setStats({
        totalRevenue,
        memberRetention: 87,
        avgClassAttendance: Math.round(avgAttendanceRate * 100),
        memberSatisfaction: 4.6,
        revenueGrowth: 15,
        attendanceGrowth: 8
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    members: { label: "Members", color: "#8B5CF6" },
    revenue: { label: "Revenue", color: "#06B6D4" },
    checkins: { label: "Check-ins", color: "#10B981" },
    booked: { label: "Booked", color: "#8B5CF6" },
    attended: { label: "Attended", color: "#10B981" }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your gym's performance
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Member Retention"
          value={`${stats.memberRetention}%`}
          change={{ value: "3%", type: "positive" }}
          icon={Users}
          gradient="success"
        />
        <StatCard
          title="Class Attendance"
          value={`${stats.avgClassAttendance}%`}
          change={{ value: `${stats.attendanceGrowth}%`, type: "positive" }}
          icon={Calendar}
          gradient="primary"
        />
        <StatCard
          title="Revenue Growth"
          value={`${stats.revenueGrowth}%`}
          change={{ value: "2%", type: "positive" }}
          icon={TrendingUp}
          gradient="secondary"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(0)}K`}
          change={{ value: "12%", type: "positive" }}
          icon={DollarSign}
          gradient="warning"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth Chart */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Member Growth Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart data={analytics.memberGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                />
                <Line 
                  type="monotone" 
                  dataKey="members" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Analytics */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Revenue Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart data={analytics.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#06B6D4"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Class Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart data={analytics.classAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="booked" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="attended" fill="#10B981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="flex justify-center mt-4 space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
                <span>Attended</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Usage Hours */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Peak Usage Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart data={analytics.peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="checkins" 
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Membership Breakdown & Check-in Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Plan Distribution */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Membership Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.membershipBreakdown.length > 0 ? (
              <>
                <ChartContainer config={chartConfig}>
                  <PieChart>
                    <Pie
                      data={analytics.membershipBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                    >
                      {analytics.membershipBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} members`,
                        props.payload.plan
                      ]}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {analytics.membershipBreakdown.map((plan, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: plan.color }}
                        ></div>
                        <span className="truncate">{plan.plan}</span>
                      </div>
                      <span className="font-medium">{plan.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p>No membership plans found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Check-in Trends */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="mr-2 h-5 w-5" />
              Weekly Check-in Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart data={analytics.checkInTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="checkins" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}