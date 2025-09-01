import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Activity, 
  Shield, 
  Database,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import AuditTrailManager from '@/components/audit/AuditTrailManager';
import SystemHealthMonitor from '@/components/audit/SystemHealthMonitor';
import { usePermissions } from '@/hooks/usePermissions';

const EnterpriseAuditPage = () => {
  const { hasPermission, PERMISSIONS } = usePermissions();

  if (!hasPermission(PERMISSIONS.VIEW_SETTINGS)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h3 className="text-xl font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">
            You don't have permission to access audit and monitoring features.
          </p>
        </div>
      </div>
    );
  }

  const auditFeatures = [
    {
      name: 'Audit Trail',
      description: 'Complete record of all system activities and user actions',
      icon: FileText,
      status: 'active',
      category: 'Compliance'
    },
    {
      name: 'System Health',
      description: 'Real-time monitoring of system performance and availability',
      icon: Activity,
      status: 'active',
      category: 'Monitoring'
    },
    {
      name: 'Security Events',
      description: 'Track and analyze security-related activities',
      icon: Shield,
      status: 'active',
      category: 'Security'
    },
    {
      name: 'Data Access Logs',
      description: 'Monitor data access patterns and compliance requirements',
      icon: Database,
      status: 'active',
      category: 'Privacy'
    },
    {
      name: 'Performance Analytics',
      description: 'Advanced analytics for system performance optimization',
      icon: BarChart3,
      status: 'beta',
      category: 'Analytics'
    }
  ];

  const complianceStatus = [
    {
      standard: 'GDPR',
      status: 'compliant',
      lastAudit: '2024-03-15',
      nextAudit: '2024-06-15'
    },
    {
      standard: 'PCI DSS',
      status: 'compliant',
      lastAudit: '2024-02-01',
      nextAudit: '2024-05-01'
    },
    {
      standard: 'CCPA',
      status: 'in_progress',
      lastAudit: '2024-01-15',
      nextAudit: '2024-04-15'
    },
    {
      standard: 'SOC 2',
      status: 'pending',
      lastAudit: null,
      nextAudit: '2024-05-01'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      compliant: 'default' as const,
      in_progress: 'secondary' as const,
      pending: 'destructive' as const
    };
    
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Audit & Monitoring</h1>
          <p className="text-muted-foreground">
            Comprehensive audit trails, system monitoring, and compliance management
          </p>
        </div>
        <Badge variant="secondary">Enterprise Edition</Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
          <TabsTrigger value="system-health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Feature Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {auditFeatures.map((feature, index) => (
              <Card key={index}>
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
                      {feature.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Standards Status</CardTitle>
              <CardDescription>
                Current status of various compliance standards and certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {complianceStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-medium">{item.standard}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.lastAudit ? `Last audit: ${item.lastAudit}` : 'Not audited'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(item.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        Next: {item.nextAudit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Audit Capabilities</CardTitle>
              <CardDescription>
                Advanced auditing and monitoring features for enterprise compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Audit & Compliance</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Complete audit trail of all system activities</li>
                    <li>• Automated compliance reporting</li>
                    <li>• Data access monitoring and logging</li>
                    <li>• User activity tracking and analysis</li>
                    <li>• Regulatory compliance dashboards</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">System Monitoring</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time system performance monitoring</li>
                    <li>• Service availability tracking</li>
                    <li>• Performance metrics and analytics</li>
                    <li>• Automated alerting and notifications</li>
                    <li>• Historical trend analysis</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Security & Privacy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Security event detection and logging</li>
                    <li>• Failed login attempt tracking</li>
                    <li>• Data breach detection and reporting</li>
                    <li>• Privacy impact assessments</li>
                    <li>• Encryption and access control monitoring</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Reporting & Analytics</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automated compliance report generation</li>
                    <li>• Custom audit report creation</li>
                    <li>• Data export and archiving</li>
                    <li>• Trend analysis and insights</li>
                    <li>• Executive dashboards and summaries</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-trail">
          <AuditTrailManager />
        </TabsContent>

        <TabsContent value="system-health">
          <SystemHealthMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseAuditPage;