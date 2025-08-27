import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Clock } from 'lucide-react';

export default function SalesFunnelAnalytics() {

  // Placeholder data for demonstration
  const funnelStages = [
    { stage: "New Leads", count: 150, conversion_rate: 100, color: "bg-blue-500" },
    { stage: "Qualified", count: 75, conversion_rate: 50, color: "bg-green-500" },
    { stage: "Tour Scheduled", count: 45, conversion_rate: 30, color: "bg-yellow-500" },
    { stage: "Tour Completed", count: 30, conversion_rate: 20, color: "bg-orange-500" },
    { stage: "Proposal Sent", count: 18, conversion_rate: 12, color: "bg-purple-500" },
    { stage: "Closed Won", count: 12, conversion_rate: 8, color: "bg-emerald-500" }
  ];

  const metrics = [
    {
      title: "Total Leads",
      value: "150",
      change: "+12%",
      trend: "up",
      icon: Users,
      description: "This month"
    },
    {
      title: "Conversion Rate",
      value: "8%",
      change: "+2.1%",
      trend: "up", 
      icon: Target,
      description: "Lead to customer"
    },
    {
      title: "Avg. Deal Size",
      value: "$89",
      change: "-$5",
      trend: "down",
      icon: DollarSign,
      description: "Monthly membership"
    },
    {
      title: "Sales Cycle",
      value: "14 days",
      change: "-2 days",
      trend: "up",
      icon: Clock,
      description: "Average time"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sales Funnel Analytics</h2>
        <p className="text-muted-foreground">
          Track lead conversion through your sales pipeline
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
            {funnelStages.map((stage, index) => {
              const width = (stage.count / funnelStages[0].count) * 100;
              
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
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}