import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Award,
  AlertCircle
} from 'lucide-react';

interface LeadAnalytics {
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  averageDealSize: number;
  totalPipelineValue: number;
  leadsBySource: Array<{ source: string; count: number; value: number }>;
  leadsByStage: Array<{ stage: string; count: number; value: number; color: string }>;
  leadTrend: Array<{ date: string; leads: number; converted: number }>;
  activityMetrics: {
    totalActivities: number;
    callsToConversion: number;
    emailsToConversion: number;
    avgTimeToConversion: number;
  };
}

export default function LeadAnalyticsDashboard() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchAnalytics();
    }
  }, [profile?.organization_id, timeRange]);

  const fetchAnalytics = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d': startDate.setDate(endDate.getDate() - 7); break;
        case '30d': startDate.setDate(endDate.getDate() - 30); break;
        case '90d': startDate.setDate(endDate.getDate() - 90); break;
        case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
      }

      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString());

      if (leadsError) throw leadsError;

      // Fetch stages for lead distribution
      const { data: stages } = await supabase
        .from('lead_stages')
        .select('*')
        .eq('organization_id', profile.organization_id);

      // Fetch activities
      const leadIds = leads?.map(l => l.id) || [];
      const { data: activities } = await supabase
        .from('lead_activities')
        .select('*')
        .in('lead_id', leadIds);

      // Calculate analytics
      const analyticsData: LeadAnalytics = {
        totalLeads: leads?.length || 0,
        newLeadsThisMonth: leads?.filter(l => 
          new Date(l.created_at).getMonth() === new Date().getMonth()
        ).length || 0,
        conversionRate: calculateConversionRate(leads || []),
        averageDealSize: calculateAverageDealSize(leads || []),
        totalPipelineValue: calculateTotalPipelineValue(leads || []),
        leadsBySource: calculateLeadsBySource(leads || []),
        leadsByStage: calculateLeadsByStage(leads || [], stages || []),
        leadTrend: calculateLeadTrend(leads || []),
        activityMetrics: calculateActivityMetrics(leads || [], activities || [])
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateConversionRate = (leads: any[]) => {
    const convertedLeads = leads.filter(l => l.status === 'member').length;
    return leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;
  };

  const calculateAverageDealSize = (leads: any[]) => {
    const dealsWithValue = leads.filter(l => l.estimated_value > 0);
    const totalValue = dealsWithValue.reduce((sum, l) => sum + l.estimated_value, 0);
    return dealsWithValue.length > 0 ? Math.round(totalValue / dealsWithValue.length) : 0;
  };

  const calculateTotalPipelineValue = (leads: any[]) => {
    return leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  };

  const calculateLeadsBySource = (leads: any[]) => {
    const sourceMap = new Map();
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { count: 0, value: 0 });
      }
      const current = sourceMap.get(source);
      current.count++;
      current.value += lead.estimated_value || 0;
    });

    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      value: data.value
    }));
  };

  const calculateLeadsByStage = (leads: any[], stages: any[]) => {
    const stageMap = new Map();
    
    // Initialize with stages
    stages.forEach(stage => {
      stageMap.set(stage.id, {
        stage: stage.name,
        count: 0,
        value: 0,
        color: stage.color
      });
    });

    // Add unassigned category
    stageMap.set('unassigned', {
      stage: 'Unassigned',
      count: 0,
      value: 0,
      color: '#6b7280'
    });

    leads.forEach(lead => {
      const stageId = lead.stage_id || 'unassigned';
      if (stageMap.has(stageId)) {
        const current = stageMap.get(stageId);
        current.count++;
        current.value += lead.estimated_value || 0;
      }
    });

    return Array.from(stageMap.values()).filter(stage => stage.count > 0);
  };

  const calculateLeadTrend = (leads: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const dayLeads = leads.filter(l => 
        l.created_at.split('T')[0] === date
      );
      const dayConverted = dayLeads.filter(l => 
        l.status === 'member'
      );

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads: dayLeads.length,
        converted: dayConverted.length
      };
    });
  };

  const calculateActivityMetrics = (leads: any[], activities: any[]) => {
    const convertedLeads = leads.filter(l => l.status === 'member');
    
    let totalCalls = 0;
    let totalEmails = 0;
    let totalTimeToConversion = 0;

    convertedLeads.forEach(lead => {
      const leadActivities = activities.filter(a => a.lead_id === lead.id);
      totalCalls += leadActivities.filter(a => a.activity_type === 'call').length;
      totalEmails += leadActivities.filter(a => a.activity_type === 'email').length;
      
      // Calculate time to conversion (days between first activity and conversion)
      if (leadActivities.length > 0) {
        const firstActivity = new Date(Math.min(...leadActivities.map(a => new Date(a.created_at).getTime())));
        const conversion = new Date(lead.updated_at);
        const daysDiff = Math.ceil((conversion.getTime() - firstActivity.getTime()) / (1000 * 60 * 60 * 24));
        totalTimeToConversion += daysDiff;
      }
    });

    return {
      totalActivities: activities.length,
      callsToConversion: convertedLeads.length > 0 ? Math.round(totalCalls / convertedLeads.length) : 0,
      emailsToConversion: convertedLeads.length > 0 ? Math.round(totalEmails / convertedLeads.length) : 0,
      avgTimeToConversion: convertedLeads.length > 0 ? Math.round(totalTimeToConversion / convertedLeads.length) : 0
    };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-muted-foreground">No data available</div>;
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your sales pipeline</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Leads</div>
                <div className="text-2xl font-bold">{analytics.totalLeads}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">This Month</div>
                <div className="text-2xl font-bold text-success">{analytics.newLeadsThisMonth}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-warning" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Conversion Rate</div>
                <div className="text-2xl font-bold text-warning">{analytics.conversionRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Avg Deal Size</div>
                <div className="text-2xl font-bold text-secondary">${analytics.averageDealSize}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Pipeline Value</div>
                <div className="text-2xl font-bold text-primary">${analytics.totalPipelineValue.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Lead Generation Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.leadTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    name="New Leads"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="converted" 
                    stackId="2"
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success))" 
                    fillOpacity={0.6}
                    name="Converted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Leads by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.leadsByStage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ stage, count }) => `${stage}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.leadsByStage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Stage Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.leadsByStage.map((stage, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <Badge variant="outline">{stage.count} leads</Badge>
                      </div>
                      <span className="font-semibold text-success">
                        ${stage.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card className="gym-card">
            <CardHeader>
              <CardTitle>Lead Sources Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.leadsBySource}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="hsl(var(--primary))" name="Lead Count" />
                  <Bar yAxisId="right" dataKey="value" fill="hsl(var(--success))" name="Total Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="gym-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Activity Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm">Calls to Convert</span>
                  </div>
                  <span className="font-bold">{analytics.activityMetrics.callsToConversion}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-secondary" />
                    <span className="text-sm">Emails to Convert</span>
                  </div>
                  <span className="font-bold">{analytics.activityMetrics.emailsToConversion}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-warning" />
                    <span className="text-sm">Avg Time to Convert</span>
                  </div>
                  <span className="font-bold">{analytics.activityMetrics.avgTimeToConversion} days</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-success" />
                    <span className="text-sm">Total Activities</span>
                  </div>
                  <span className="font-bold">{analytics.activityMetrics.totalActivities}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="gym-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="font-medium text-success mb-1">Best Performing Source</div>
                  <div className="text-sm text-muted-foreground">
                    {analytics.leadsBySource.length > 0 
                      ? analytics.leadsBySource.sort((a, b) => b.count - a.count)[0].source
                      : 'No data'
                    } generates the most leads
                  </div>
                </div>

                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="font-medium text-warning mb-1">Conversion Opportunity</div>
                  <div className="text-sm text-muted-foreground">
                    {analytics.conversionRate < 20 
                      ? 'Consider improving follow-up process'
                      : 'Great conversion rate! Keep it up'
                    }
                  </div>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="font-medium text-primary mb-1">Pipeline Health</div>
                  <div className="text-sm text-muted-foreground">
                    ${analytics.averageDealSize} average deal size shows 
                    {analytics.averageDealSize > 500 ? ' strong' : ' moderate'} lead quality
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}