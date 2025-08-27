import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, Users, DollarSign, Calendar, Activity, Award } from 'lucide-react';

interface KPIDashboardProps {
  timeRange: string;
}

interface KPI {
  name: string;
  value: number;
  target: number;
  unit: string;
  category: string;
  trend: number;
  icon: React.ReactNode;
  color: string;
}

export default function KPIDashboard({ timeRange }: KPIDashboardProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);

  useEffect(() => {
    fetchKPIs();
  }, [profile?.organization_id, timeRange]);

  const fetchKPIs = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Calculate various KPIs
      
      // 1. Member Growth Rate
      const { data: currentMembers } = await supabase
        .from('profiles')
        .select('id, join_date')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member');

      const newMembers = currentMembers?.filter(m => 
        new Date(m.join_date || '1970-01-01') >= startDate
      ).length || 0;
      
      const totalMembers = currentMembers?.length || 0;
      const memberGrowthRate = totalMembers > 0 ? (newMembers / totalMembers) * 100 : 0;

      // 2. Revenue Growth
      const { data: currentRevenue } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('payment_status', 'completed')
        .gte('created_at', startDate.toISOString());

      const revenue = currentRevenue?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // 3. Class Utilization
      const { data: classes } = await supabase
        .from('classes')
        .select(`
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

      // 4. Member Retention (simplified)
      const retentionRate = 85; // Placeholder - would need more complex calculation

      // 5. Average Revenue Per Member
      const arpm = totalMembers > 0 ? revenue / totalMembers : 0;

      // 6. Lead Conversion Rate
      const { data: leads } = await supabase
        .from('leads')
        .select('status')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString());

      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // 7. Member Engagement (check-ins per member)
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('member_id')
        .eq('is_guest', false)
        .gte('checked_in_at', startDate.toISOString());

      const uniqueMembers = new Set(checkIns?.map(ci => ci.member_id)).size;
      const avgCheckInsPerMember = uniqueMembers > 0 ? (checkIns?.length || 0) / uniqueMembers : 0;

      // 8. Staff Productivity (classes taught per staff)
      const { data: staffClasses } = await supabase
        .from('classes')
        .select('instructor_id')
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', startDate.toISOString())
        .not('instructor_id', 'is', null);

      const { data: instructors } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .in('role', ['trainer', 'staff']);

      const avgClassesPerInstructor = (instructors?.length || 0) > 0 
        ? (staffClasses?.length || 0) / instructors.length 
        : 0;

      const kpiData: KPI[] = [
        {
          name: 'Member Growth Rate',
          value: memberGrowthRate,
          target: 5,
          unit: '%',
          category: 'membership',
          trend: 2.3,
          icon: <Users className="h-5 w-5" />,
          color: 'text-blue-500'
        },
        {
          name: 'Monthly Revenue',
          value: revenue,
          target: 50000,
          unit: '$',
          category: 'financial',
          trend: 8.5,
          icon: <DollarSign className="h-5 w-5" />,
          color: 'text-green-500'
        },
        {
          name: 'Class Utilization',
          value: classUtilization,
          target: 80,
          unit: '%',
          category: 'operational',
          trend: -1.2,
          icon: <Calendar className="h-5 w-5" />,
          color: 'text-purple-500'
        },
        {
          name: 'Member Retention',
          value: retentionRate,
          target: 90,
          unit: '%',
          category: 'membership',
          trend: 1.8,
          icon: <Target className="h-5 w-5" />,
          color: 'text-orange-500'
        },
        {
          name: 'Revenue Per Member',
          value: arpm,
          target: 150,
          unit: '$',
          category: 'financial',
          trend: 4.2,
          icon: <DollarSign className="h-5 w-5" />,
          color: 'text-green-600'
        },
        {
          name: 'Lead Conversion Rate',
          value: conversionRate,
          target: 25,
          unit: '%',
          category: 'marketing',
          trend: 3.1,
          icon: <TrendingUp className="h-5 w-5" />,
          color: 'text-blue-600'
        },
        {
          name: 'Member Engagement',
          value: avgCheckInsPerMember,
          target: 8,
          unit: 'visits',
          category: 'engagement',
          trend: -0.5,
          icon: <Activity className="h-5 w-5" />,
          color: 'text-purple-600'
        },
        {
          name: 'Staff Productivity',
          value: avgClassesPerInstructor,
          target: 15,
          unit: 'classes',
          category: 'operational',
          trend: 2.8,
          icon: <Award className="h-5 w-5" />,
          color: 'text-orange-600'
        }
      ];

      setKpis(kpiData);

    } catch (error: any) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading KPIs...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Key Performance Indicators</h3>
        <p className="text-muted-foreground mb-6">
          Track your gym's most important metrics and their progress toward targets
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const progressPercentage = kpi.target > 0 ? Math.min((kpi.value / kpi.target) * 100, 100) : 0;
          const isOnTarget = progressPercentage >= 80;
          const isAboveTarget = progressPercentage >= 100;
          
          return (
            <Card key={index} className="hover-scale">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    kpi.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.trend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(kpi.trend).toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {kpi.name}
                    </span>
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">
                      {kpi.unit === '$' && kpi.unit}
                      {kpi.unit === '$' ? kpi.value.toLocaleString() : kpi.value.toFixed(1)}
                      {kpi.unit !== '$' && kpi.unit}
                    </span>
                    <span className="text-sm text-muted-foreground mb-1">
                      / {kpi.unit === '$' && kpi.unit}
                      {kpi.unit === '$' ? kpi.target.toLocaleString() : kpi.target}
                      {kpi.unit !== '$' && kpi.unit}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={progressPercentage} 
                      className={`h-2 ${
                        isAboveTarget ? 'bg-green-100' : 
                        isOnTarget ? 'bg-blue-100' : 'bg-red-100'
                      }`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className={
                        isAboveTarget ? 'text-green-600 font-medium' :
                        isOnTarget ? 'text-blue-600 font-medium' : 'text-red-600'
                      }>
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* KPI Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
            <CardDescription>
              Overview of KPIs by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['financial', 'membership', 'operational', 'marketing'].map(category => {
                const categoryKPIs = kpis.filter(kpi => kpi.category === category);
                const avgProgress = categoryKPIs.length > 0 
                  ? categoryKPIs.reduce((sum, kpi) => 
                      sum + Math.min((kpi.value / kpi.target) * 100, 100), 0) / categoryKPIs.length
                  : 0;
                
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium capitalize">{category}</h4>
                      <p className="text-sm text-muted-foreground">
                        {categoryKPIs.length} metrics
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        avgProgress >= 80 ? 'text-green-600' : 
                        avgProgress >= 60 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {avgProgress.toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">avg</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alerts & Recommendations</CardTitle>
            <CardDescription>
              Areas that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis
                .filter(kpi => (kpi.value / kpi.target) * 100 < 70)
                .slice(0, 3)
                .map((kpi, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="p-1 bg-yellow-200 rounded text-yellow-800">
                      <Target className="h-3 w-3" />
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">{kpi.name} Below Target</h5>
                      <p className="text-xs text-muted-foreground">
                        Currently at {((kpi.value / kpi.target) * 100).toFixed(0)}% of target
                      </p>
                    </div>
                  </div>
                ))}
              
              {kpis.filter(kpi => (kpi.value / kpi.target) * 100 >= 70).length === kpis.length && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="p-1 bg-green-200 rounded text-green-800">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">All KPIs on Track</h5>
                    <p className="text-xs text-muted-foreground">
                      Great job! All metrics are meeting expectations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}