import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    trend: 'up' | 'down';
    forecast: number[];
  };
  members: {
    total: number;
    active: number;
    churn: number;
    retention: number;
    growth: number;
  };
  classes: {
    attendance: number;
    capacity: number;
    popular: Array<{ name: string; bookings: number }>;
    revenue: number;
  };
  equipment: {
    utilization: number;
    maintenance: number;
    incidents: number;
  };
  predictions: {
    membershipGrowth: Array<{ month: string; predicted: number; actual?: number }>;
    revenueProjection: Array<{ month: string; amount: number; confidence: number }>;
    churnRisk: Array<{ segment: string; risk: number; count: number }>;
  };
}

const mockAnalyticsData: AnalyticsData = {
  revenue: {
    current: 45780,
    previous: 42350,
    trend: 'up',
    forecast: [48000, 51200, 53800, 56400, 59100]
  },
  members: {
    total: 1247,
    active: 1089,
    churn: 12,
    retention: 92.4,
    growth: 8.2
  },
  classes: {
    attendance: 847,
    capacity: 960,
    popular: [
      { name: 'HIIT Training', bookings: 156 },
      { name: 'Yoga Flow', bookings: 134 },
      { name: 'Strength Training', bookings: 98 },
      { name: 'Spin Class', bookings: 87 }
    ],
    revenue: 12450
  },
  equipment: {
    utilization: 78.5,
    maintenance: 5,
    incidents: 2
  },
  predictions: {
    membershipGrowth: [
      { month: 'Jan', predicted: 1100, actual: 1089 },
      { month: 'Feb', predicted: 1150, actual: 1134 },
      { month: 'Mar', predicted: 1200, actual: 1178 },
      { month: 'Apr', predicted: 1250 },
      { month: 'May', predicted: 1300 },
      { month: 'Jun', predicted: 1350 }
    ],
    revenueProjection: [
      { month: 'Apr', amount: 48000, confidence: 89 },
      { month: 'May', amount: 51200, confidence: 85 },
      { month: 'Jun', amount: 53800, confidence: 78 },
      { month: 'Jul', amount: 56400, confidence: 72 },
      { month: 'Aug', amount: 59100, confidence: 68 }
    ],
    churnRisk: [
      { segment: 'New Members (0-3 months)', risk: 25, count: 89 },
      { segment: 'Regular Members (3-12 months)', risk: 8, count: 456 },
      { segment: 'Long-term Members (12+ months)', risk: 3, count: 702 }
    ]
  }
};

const revenueData = [
  { month: 'Jan', revenue: 42350, target: 45000 },
  { month: 'Feb', revenue: 43200, target: 45000 },
  { month: 'Mar', revenue: 44100, target: 45000 },
  { month: 'Apr', revenue: 45780, target: 45000 },
  { month: 'May', revenue: 47200, target: 46000 },
  { month: 'Jun', revenue: 48900, target: 47000 }
];

const membershipData = [
  { month: 'Jan', new: 45, churned: 12, net: 33 },
  { month: 'Feb', new: 52, churned: 8, net: 44 },
  { month: 'Mar', new: 38, churned: 15, net: 23 },
  { month: 'Apr', new: 67, churned: 11, net: 56 },
  { month: 'May', new: 43, churned: 9, net: 34 },
  { month: 'Jun', new: 58, churned: 14, net: 44 }
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AdvancedAnalyticsDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<AnalyticsData>(mockAnalyticsData);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const exportReport = () => {
    // Implementation for report export
    console.log('Exporting analytics report...');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPercentageChange = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Real-time insights and predictive analytics for your gym
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.revenue.current)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {data.revenue.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                  )}
                  +{getPercentageChange(data.revenue.current, data.revenue.previous)}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.members.active.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  +{data.members.growth}% growth rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Class Attendance</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.classes.attendance}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Progress value={(data.classes.attendance / data.classes.capacity) * 100} className="w-16 h-1 mr-2" />
                  {((data.classes.attendance / data.classes.capacity) * 100).toFixed(1)}% capacity
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipment Health</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.equipment.utilization}%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {data.equipment.incidents === 0 ? (
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-yellow-500 mr-1" />
                  )}
                  {data.equipment.incidents} incidents this month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue vs targets</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membership Growth</CardTitle>
                <CardDescription>New members vs churn</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={membershipData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="new" fill="hsl(var(--primary))" />
                    <Bar dataKey="churned" fill="hsl(var(--destructive))" />
                    <Bar dataKey="net" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Popular Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Classes</CardTitle>
              <CardDescription>Most booked classes this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.classes.popular.map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{classItem.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={(classItem.bookings / 200) * 100} className="w-20" />
                      <span className="text-sm text-muted-foreground">{classItem.bookings}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Detailed revenue breakdown and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Membership Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(33300)}</div>
                  <p className="text-sm text-muted-foreground">72.8% of total revenue</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Class Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(data.classes.revenue)}</div>
                  <p className="text-sm text-muted-foreground">27.2% of total revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Average Revenue Per User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(Math.round(data.revenue.current / data.members.active))}</div>
                  <p className="text-sm text-muted-foreground">Monthly ARPU</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.members.total.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">All time registrations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.members.active.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">{((data.members.active / data.members.total) * 100).toFixed(1)}% of total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Retention Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.members.retention}%</div>
                  <p className="text-sm text-muted-foreground">12-month retention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Churn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.members.churn}</div>
                  <p className="text-sm text-muted-foreground">{((data.members.churn / data.members.active) * 100).toFixed(1)}% churn rate</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Member Growth Trend</CardTitle>
                <CardDescription>New members vs churned members over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={membershipData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="new" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.8}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="churned" 
                      stackId="2"
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive))" 
                      fillOpacity={0.8}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Membership Growth Prediction</CardTitle>
                <CardDescription>AI-powered membership forecasting</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.predictions.membershipGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Projection</CardTitle>
                <CardDescription>5-month revenue forecast with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.predictions.revenueProjection.map((projection, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium min-w-[50px]">{projection.month}</span>
                        <span className="text-lg">{formatCurrency(projection.amount)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={projection.confidence} className="w-20" />
                        <Badge variant={projection.confidence > 80 ? "default" : "secondary"}>
                          {projection.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Risk Analysis</CardTitle>
                <CardDescription>Member segments at risk of churning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.predictions.churnRisk.map((risk, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{risk.segment}</h4>
                        <Badge variant={risk.risk > 20 ? "destructive" : risk.risk > 10 ? "secondary" : "default"}>
                          {risk.risk}% risk
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{risk.count} members</span>
                        <Progress value={risk.risk} className="w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}