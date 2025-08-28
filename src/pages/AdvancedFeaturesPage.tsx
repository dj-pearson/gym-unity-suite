import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  Gauge, 
  Settings, 
  Workflow, 
  BarChart3,
  Sparkles,
  Rocket
} from 'lucide-react';
import AdvancedAnalyticsDashboard from '@/components/advanced/AdvancedAnalyticsDashboard';
import WorkflowAutomation from '@/components/advanced/WorkflowAutomation';
import PerformanceOptimizer from '@/components/advanced/PerformanceOptimizer';
import { usePermissions } from '@/hooks/usePermissions';

const AdvancedFeaturesPage = () => {
  const { hasPermission, PERMISSIONS } = usePermissions();

  if (!hasPermission(PERMISSIONS.VIEW_SETTINGS)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h3 className="text-xl font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">
            You don't have permission to access advanced features.
          </p>
        </div>
      </div>
    );
  }

  const advancedFeatures = [
    {
      name: 'AI-Powered Analytics',
      description: 'Machine learning insights and predictive analytics',
      icon: Brain,
      status: 'active',
      category: 'Intelligence'
    },
    {
      name: 'Workflow Automation',
      description: 'Automated business processes and member interactions',
      icon: Workflow,
      status: 'active',
      category: 'Automation'
    },
    {
      name: 'Performance Optimization',
      description: 'System performance monitoring and optimization',
      icon: Gauge,
      status: 'active',
      category: 'Performance'
    },
    {
      name: 'Advanced Integrations',
      description: 'Enterprise-grade third-party integrations',
      icon: Zap,
      status: 'coming-soon',
      category: 'Integrations'
    },
    {
      name: 'Custom Analytics',
      description: 'Build custom reports and analytics dashboards',
      icon: BarChart3,
      status: 'beta',
      category: 'Analytics'
    },
    {
      name: 'AI Assistant',
      description: 'Intelligent virtual assistant for staff and members',
      icon: Sparkles,
      status: 'coming-soon',
      category: 'Intelligence'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Features</h1>
          <p className="text-muted-foreground">
            Enterprise-grade capabilities and AI-powered tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <Badge variant="secondary">Enterprise Edition</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {advancedFeatures.map((feature, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {feature.category}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        feature.status === 'active' ? 'default' :
                        feature.status === 'beta' ? 'secondary' : 'outline'
                      }
                    >
                      {feature.status === 'coming-soon' ? 'Coming Soon' : feature.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {feature.status === 'active' && '✓ Available'}
                      {feature.status === 'beta' && '⚡ Beta Testing'}
                      {feature.status === 'coming-soon' && '🚀 In Development'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise Features</CardTitle>
              <CardDescription>
                Advanced capabilities for large organizations and fitness chains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">AI & Machine Learning</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Predictive member churn analysis</li>
                    <li>• Automated lead scoring and qualification</li>
                    <li>• Intelligent class recommendations</li>
                    <li>• Revenue optimization suggestions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Automation & Workflows</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Custom workflow builder</li>
                    <li>• Automated member communications</li>
                    <li>• Smart notification routing</li>
                    <li>• Process optimization tools</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Performance & Monitoring</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time system monitoring</li>
                    <li>• Performance optimization tools</li>
                    <li>• Advanced caching strategies</li>
                    <li>• Load balancing and scaling</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Enterprise Integrations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Custom API development</li>
                    <li>• ERP system connectivity</li>
                    <li>• Advanced webhook support</li>
                    <li>• Single sign-on (SSO)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="automation">
          <WorkflowAutomation />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceOptimizer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedFeaturesPage;