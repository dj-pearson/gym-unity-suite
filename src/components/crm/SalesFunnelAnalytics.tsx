import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign, 
  Calendar,
  BarChart3,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
  conversionRate?: number;
}

interface LeadSourceMetrics {
  source_id: string;
  source_name: string;
  total_leads: number;
  qualified_leads: number;
  converted_members: number;
  tours_scheduled: number;
  tours_completed: number;
  total_revenue: number;
  avg_conversion_time: number;
  cost_per_lead: number;
  roi: number;
}

interface SalesPersonPerformance {
  salesperson_id: string;
  name: string;
  leads_assigned: number;
  leads_contacted: number;
  tours_conducted: number;
  conversions: number;
  total_revenue: number;
  commission_earned: number;
  avg_response_time: number;
  conversion_rate: number;
}

interface TimeSeriesData {
  date: string;
  leads: number;
  conversions: number;
  revenue: number;
}

const stageColors = {
  'New Leads': 'bg-blue-100 text-blue-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Qualified': 'bg-purple-100 text-purple-800',
  'Tours Scheduled': 'bg-indigo-100 text-indigo-800',
  'Tours Completed': 'bg-green-100 text-green-800',
  'Members': 'bg-emerald-100 text-emerald-800',
};

export const SalesFunnelAnalytics: React.FC = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Data states
  const [funnelData, setFunnelData] = useState<ConversionFunnelData[]>([]);
  const [sourceMetrics, setSourceMetrics] = useState<LeadSourceMetrics[]>([]);
  const [salesPerformance, setSalesPerformance] = useState<SalesPersonPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [locations, setLocations] = useState<Array<{id: string, name: string}>>([]);
  const [leadSources, setLeadSources] = useState<Array<{id: string, name: string}>>([]);

  // Summary metrics
  const [summary, setSummary] = useState({
    totalLeads: 0,
    conversionRate: 0,
    avgRevPerCustomer: 0,
    totalRevenue: 0,
    avgSalesTime: 0,
    costPerAcquisition: 0,
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchAllAnalytics();
      fetchLocations();
      fetchLeadSources();
    }
  }, [profile?.organization_id, dateRange, selectedLocation, selectedSource]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('id, name')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      if (error) throw error;
      setLeadSources(data || []);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
    }
  };

  const fetchAllAnalytics = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFunnelData(),
        fetchSourceMetrics(),
        fetchSalesPerformance(),
        fetchTimeSeriesData(),
        fetchSummaryMetrics(),
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFunnelData = async () => {
    try {
      // Get leads data with filtering
      let leadsQuery = supabase
        .from('leads')
        .select(`
          id,
          status,
          created_at,
          source_id,
          location_id
        `)
        .eq('organization_id', profile?.organization_id)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59');

      if (selectedLocation !== 'all') {
        leadsQuery = leadsQuery.eq('location_id', selectedLocation);
      }
      if (selectedSource !== 'all') {
        leadsQuery = leadsQuery.eq('source_id', selectedSource);
      }

      const { data: leadsData, error } = await leadsQuery;
      if (error) throw error;

      // Get tour data
      const { data: toursData, error: toursError } = await supabase
        .from('facility_tours')
        .select('lead_id, status')
        .in('lead_id', leadsData?.map(l => l.id) || []);

      if (toursError) throw toursError;

      // Calculate funnel stages
      const totalLeads = leadsData?.length || 0;
      const contactedLeads = leadsData?.filter(l => l.status !== 'new').length || 0;
      const qualifiedLeads = leadsData?.filter(l => ['qualified', 'hot', 'warm'].includes(l.status)).length || 0;
      const toursScheduled = new Set(toursData?.map(t => t.lead_id)).size;
      const toursCompleted = new Set(toursData?.filter(t => t.status === 'completed').map(t => t.lead_id)).size;
      const members = leadsData?.filter(l => l.status === 'member').length || 0;

      const funnel: ConversionFunnelData[] = [
        {
          stage: 'New Leads',
          count: totalLeads,
          percentage: 100,
        },
        {
          stage: 'Contacted',
          count: contactedLeads,
          percentage: totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0,
          conversionRate: totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0,
        },
        {
          stage: 'Qualified',
          count: qualifiedLeads,
          percentage: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
          conversionRate: contactedLeads > 0 ? (qualifiedLeads / contactedLeads) * 100 : 0,
        },
        {
          stage: 'Tours Scheduled',
          count: toursScheduled,
          percentage: totalLeads > 0 ? (toursScheduled / totalLeads) * 100 : 0,
          conversionRate: qualifiedLeads > 0 ? (toursScheduled / qualifiedLeads) * 100 : 0,
        },
        {
          stage: 'Tours Completed',
          count: toursCompleted,
          percentage: totalLeads > 0 ? (toursCompleted / totalLeads) * 100 : 0,
          conversionRate: toursScheduled > 0 ? (toursCompleted / toursScheduled) * 100 : 0,
        },
        {
          stage: 'Members',
          count: members,
          percentage: totalLeads > 0 ? (members / totalLeads) * 100 : 0,
          conversionRate: toursCompleted > 0 ? (members / toursCompleted) * 100 : 0,
        },
      ];

      setFunnelData(funnel);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    }
  };

  const fetchSourceMetrics = async () => {
    try {
      const { data: sourcesData, error } = await supabase
        .from('lead_sources')
        .select(`
          id,
          name,
          cost_per_lead,
          leads!inner(
            id,
            status,
            created_at,
            location_id,
            facility_tours(status),
            lead_follow_up_tasks(completed_at)
          )
        `)
        .eq('organization_id', profile?.organization_id);

      if (error) throw error;

      // Get revenue data from subscriptions/memberships
      const { data: revenueData, error: revenueError } = await supabase
        .from('subscriptions')
        .select(`
          amount,
          profiles!inner(
            leads!inner(source_id)
          )
        `)
        .eq('profiles.leads.created_at', `gte.${dateRange.start}`)
        .eq('profiles.leads.created_at', `lte.${dateRange.end}T23:59:59`);

      if (revenueError) throw revenueError;

      const metrics: LeadSourceMetrics[] = sourcesData?.map(source => {
        const sourceLeads = source.leads || [];
        const filteredLeads = sourceLeads.filter(lead => 
          lead.created_at >= dateRange.start &&
          lead.created_at <= dateRange.end + 'T23:59:59' &&
          (selectedLocation === 'all' || lead.location_id === selectedLocation)
        );

        const qualifiedLeads = filteredLeads.filter(lead => 
          ['qualified', 'hot', 'warm'].includes(lead.status)
        ).length;

        const convertedMembers = filteredLeads.filter(lead => 
          lead.status === 'member'
        ).length;

        const toursScheduled = filteredLeads.filter(lead => 
          lead.facility_tours && lead.facility_tours.length > 0
        ).length;

        const toursCompleted = filteredLeads.filter(lead => 
          lead.facility_tours && lead.facility_tours.some(tour => tour.status === 'completed')
        ).length;

        // Calculate revenue for this source
        const sourceRevenue = revenueData
          ?.filter(sub => sub.profiles?.leads?.some(lead => lead.source_id === source.id))
          ?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0;

        // Calculate average conversion time
        const completedTasks = filteredLeads
          .flatMap(lead => lead.lead_follow_up_tasks || [])
          .filter(task => task.completed_at);

        const avgConversionTime = completedTasks.length > 0 
          ? completedTasks.reduce((sum, task) => {
              const taskDate = new Date(task.completed_at!);
              const leadDate = new Date(filteredLeads.find(lead => 
                lead.lead_follow_up_tasks?.some(t => t === task)
              )?.created_at || '');
              return sum + (taskDate.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / completedTasks.length
          : 0;

        const costPerLead = source.cost_per_lead || 0;
        const totalCost = filteredLeads.length * costPerLead;
        const roi = totalCost > 0 ? ((sourceRevenue - totalCost) / totalCost) * 100 : 0;

        return {
          source_id: source.id,
          source_name: source.name,
          total_leads: filteredLeads.length,
          qualified_leads: qualifiedLeads,
          converted_members: convertedMembers,
          tours_scheduled: toursScheduled,
          tours_completed: toursCompleted,
          total_revenue: sourceRevenue,
          avg_conversion_time: avgConversionTime,
          cost_per_lead: costPerLead,
          roi: roi,
        };
      }) || [];

      setSourceMetrics(metrics);
    } catch (error) {
      console.error('Error fetching source metrics:', error);
    }
  };

  const fetchSalesPerformance = async () => {
    try {
      const { data: salesData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          leads_assigned:leads!assigned_to(
            id,
            status,
            created_at,
            lead_activities(created_at, activity_type),
            facility_tours(status, guide_id)
          ),
          commissions:salesperson_commissions!salesperson_id(
            amount,
            earned_date
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .in('role', ['owner', 'manager', 'staff', 'salesperson']);

      if (error) throw error;

      const performance: SalesPersonPerformance[] = salesData?.map(person => {
        const assignedLeads = person.leads_assigned || [];
        const filteredLeads = assignedLeads.filter(lead =>
          lead.created_at >= dateRange.start &&
          lead.created_at <= dateRange.end + 'T23:59:59'
        );

        const contactedLeads = filteredLeads.filter(lead =>
          lead.lead_activities && lead.lead_activities.some(activity =>
            activity.activity_type === 'call' || activity.activity_type === 'email'
          )
        ).length;

        const toursData = filteredLeads.flatMap(lead => lead.facility_tours || []);
        const toursConducted = toursData.filter(tour => tour.guide_id === person.id).length;
        const conversions = filteredLeads.filter(lead => lead.status === 'member').length;

        const commissions = person.commissions || [];
        const periodCommissions = commissions.filter(comm =>
          comm.earned_date >= dateRange.start &&
          comm.earned_date <= dateRange.end + 'T23:59:59'
        );
        const totalCommission = periodCommissions.reduce((sum, comm) => sum + comm.amount, 0);

        // Calculate average response time
        const firstResponses = filteredLeads.map(lead => {
          const firstActivity = lead.lead_activities
            ?.filter(activity => activity.activity_type === 'call' || activity.activity_type === 'email')
            ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          
          if (firstActivity) {
            const leadDate = new Date(lead.created_at);
            const responseDate = new Date(firstActivity.created_at);
            return (responseDate.getTime() - leadDate.getTime()) / (1000 * 60 * 60); // hours
          }
          return null;
        }).filter(Boolean);

        const avgResponseTime = firstResponses.length > 0
          ? firstResponses.reduce((sum, time) => sum + time!, 0) / firstResponses.length
          : 0;

        // Estimate revenue (would be better with actual subscription data)
        const estimatedRevenue = conversions * 1000; // Assuming $1000 average membership value

        return {
          salesperson_id: person.id,
          name: `${person.first_name} ${person.last_name}`,
          leads_assigned: filteredLeads.length,
          leads_contacted: contactedLeads,
          tours_conducted: toursConducted,
          conversions: conversions,
          total_revenue: estimatedRevenue,
          commission_earned: totalCommission,
          avg_response_time: avgResponseTime,
          conversion_rate: filteredLeads.length > 0 ? (conversions / filteredLeads.length) * 100 : 0,
        };
      }) || [];

      setSalesPerformance(performance);
    } catch (error) {
      console.error('Error fetching sales performance:', error);
    }
  };

  const fetchTimeSeriesData = async () => {
    try {
      // Create date range array
      const dates = [];
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('created_at, status')
        .eq('organization_id', profile?.organization_id)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59');

      if (leadsError) throw leadsError;

      const timeSeries: TimeSeriesData[] = dates.map(date => {
        const dayLeads = leadsData?.filter(lead => 
          lead.created_at.startsWith(date)
        ) || [];

        const conversions = dayLeads.filter(lead => lead.status === 'member').length;
        const estimatedRevenue = conversions * 1000; // Assuming $1000 average

        return {
          date,
          leads: dayLeads.length,
          conversions,
          revenue: estimatedRevenue,
        };
      });

      setTimeSeriesData(timeSeries);
    } catch (error) {
      console.error('Error fetching time series data:', error);
    }
  };

  const fetchSummaryMetrics = async () => {
    try {
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('status, created_at, source_id')
        .eq('organization_id', profile?.organization_id)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59');

      if (error) throw error;

      const totalLeads = leadsData?.length || 0;
      const conversions = leadsData?.filter(lead => lead.status === 'member').length || 0;
      const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
      const totalRevenue = conversions * 1000; // Estimated
      const avgRevPerCustomer = conversions > 0 ? totalRevenue / conversions : 0;

      // Calculate average sales cycle time (simplified)
      const avgSalesTime = 14; // Days - would calculate from actual data
      const costPerAcquisition = totalRevenue > 0 ? (totalLeads * 50) / conversions : 0; // Estimated

      setSummary({
        totalLeads,
        conversionRate,
        avgRevPerCustomer,
        totalRevenue,
        avgSalesTime,
        costPerAcquisition,
      });
    } catch (error) {
      console.error('Error fetching summary metrics:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Funnel Analytics</h2>
          <p className="text-gray-600">Comprehensive sales performance and conversion analysis</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchAllAnalytics}
            disabled={isLoading}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {leadSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{summary.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${summary.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Revenue/Customer</p>
                <p className="text-2xl font-bold text-gray-900">${summary.avgRevPerCustomer.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Sales Time</p>
                <p className="text-2xl font-bold text-gray-900">{summary.avgSalesTime} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cost Per Acquisition</p>
                <p className="text-2xl font-bold text-gray-900">${summary.costPerAcquisition.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={stage.stage} className="flex items-center space-x-4">
                <div className="w-32">
                  <Badge className={stageColors[stage.stage as keyof typeof stageColors]}>
                    {stage.stage}
                  </Badge>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{stage.count} leads</span>
                    <span className="text-sm text-gray-500">
                      {stage.percentage.toFixed(1)}% of total
                      {stage.conversionRate && (
                        <span className="ml-2 text-blue-600">
                          ({stage.conversionRate.toFixed(1)}% conversion)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Source Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Source Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Total Leads</TableHead>
                <TableHead>Qualified</TableHead>
                <TableHead>Tours</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Cost/Lead</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceMetrics.map((source) => (
                <TableRow key={source.source_id}>
                  <TableCell className="font-medium">{source.source_name}</TableCell>
                  <TableCell>{source.total_leads}</TableCell>
                  <TableCell>
                    {source.qualified_leads} ({source.total_leads > 0 ? ((source.qualified_leads / source.total_leads) * 100).toFixed(1) : 0}%)
                  </TableCell>
                  <TableCell>
                    {source.tours_completed}/{source.tours_scheduled}
                  </TableCell>
                  <TableCell>
                    {source.converted_members} ({source.total_leads > 0 ? ((source.converted_members / source.total_leads) * 100).toFixed(1) : 0}%)
                  </TableCell>
                  <TableCell>${source.total_revenue.toLocaleString()}</TableCell>
                  <TableCell>${source.cost_per_lead.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={source.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {source.roi >= 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                      {source.roi.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sourceMetrics.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No source data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead>Leads Assigned</TableHead>
                <TableHead>Contact Rate</TableHead>
                <TableHead>Tours Conducted</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Avg Response Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesPerformance.map((person) => (
                <TableRow key={person.salesperson_id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.leads_assigned}</TableCell>
                  <TableCell>
                    {person.leads_contacted}/{person.leads_assigned} ({person.leads_assigned > 0 ? ((person.leads_contacted / person.leads_assigned) * 100).toFixed(1) : 0}%)
                  </TableCell>
                  <TableCell>{person.tours_conducted}</TableCell>
                  <TableCell>
                    {person.conversions} ({person.conversion_rate.toFixed(1)}%)
                  </TableCell>
                  <TableCell>${person.total_revenue.toLocaleString()}</TableCell>
                  <TableCell>${person.commission_earned.toFixed(2)}</TableCell>
                  <TableCell>{person.avg_response_time.toFixed(1)}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {salesPerformance.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No sales performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Series Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Shows daily leads, conversions, and revenue over time</p>
              </div>
            </div>
            
            {/* Simple text-based trend summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-blue-600">
                  {timeSeriesData.reduce((sum, day) => sum + day.leads, 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Conversions</p>
                <p className="text-2xl font-bold text-green-600">
                  {timeSeriesData.reduce((sum, day) => sum + day.conversions, 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${timeSeriesData.reduce((sum, day) => sum + day.revenue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};