import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Server, 
  Activity,
  BarChart3,
  Settings,
  Gauge,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PerformanceOptimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState('2 hours ago');
  const { toast } = useToast();

  const performanceMetrics = [
    {
      name: 'Database Performance',
      score: 87,
      status: 'good',
      description: 'Query response times are within acceptable range',
      recommendations: [
        'Add index on member_id in bookings table',
        'Archive old transaction records',
        'Optimize recurring billing queries'
      ]
    },
    {
      name: 'API Response Time',
      score: 94,
      status: 'excellent',
      description: 'API endpoints responding quickly',
      recommendations: [
        'Implement Redis caching for class schedules',
        'Add database connection pooling'
      ]
    },
    {
      name: 'Memory Usage',
      score: 73,
      status: 'warning',
      description: 'Memory usage is higher than optimal',
      recommendations: [
        'Clear unused session data',
        'Optimize image processing pipeline',
        'Implement lazy loading for large datasets'
      ]
    },
    {
      name: 'Cache Hit Rate',
      score: 91,
      status: 'good',
      description: 'Good cache efficiency for frequently accessed data',
      recommendations: [
        'Extend cache TTL for member profiles',
        'Add caching for class availability checks'
      ]
    }
  ];

  const systemHealth = [
    {
      component: 'Authentication Service',
      status: 'healthy',
      uptime: '99.98%',
      responseTime: '45ms',
      lastCheck: '1 min ago'
    },
    {
      component: 'Payment Processing',
      status: 'healthy',
      uptime: '99.95%',
      responseTime: '120ms',
      lastCheck: '1 min ago'
    },
    {
      component: 'Email Service',
      status: 'degraded',
      uptime: '97.82%',
      responseTime: '2.3s',
      lastCheck: '1 min ago'
    },
    {
      component: 'Database Cluster',
      status: 'healthy',
      uptime: '99.99%',
      responseTime: '12ms',
      lastCheck: '30s ago'
    },
    {
      component: 'File Storage',
      status: 'healthy',
      uptime: '99.97%',
      responseTime: '67ms',
      lastCheck: '2 min ago'
    }
  ];

  const optimizationTasks = [
    {
      id: 1,
      name: 'Database Index Optimization',
      description: 'Add missing indexes to improve query performance',
      impact: 'high',
      effort: 'low',
      status: 'pending',
      estimatedImprovement: '15% faster queries'
    },
    {
      id: 2,
      name: 'Image Compression Pipeline',
      description: 'Implement automatic image compression for member photos',
      impact: 'medium',
      effort: 'medium',
      status: 'in-progress',
      estimatedImprovement: '30% storage reduction'
    },
    {
      id: 3,
      name: 'API Response Caching',
      description: 'Add Redis caching layer for frequently accessed endpoints',
      impact: 'high',
      effort: 'high',
      status: 'completed',
      estimatedImprovement: '40% faster API responses'
    },
    {
      id: 4,
      name: 'Background Job Optimization',
      description: 'Optimize email sending and notification processing',
      impact: 'medium',
      effort: 'low',
      status: 'pending',
      estimatedImprovement: '25% faster processing'
    }
  ];

  const runOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    setTimeout(() => {
      setIsOptimizing(false);
      setLastOptimization('Just now');
      toast({
        title: 'Optimization Complete',
        description: 'System performance has been optimized successfully',
      });
    }, 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Performance Optimizer</h2>
          <p className="text-muted-foreground">Monitor and optimize system performance</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Last Optimization</div>
            <div className="font-medium">{lastOptimization}</div>
          </div>
          <Button 
            onClick={runOptimization} 
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            {isOptimizing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="tasks">Optimization Tasks</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-6">
            {performanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Gauge className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{metric.name}</CardTitle>
                        <CardDescription>{metric.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                        {metric.score}%
                      </div>
                      <Badge variant={metric.status === 'warning' ? 'destructive' : 'secondary'}>
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={metric.score} className="h-2" />
                    
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <div className="space-y-2">
                        {metric.recommendations.map((rec, recIndex) => (
                          <div key={recIndex} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid gap-4">
            {systemHealth.map((component, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(component.status)}`} />
                      <div>
                        <h4 className="font-medium">{component.component}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last checked {component.lastCheck}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Uptime</div>
                        <div className="font-semibold">{component.uptime}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Response Time</div>
                        <div className="font-semibold">{component.responseTime}</div>
                      </div>
                      <Badge variant={component.status === 'healthy' ? 'default' : 'destructive'}>
                        {component.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              All critical systems are operational. Email service is experiencing slight delays but remains functional.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid gap-4">
            {optimizationTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {task.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {task.status === 'in-progress' && <Clock className="h-5 w-5 text-blue-500" />}
                        {task.status === 'pending' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {task.impact} impact
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.effort} effort
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {task.estimatedImprovement}
                      </div>
                      <Badge variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in-progress' ? 'secondary' : 'outline'
                      }>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>AI-powered performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">API response times improved 23% this week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Database queries optimized, 15% faster execution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Memory usage trending upward, review recommended</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cache hit rate stable at 91%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
                <CardDescription>AI-suggested improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">High Priority</div>
                    <div className="text-sm text-muted-foreground">
                      Implement connection pooling for 40% faster database queries
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Medium Priority</div>
                    <div className="text-sm text-muted-foreground">
                      Add CDN for static assets to reduce load times by 60%
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Low Priority</div>
                    <div className="text-sm text-muted-foreground">
                      Archive old logs to free up 2.3GB of storage space
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Score Overview</CardTitle>
              <CardDescription>Overall system performance rating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-2">86</div>
                  <div className="text-lg font-medium">Performance Score</div>
                  <div className="text-sm text-muted-foreground">
                    Above average • +5 points from last week
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceOptimizer;