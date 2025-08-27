import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, Users, DollarSign } from 'lucide-react';

interface MarketingAnalyticsProps {
  timeRange: string;
}

interface CampaignData {
  name: string;
  type: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  roi: number;
}

interface LeadSourceData {
  source: string;
  count: number;
  conversionRate: number;
  color: string;
}

export default function MarketingAnalytics({ timeRange }: MarketingAnalyticsProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSourceData[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalConversions, setTotalConversions] = useState(0);
  const [avgConversionRate, setAvgConversionRate] = useState(0);
  const [totalROI, setTotalROI] = useState(0);

  useEffect(() => {
    fetchMarketingAnalytics();
  }, [profile?.organization_id, timeRange]);

  const fetchMarketingAnalytics = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, source, status, created_at')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString());

      const totalLeadsCount = leads?.length || 0;
      setTotalLeads(totalLeadsCount);

      // Count conversions (members who were once leads)
      const conversions = leads?.filter(lead => lead.status === 'converted').length || 0;
      setTotalConversions(conversions);

      const conversionRate = totalLeadsCount > 0 ? (conversions / totalLeadsCount) * 100 : 0;
      setAvgConversionRate(conversionRate);

      // Group by source
      const sourceStats: { [source: string]: { count: number; conversions: number } } = {};
      
      leads?.forEach(lead => {
        const source = lead.source || 'Unknown';
        if (!sourceStats[source]) {
          sourceStats[source] = { count: 0, conversions: 0 };
        }
        sourceStats[source].count += 1;
        if (lead.status === 'converted') {
          sourceStats[source].conversions += 1;
        }
      });

      // Create lead source data
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      const sourceData = Object.entries(sourceStats).map(([source, stats], index) => ({
        source,
        count: stats.count,
        conversionRate: stats.count > 0 ? (stats.conversions / stats.count) * 100 : 0,
        color: colors[index % colors.length]
      }));
      setLeadSources(sourceData);

      // Fetch retention campaigns data
      const { data: campaigns } = await supabase
        .from('retention_campaigns')
        .select('id, name, campaign_type')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      // Create campaign performance data
      const campaignStats: CampaignData[] = campaigns?.map(campaign => {
        const sent = 10; // Placeholder
        const redeemed = 2; // Placeholder
        const convRate = sent > 0 ? (redeemed / sent) * 100 : 0;

        return {
          name: campaign.name,
          type: campaign.campaign_type,
          leads: sent,
          conversions: redeemed,
          conversionRate: convRate,
          cost: 100, // Placeholder cost
          roi: convRate * 2 // Simplified ROI calculation
        };
      }) || [];

      setCampaignData(campaignStats);

      // Calculate average ROI
      const avgROI = campaignStats.length > 0 
        ? campaignStats.reduce((sum, c) => sum + c.roi, 0) / campaignStats.length
        : 0;
      setTotalROI(avgROI);

    } catch (error: any) {
      console.error('Error fetching marketing analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading marketing analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Marketing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalLeads}</div>
                <div className="text-sm text-muted-foreground">Total Leads</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalConversions}</div>
                <div className="text-sm text-muted-foreground">Conversions</div>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalROI.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Avg ROI</div>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Marketing campaign effectiveness and conversion rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#3b82f6" name="Leads Generated" />
              <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>
              Distribution of leads by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={leadSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, count }) => `${source}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rates by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates by Source</CardTitle>
            <CardDescription>
              Lead to customer conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leadSources}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="conversionRate" fill="#8b5cf6" name="Conversion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaign ROI Analysis */}
      {campaignData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign ROI Analysis</CardTitle>
            <CardDescription>
              Return on investment for marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Conversion Rate %"
                />
                <Line 
                  type="monotone" 
                  dataKey="roi" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="ROI %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}