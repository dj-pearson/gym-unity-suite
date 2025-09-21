import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, TrendingUp, DollarSign, Activity, Clock, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface LocationAnalytics {
  id: string;
  location_id: string;
  analytics_date: string;
  total_members: number;
  active_members: number;
  new_members: number;
  cancelled_members: number;
  daily_checkins: number;
  peak_hour_checkins: number;
  revenue_total: number;
  revenue_memberships: number;
  revenue_classes: number;
  revenue_personal_training: number;
  revenue_retail: number;
  classes_held: number;
  equipment_maintenance_requests: number;
  staff_hours_worked: number;
  location: { name: string; location_code: string };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function LocationAnalyticsDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('30');

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, location_code')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['location-analytics', selectedLocation, timeRange],
    queryFn: async () => {
      let query = supabase
        .from('location_analytics')
        .select(`
          *,
          location:locations!location_analytics_location_id_fkey(name, location_code)
        `)
        .gte('analytics_date', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('analytics_date', { ascending: true });

      if (selectedLocation !== 'all') {
        query = query.eq('location_id', selectedLocation);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LocationAnalytics[];
    },
  });

  const getMetricTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const aggregatedStats = analytics?.reduce((acc, curr) => {
    acc.totalMembers += curr.total_members || 0;
    acc.activeMembers += curr.active_members || 0;
    acc.newMembers += curr.new_members || 0;
    acc.totalRevenue += curr.revenue_total || 0;
    acc.totalCheckins += curr.daily_checkins || 0;
    acc.classesHeld += curr.classes_held || 0;
    acc.staffHours += curr.staff_hours_worked || 0;
    acc.maintenanceRequests += curr.equipment_maintenance_requests || 0;
    return acc;
  }, {
    totalMembers: 0,
    activeMembers: 0,
    newMembers: 0,
    totalRevenue: 0,
    totalCheckins: 0,
    classesHeld: 0,
    staffHours: 0,
    maintenanceRequests: 0
  });

  const revenueBreakdown = analytics?.reduce((acc, curr) => {
    acc.memberships += curr.revenue_memberships || 0;
    acc.classes += curr.revenue_classes || 0;
    acc.personalTraining += curr.revenue_personal_training || 0;
    acc.retail += curr.revenue_retail || 0;
    return acc;
  }, { memberships: 0, classes: 0, personalTraining: 0, retail: 0 });

  const revenueBreakdownData = [
    { name: 'Memberships', value: revenueBreakdown?.memberships || 0, color: COLORS[0] },
    { name: 'Classes', value: revenueBreakdown?.classes || 0, color: COLORS[1] },
    { name: 'Personal Training', value: revenueBreakdown?.personalTraining || 0, color: COLORS[2] },
    { name: 'Retail', value: revenueBreakdown?.retail || 0, color: COLORS[3] }
  ].filter(item => item.value > 0);

  const dailyTrends = analytics?.map(item => ({
    date: new Date(item.analytics_date).toLocaleDateString(),
    members: item.total_members,
    checkins: item.daily_checkins,
    revenue: item.revenue_total,
    classes: item.classes_held
  })) || [];

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Location Analytics</h2>
          <p className="text-muted-foreground">Performance insights across all locations</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations?.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} {location.location_code && `(${location.location_code})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats?.totalMembers.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span>{aggregatedStats?.newMembers} new this period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${aggregatedStats?.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              Across {parseInt(timeRange)} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats?.totalCheckins.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              Daily average: {Math.round((aggregatedStats?.totalCheckins || 0) / parseInt(timeRange))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Classes Held</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats?.classesHeld}</div>
            <div className="text-sm text-muted-foreground">
              {aggregatedStats?.staffHours.toFixed(1)} staff hours
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Trends</CardTitle>
            <CardDescription>Check-ins and revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="checkins" 
                  stroke="#8884d8" 
                  name="Check-ins" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#82ca9d" 
                  name="Revenue ($)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {revenueBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Member Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Member Activity Trends</CardTitle>
          <CardDescription>Member engagement and growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="members" fill="#8884d8" name="Total Members" />
              <Bar dataKey="classes" fill="#82ca9d" name="Classes Held" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Location Performance Summary */}
      {selectedLocation === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>Location Performance Summary</CardTitle>
            <CardDescription>Comparative performance across all locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locations?.map((location) => {
                const locationData = analytics?.filter(a => a.location_id === location.id) || [];
                const locationStats = locationData.reduce((acc, curr) => {
                  acc.totalRevenue += curr.revenue_total || 0;
                  acc.totalCheckins += curr.daily_checkins || 0;
                  acc.totalMembers = Math.max(acc.totalMembers, curr.total_members || 0);
                  acc.avgUtilization += ((curr.daily_checkins || 0) / (curr.total_members || 1)) * 100;
                  return acc;
                }, { totalRevenue: 0, totalCheckins: 0, totalMembers: 0, avgUtilization: 0 });
                
                locationStats.avgUtilization = locationStats.avgUtilization / locationData.length;

                return (
                  <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {location.location_code}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-8">
                      <div className="text-center">
                        <div className="font-semibold">{locationStats.totalMembers}</div>
                        <div className="text-xs text-muted-foreground">Members</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{locationStats.totalCheckins}</div>
                        <div className="text-xs text-muted-foreground">Check-ins</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">${locationStats.totalRevenue.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{locationStats.avgUtilization.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Utilization</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}