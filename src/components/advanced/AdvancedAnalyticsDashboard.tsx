import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  AlertTriangle, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';

const AdvancedAnalyticsDashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Mock AI-powered insights data
  const aiInsights = [
    {
      type: 'prediction',
      title: 'Member Churn Risk Alert',
      description: '23 members identified with high churn probability this month',
      confidence: 87,
      impact: 'high',
      trend: 'up',
      value: '23 members',
      action: 'Schedule retention calls'
    },
    {
      type: 'opportunity',
      title: 'Revenue Optimization',
      description: 'Personal training sales could increase 34% with targeted campaigns',
      confidence: 92,
      impact: 'high',
      trend: 'up',
      value: '+$12,400',
      action: 'Launch PT promotion'
    },
    {
      type: 'efficiency',
      title: 'Peak Hours Optimization',
      description: 'Tuesday 6-8 PM shows 23% underutilization',
      confidence: 95,
      impact: 'medium',
      trend: 'neutral',
      value: '23% unused',
      action: 'Add popular classes'
    },
    {
      type: 'alert',
      title: 'Equipment Maintenance Due',
      description: 'Treadmill #3 requires maintenance based on usage patterns',
      confidence: 99,
      impact: 'medium',
      trend: 'down',
      value: '127% usage',
      action: 'Schedule maintenance'
    }
  ];

  const predictiveMetrics = [
    {
      name: 'Member Retention Rate',
      current: 89,
      predicted: 92,
      change: '+3%',
      confidence: 94
    },
    {
      name: 'Revenue Growth',
      current: 15,
      predicted: 18,
      change: '+3%',
      confidence: 88
    },
    {
      name: 'Class Utilization',
      current: 76,
      predicted: 82,
      change: '+6%',
      confidence: 91
    },
    {
      name: 'Member Satisfaction',
      current: 4.2,
      predicted: 4.5,
      change: '+0.3',
      confidence: 85
    }
  ];

  const automationRules = [
    {
      name: 'Churn Prevention',
      status: 'active',
      triggers: 3,
      actions: 12,
      success: 73
    },
    {
      name: 'Upsell Campaigns',
      status: 'active',
      triggers: 8,
      actions: 24,
      success: 45
    },
    {
      name: 'Class Recommendations',
      status: 'active',
      triggers: 15,
      actions: 89,
      success: 67
    },
    {
      name: 'Payment Reminders',
      status: 'paused',
      triggers: 2,
      actions: 6,
      success: 91
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">AI-powered insights and predictive analytics</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="members">Members</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {aiInsights.map((insight, index) => (
              <Card key={index} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {insight.type === 'prediction' && <Brain className="h-4 w-4 text-purple-500" />}
                      {insight.type === 'opportunity' && <Target className="h-4 w-4 text-green-500" />}
                      {insight.type === 'efficiency' && <Zap className="h-4 w-4 text-blue-500" />}
                      {insight.type === 'alert' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'}>
                      {insight.impact} impact
                    </Badge>
                  </div>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{insight.value}</span>
                        {insight.trend === 'up' && <ArrowUp className="h-4 w-4 text-green-500" />}
                        {insight.trend === 'down' && <ArrowDown className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Confidence</div>
                        <div className="font-semibold">{insight.confidence}%</div>
                      </div>
                    </div>
                    <Progress value={insight.confidence} className="h-2" />
                    <Button className="w-full" variant="outline">
                      {insight.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription>
                30-day forecasts based on historical data and AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {predictiveMetrics.map((metric, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{metric.name}</h4>
                      <Badge variant="outline">{metric.confidence}% confidence</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Current</div>
                        <div className="text-xl font-bold">{metric.current}%</div>
                      </div>
                      <ArrowUp className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Predicted</div>
                        <div className="text-xl font-bold text-green-600">{metric.predicted}%</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {metric.change}
                      </Badge>
                    </div>
                    <Progress value={(metric.predicted / 100) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                AI-powered automation rules and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {rule.triggers} triggers • {rule.actions} actions executed
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                        <div className="font-semibold">{rule.success}%</div>
                      </div>
                      <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                        {rule.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Member Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,847</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
                <Progress value={67} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Churn Prediction Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  Model confidence level
                </p>
                <Progress value={94} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+$18.4K</div>
                <p className="text-xs text-muted-foreground">
                  Potential monthly increase
                </p>
                <Progress value={78} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Performance Metrics</CardTitle>
              <CardDescription>
                Deep insights into business performance and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Member Acquisition Cost</span>
                    <span className="font-semibold">$127</span>
                  </div>
                  <Progress value={73} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Satisfaction Score</span>
                    <span className="font-semibold">4.3/5</span>
                  </div>
                  <Progress value={86} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Operational Efficiency</span>
                    <span className="font-semibold">87%</span>
                  </div>
                  <Progress value={87} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Staff Productivity Index</span>
                    <span className="font-semibold">91%</span>
                  </div>
                  <Progress value={91} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;