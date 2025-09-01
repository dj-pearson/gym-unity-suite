import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Users, Activity, Zap, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export default function RealTimeAnalytics() {
  const [currentOccupancy, setCurrentOccupancy] = useState(142);
  const [occupancyHistory, setOccupancyHistory] = useState<Array<{ time: string; count: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOccupancy(prev => Math.max(50, Math.min(280, prev + Math.floor(Math.random() * 21) - 10)));
      
      const now = new Date();
      setOccupancyHistory(prev => [...prev, {
        time: now.toLocaleTimeString(),
        count: currentOccupancy
      }].slice(-20));
    }, 2000);

    return () => clearInterval(interval);
  }, [currentOccupancy]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Real-Time Analytics</h2>
        <p className="text-muted-foreground">Live monitoring of gym operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentOccupancy}</div>
            <Progress value={(currentOccupancy / 300) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">78</div>
            <p className="text-xs text-muted-foreground">of 85 active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Classes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">54 participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">ONLINE</div>
            <p className="text-xs text-muted-foreground">99.8% uptime</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Occupancy Trend</CardTitle>
          <CardDescription>Real-time member count</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={occupancyHistory}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}