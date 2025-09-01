import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold_warning: number;
  threshold_critical: number;
  status: 'healthy' | 'warning' | 'critical';
  last_updated: string;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  response_time: number;
  last_check: string;
  description: string;
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  response_time: number;
}

const MOCK_METRICS: SystemMetric[] = [
  {
    id: 'cpu',
    name: 'CPU Usage',
    value: 45,
    unit: '%',
    threshold_warning: 70,
    threshold_critical: 90,
    status: 'healthy',
    last_updated: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: 'memory',
    name: 'Memory Usage',
    value: 68,
    unit: '%',
    threshold_warning: 80,
    threshold_critical: 95,
    status: 'healthy',
    last_updated: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: 'disk',
    name: 'Disk Usage',
    value: 82,
    unit: '%',
    threshold_warning: 85,
    threshold_critical: 95,
    status: 'warning',
    last_updated: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: 'network',
    name: 'Network I/O',
    value: 156,
    unit: 'Mbps',
    threshold_warning: 800,
    threshold_critical: 950,
    status: 'healthy',
    last_updated: new Date(Date.now() - 60000).toISOString()
  }
];

const MOCK_SERVICES: ServiceStatus[] = [
  {
    id: 'web_app',
    name: 'Web Application',
    status: 'operational',
    uptime: 99.98,
    response_time: 245,
    last_check: new Date(Date.now() - 30000).toISOString(),
    description: 'Main gym management web application'
  },
  {
    id: 'api',
    name: 'REST API',
    status: 'operational',
    uptime: 99.95,
    response_time: 120,
    last_check: new Date(Date.now() - 30000).toISOString(),
    description: 'Backend API services'
  },
  {
    id: 'database',
    name: 'Database',
    status: 'operational',
    uptime: 99.99,
    response_time: 15,
    last_check: new Date(Date.now() - 30000).toISOString(),
    description: 'Primary PostgreSQL database'
  },
  {
    id: 'auth',
    name: 'Authentication Service',
    status: 'operational',
    uptime: 99.97,
    response_time: 98,
    last_check: new Date(Date.now() - 30000).toISOString(),
    description: 'User authentication and authorization'
  },
  {
    id: 'payments',
    name: 'Payment Processing',
    status: 'degraded',
    uptime: 99.12,
    response_time: 2340,
    last_check: new Date(Date.now() - 30000).toISOString(),
    description: 'Stripe payment processing integration'
  },
  {
    id: 'email',
    name: 'Email Service',
    status: 'operational',
    uptime: 98.87,
    response_time: 1200,
    last_check: new Date(Date.now() - 30000).toISOString(),
    description: 'Email notification system'
  }
];

const MOCK_PERFORMANCE_DATA: PerformanceData[] = [
  { timestamp: '00:00', cpu: 35, memory: 60, disk: 78, network: 120, response_time: 180 },
  { timestamp: '04:00', cpu: 28, memory: 58, disk: 79, network: 95, response_time: 165 },
  { timestamp: '08:00', cpu: 52, memory: 71, disk: 80, network: 180, response_time: 220 },
  { timestamp: '12:00', cpu: 48, memory: 68, disk: 81, network: 165, response_time: 195 },
  { timestamp: '16:00', cpu: 45, memory: 65, disk: 82, network: 156, response_time: 245 },
  { timestamp: '20:00', cpu: 40, memory: 62, disk: 82, network: 140, response_time: 210 },
];

export default function SystemHealthMonitor() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetric[]>(MOCK_METRICS);
  const [services, setServices] = useState<ServiceStatus[]>(MOCK_SERVICES);
  const [performanceData] = useState<PerformanceData[]>(MOCK_PERFORMANCE_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'cpu':
        return <Cpu className="w-5 h-5" />;
      case 'memory':
        return <MemoryStick className="w-5 h-5" />;
      case 'disk':
        return <HardDrive className="w-5 h-5" />;
      case 'network':
        return <Wifi className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'text-green-600';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600';
      case 'critical':
      case 'outage':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
      case 'outage':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default' as const,
      operational: 'default' as const,
      warning: 'secondary' as const,
      degraded: 'secondary' as const,
      critical: 'destructive' as const,
      outage: 'destructive' as const
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update metrics with slight variations
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(100, metric.value + (Math.random() - 0.5) * 10)),
        last_updated: new Date().toISOString()
      })));
      
      setIsRefreshing(false);
      toast({
        title: "Metrics Updated",
        description: "System metrics have been refreshed"
      });
    }, 2000);
  };

  const getOverallHealthScore = () => {
    const operationalServices = services.filter(s => s.status === 'operational').length;
    const healthyMetrics = metrics.filter(m => m.status === 'healthy').length;
    
    const serviceScore = (operationalServices / services.length) * 100;
    const metricScore = (healthyMetrics / metrics.length) * 100;
    
    return Math.round((serviceScore + metricScore) / 2);
  };

  const criticalIssues = [
    ...metrics.filter(m => m.status === 'critical'),
    ...services.filter(s => s.status === 'outage')
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">System Health Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of system performance and service availability
          </p>
        </div>
        <Button onClick={refreshMetrics} disabled={isRefreshing}>
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Progress value={getOverallHealthScore()} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {getOverallHealthScore()}% of systems operating normally
              </p>
            </div>
            <div className="text-4xl font-bold text-center ml-8">
              <span className={getStatusColor(getOverallHealthScore() >= 90 ? 'healthy' : 'warning')}>
                {getOverallHealthScore()}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Issues Detected:</strong> {criticalIssues.length} system component(s) require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Service Status</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    {getStatusIcon(service.status)}
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      {getStatusBadge(service.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime:</span>
                      <span className="font-semibold">{service.uptime}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time:</span>
                      <span className="font-semibold">{service.response_time}ms</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last checked: {new Date(service.last_check).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(metric.id)}
                      <CardTitle className="text-base">{metric.name}</CardTitle>
                    </div>
                    {getStatusIcon(metric.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                        {metric.value}{metric.unit}
                      </div>
                    </div>
                    <Progress 
                      value={metric.value} 
                      className="h-2" 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Warning: {metric.threshold_warning}{metric.unit}</span>
                      <span>Critical: {metric.threshold_critical}{metric.unit}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated: {new Date(metric.last_updated).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Resource Usage</CardTitle>
                <CardDescription>24-hour trend for CPU, memory, and disk usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                    <Line type="monotone" dataKey="disk" stroke="#ffc658" name="Disk %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>Application response time over 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="response_time" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                      name="Response Time (ms)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}