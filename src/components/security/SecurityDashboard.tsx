import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Key,
  Database,
  Users,
  FileText,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface SecurityMetric {
  id: string;
  name: string;
  status: 'compliant' | 'warning' | 'critical';
  score: number;
  lastCheck: string;
  description: string;
}

interface SecurityIncident {
  id: string;
  type: 'access_violation' | 'data_breach' | 'unauthorized_login' | 'system_vulnerability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  resolved: boolean;
}

const SECURITY_METRICS: SecurityMetric[] = [
  {
    id: '1',
    name: 'Data Encryption',
    status: 'compliant',
    score: 98,
    lastCheck: new Date(Date.now() - 86400000).toISOString(),
    description: 'All sensitive data encrypted at rest and in transit'
  },
  {
    id: '2',
    name: 'Access Control',
    status: 'compliant',
    score: 95,
    lastCheck: new Date(Date.now() - 3600000).toISOString(),
    description: 'Role-based permissions and multi-factor authentication'
  },
  {
    id: '3',
    name: 'GDPR Compliance',
    status: 'warning',
    score: 85,
    lastCheck: new Date(Date.now() - 7200000).toISOString(),
    description: 'Some data retention policies need review'
  },
  {
    id: '4',
    name: 'PCI DSS',
    status: 'compliant',
    score: 100,
    lastCheck: new Date(Date.now() - 1800000).toISOString(),
    description: 'Payment processing security standards met'
  },
  {
    id: '5',
    name: 'Audit Logging',
    status: 'compliant',
    score: 92,
    lastCheck: new Date(Date.now() - 900000).toISOString(),
    description: 'Comprehensive activity tracking and monitoring'
  }
];

const SECURITY_INCIDENTS: SecurityIncident[] = [
  {
    id: '1',
    type: 'unauthorized_login',
    severity: 'medium',
    description: 'Failed login attempts detected from unusual IP address',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    resolved: true
  },
  {
    id: '2',
    type: 'access_violation',
    severity: 'high',
    description: 'Staff member attempted to access restricted member data',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    resolved: false
  },
  {
    id: '3',
    type: 'system_vulnerability',
    severity: 'low',
    description: 'Minor security patch required for third-party integration',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    resolved: true
  }
];

export default function SecurityDashboard() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetric[]>(SECURITY_METRICS);
  const [incidents, setIncidents] = useState<SecurityIncident[]>(SECURITY_INCIDENTS);
  const [loading, setLoading] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    };
    return <Badge variant={variants[severity] || 'default'}>{severity}</Badge>;
  };

  const getOverallScore = () => {
    const totalScore = metrics.reduce((sum, metric) => sum + metric.score, 0);
    return Math.round(totalScore / metrics.length);
  };

  const runSecurityScan = async () => {
    setLoading(true);
    // Simulate security scan
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update last check times
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      lastCheck: new Date().toISOString(),
      score: Math.min(100, metric.score + Math.floor(Math.random() * 3))
    })));
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security metrics and compliance status
          </p>
        </div>
        <Button onClick={runSecurityScan} disabled={loading}>
          {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
          {loading ? 'Scanning...' : 'Run Security Scan'}
        </Button>
      </div>

      {/* Overall Security Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Overall Security Score
            </CardTitle>
            <Badge variant={
              getOverallScore() >= 95 ? 'default' : 
              getOverallScore() >= 85 ? 'secondary' : 
              'destructive'
            }>
              {getOverallScore()}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={getOverallScore()} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            Your security posture is {getOverallScore() >= 95 ? 'excellent' : getOverallScore() >= 85 ? 'good' : 'needs attention'}
          </p>
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{metric.name}</CardTitle>
                {getStatusIcon(metric.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Score</span>
                    <span className="text-sm">{metric.score}/100</span>
                  </div>
                  <Progress value={metric.score} />
                </div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
                <p className="text-xs text-muted-foreground">
                  Last checked: {format(new Date(metric.lastCheck), 'MMM d, h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Security Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Recent Security Incidents
          </CardTitle>
          <CardDescription>
            Monitor and respond to security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.length > 0 ? (
              incidents.map((incident) => (
                <Alert key={incident.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(incident.severity)}
                          <Badge variant={incident.resolved ? 'default' : 'secondary'}>
                            {incident.resolved ? 'Resolved' : 'Open'}
                          </Badge>
                        </div>
                        <p className="text-sm">{incident.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(incident.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {!incident.resolved && (
                        <Button size="sm" variant="outline">
                          Investigate
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No security incidents reported
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Key className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Access Control</h3>
            <p className="text-xs text-muted-foreground">Manage user permissions</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Database className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Data Protection</h3>
            <p className="text-xs text-muted-foreground">Backup & encryption</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Audit Logs</h3>
            <p className="text-xs text-muted-foreground">View access history</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Compliance</h3>
            <p className="text-xs text-muted-foreground">GDPR & PCI DSS</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}