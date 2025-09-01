import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Target } from 'lucide-react';

const kpiData = [
  { name: 'Monthly Revenue', value: 45780, target: 50000, trend: 'up', change: 8.2 },
  { name: 'Member Retention', value: 92.4, target: 95, trend: 'up', change: 2.1 },
  { name: 'Class Attendance', value: 78.3, target: 80, trend: 'down', change: -1.2 },
  { name: 'Equipment Utilization', value: 85.2, target: 90, trend: 'up', change: 3.7 }
];

const trendData = [
  { month: 'Jan', revenue: 42350, members: 1089, retention: 91.2 },
  { month: 'Feb', revenue: 43200, members: 1134, retention: 91.8 },
  { month: 'Mar', revenue: 44100, members: 1178, retention: 92.1 },
  { month: 'Apr', revenue: 45780, members: 1247, retention: 92.4 }
];

interface KPIDashboardProps {
  timeRange: string;
}

export default function KPIDashboard({ timeRange }: KPIDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">KPI Dashboard</h2>
        <p className="text-muted-foreground">Key performance indicators and business metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
              {kpi.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpi.name.includes('Revenue') ? `$${kpi.value.toLocaleString()}` : `${kpi.value}%`}
              </div>
              <Progress value={(kpi.value / kpi.target) * 100} className="mt-2" />
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted-foreground">
                  Target: {kpi.name.includes('Revenue') ? `$${kpi.target.toLocaleString()}` : `${kpi.target}%`}
                </span>
                <Badge variant={kpi.trend === 'up' ? 'default' : 'destructive'}>
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Historical KPI performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="members" stroke="hsl(var(--secondary))" strokeWidth={2} />
              <Line type="monotone" dataKey="retention" stroke="hsl(var(--accent))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}