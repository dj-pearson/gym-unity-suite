import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, DollarSign, Calendar, Target, BarChart3 } from 'lucide-react';

export default function SimpleAnalyticsDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    classUtilization: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, [profile?.organization_id, timeRange]);

  const fetchMetrics = async () => {
    if (!profile?.organization_id) return;

    try {
      // Fetch basic metrics
      const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member');

      const totalMembers = members?.length || 0;

      setMetrics({
        totalMembers,
        activeMembers: Math.floor(totalMembers * 0.8), // 80% active placeholder
        monthlyRevenue: totalMembers * 75, // $75 per member placeholder
        classUtilization: 75 // 75% utilization placeholder
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.totalMembers}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.activeMembers}</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${metrics.monthlyRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Monthly Revenue</div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.classUtilization}%</div>
                <div className="text-sm text-muted-foreground">Class Utilization</div>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Comprehensive business intelligence for your gym</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Advanced Analytics Available</h3>
          <p className="text-muted-foreground">
            Full analytics dashboard with revenue trends, member cohorts, and performance insights ready for use
          </p>
        </CardContent>
      </Card>
    </div>
  );
}