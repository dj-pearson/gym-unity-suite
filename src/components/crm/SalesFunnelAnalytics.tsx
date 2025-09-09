import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FunnelStage {
  stage: string;
  count: number;
  conversion_rate: number;
  color: string;
}

interface Metric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  description: string;
}

export default function SalesFunnelAnalytics() {
  const { profile } = useAuth();
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchAnalyticsData();
    }
  }, [profile?.organization_id]);

  const fetchAnalyticsData = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Fetch leads data and group by stage
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, stage_id, status, created_at')
        .eq('organization_id', profile.organization_id);

      if (leadsError) throw leadsError;

      // Fetch lead stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('lead_stages')
        .select('id, name, order_index, is_closed')
        .eq('organization_id', profile.organization_id)
        .order('order_index');

      if (stagesError) throw stagesError;

      // Calculate funnel data
      const totalLeads = leadsData?.length || 0;
      const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-purple-500', 'bg-emerald-500'];
      
      const funnelData = stagesData?.map((stage, index) => {
        const stageLeads = leadsData?.filter(lead => lead.stage_id === stage.id) || [];
        const count = stageLeads.length;
        const conversion_rate = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
        
        return {
          stage: stage.name,
          count,
          conversion_rate,
          color: colors[index % colors.length]
        };
      }) || [];

      setFunnelStages(funnelData);

      // Calculate metrics
      const conversions = leadsData?.filter(lead => lead.status === 'converted').length || 0;
      const conversionRate = totalLeads > 0 ? Math.round((conversions / totalLeads) * 100) : 0;

      const metricsData: Metric[] = [
        {
          title: "Total Leads",
          value: totalLeads.toString(),
          change: "0%", // Would need historical data to calculate
          trend: "up",
          icon: Users,
          description: "All time"
        },
        {
          title: "Conversion Rate",
          value: `${conversionRate}%`,
          change: "0%", // Would need historical data to calculate
          trend: "up", 
          icon: Target,
          description: "Lead to customer"
        },
        {
          title: "Active Stages",
          value: stagesData?.filter(s => !s.is_closed).length.toString() || "0",
          change: "0%",
          trend: "up",
          icon: DollarSign,
          description: "Sales pipeline"
        },
        {
          title: "Pipeline Health",
          value: funnelData.length > 0 ? "Good" : "Setup Required",
          change: "0%",
          trend: "up",
          icon: Clock,
          description: "Current status"
        }
      ];

      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sales Funnel Analytics</h2>
        <p className="text-muted-foreground">
          Track your lead progression and conversion rates through the sales pipeline.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === "up";
          
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-2 mt-2">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {metric.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Funnel</CardTitle>
          <CardDescription>
            Lead progression through each stage of your sales process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelStages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No funnel data available. Add some leads to see your sales funnel.
              </div>
            ) : (
              funnelStages.map((stage, index) => {
                const maxCount = Math.max(...funnelStages.map(s => s.count));
                const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                
                return (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {stage.count} leads
                        </Badge>
                        <Badge variant="secondary">
                          {stage.conversion_rate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full ${stage.color} transition-all duration-500`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    {index < funnelStages.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}