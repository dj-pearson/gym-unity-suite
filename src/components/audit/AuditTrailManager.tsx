import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Filter, 
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Shield,
  Database,
  Users,
  Settings,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  event_type: string;
  category: 'authentication' | 'authorization' | 'data' | 'system' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  user_name?: string;
  resource: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  session_id?: string;
}

interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'pci_dss' | 'ccpa' | 'security' | 'custom';
  title: string;
  period_start: string;
  period_end: string;
  status: 'generating' | 'ready' | 'failed';
  file_path?: string;
  created_at: string;
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: '1',
    event_type: 'user.login.success',
    category: 'authentication',
    severity: 'low',
    user_id: 'user_123',
    user_name: 'John Smith',
    resource: 'auth_system',
    action: 'login',
    details: { method: 'password', mfa_used: true },
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0...',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    session_id: 'sess_abc123'
  },
  {
    id: '2',
    event_type: 'member.data.accessed',
    category: 'data',
    severity: 'medium',
    user_id: 'staff_456',
    user_name: 'Sarah Johnson',
    resource: 'member_profile',
    action: 'view',
    details: { member_id: 'mem_789', fields_accessed: ['name', 'email', 'membership_status'] },
    ip_address: '192.168.1.101',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: '3',
    event_type: 'payment.processed',
    category: 'data',
    severity: 'medium',
    user_id: 'system',
    user_name: 'System',
    resource: 'payment_gateway',
    action: 'charge',
    details: { amount: 99.99, member_id: 'mem_789', payment_method: 'card_ending_4242' },
    timestamp: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: '4',
    event_type: 'security.unauthorized_access_attempt',
    category: 'authorization',
    severity: 'high',
    resource: 'admin_panel',
    action: 'access_denied',
    details: { attempted_resource: '/admin/settings', reason: 'insufficient_permissions' },
    ip_address: '192.168.1.150',
    timestamp: new Date(Date.now() - 21600000).toISOString()
  },
  {
    id: '5',
    event_type: 'data.export.requested',
    category: 'compliance',
    severity: 'medium',
    user_id: 'admin_789',
    user_name: 'Mike Wilson',
    resource: 'member_data',
    action: 'export',
    details: { export_type: 'gdpr_request', member_id: 'mem_456', file_format: 'json' },
    ip_address: '192.168.1.102',
    timestamp: new Date(Date.now() - 28800000).toISOString()
  }
];

const MOCK_REPORTS: ComplianceReport[] = [
  {
    id: '1',
    type: 'gdpr',
    title: 'GDPR Compliance Report - March 2024',
    period_start: '2024-03-01',
    period_end: '2024-03-31',
    status: 'ready',
    file_path: '/reports/gdpr-march-2024.pdf',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '2',
    type: 'security',
    title: 'Security Audit Report - Q1 2024',
    period_start: '2024-01-01',
    period_end: '2024-03-31',
    status: 'ready',
    file_path: '/reports/security-q1-2024.pdf',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: '3',
    type: 'pci_dss',
    title: 'PCI DSS Compliance Report',
    period_start: '2024-01-01',
    period_end: '2024-04-01',
    status: 'generating',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

export default function AuditTrailManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [reports, setReports] = useState<ComplianceReport[]>(MOCK_REPORTS);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'authorization':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'data':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'system':
        return <Settings className="w-4 h-4 text-gray-500" />;
      case 'compliance':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'default' as const,
      medium: 'secondary' as const,
      high: 'destructive' as const,
      critical: 'destructive' as const
    };
    
    return <Badge variant={variants[severity as keyof typeof variants] || 'default'}>{severity}</Badge>;
  };

  const getReportStatusBadge = (status: string) => {
    const config = {
      generating: { label: 'Generating', variant: 'secondary' as const, icon: Settings },
      ready: { label: 'Ready', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'Failed', variant: 'destructive' as const, icon: AlertTriangle }
    };
    
    const { label, variant, icon: Icon } = config[status as keyof typeof config] || config.ready;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const handleGenerateReport = async (type: string) => {
    setLoading(true);
    
    const newReport: ComplianceReport = {
      id: Date.now().toString(),
      type: type as any,
      title: `${type.toUpperCase()} Report - ${format(new Date(), 'MMMM yyyy')}`,
      period_start: format(new Date(Date.now() - 86400000 * 30), 'yyyy-MM-dd'),
      period_end: format(new Date(), 'yyyy-MM-dd'),
      status: 'generating',
      created_at: new Date().toISOString()
    };

    setReports(prev => [newReport, ...prev]);
    
    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(report => 
        report.id === newReport.id 
          ? { ...report, status: 'ready', file_path: `/reports/${type}-${Date.now()}.pdf` }
          : report
      ));
      
      toast({
        title: "Report Generated",
        description: `${type.toUpperCase()} compliance report is ready for download`
      });
      
      setLoading(false);
    }, 3000);
  };

  const handleDownloadReport = (report: ComplianceReport) => {
    toast({
      title: "Download Started",
      description: `Downloading ${report.title}`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Audit Trail & Compliance</h2>
          <p className="text-muted-foreground">
            Monitor system activities and generate compliance reports
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filter Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="authorization">Authorization</SelectItem>
                <SelectItem value="data">Data Access</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            Detailed record of all system activities and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{log.event_type}</div>
                    <div className="text-sm text-muted-foreground">{log.action}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(log.category)}
                      <span className="capitalize">{log.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell>
                    <div>{log.user_name || 'System'}</div>
                    {log.ip_address && (
                      <div className="text-sm text-muted-foreground">{log.ip_address}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{log.resource}</code>
                  </TableCell>
                  <TableCell>{format(new Date(log.timestamp), 'MMM d, h:mm a')}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                          <DialogDescription>{log.event_type}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>Category:</strong> {log.category}
                            </div>
                            <div>
                              <strong>Severity:</strong> {log.severity}
                            </div>
                            <div>
                              <strong>User:</strong> {log.user_name || 'System'}
                            </div>
                            <div>
                              <strong>Resource:</strong> {log.resource}
                            </div>
                            <div>
                              <strong>Action:</strong> {log.action}
                            </div>
                            <div>
                              <strong>Timestamp:</strong> {format(new Date(log.timestamp), 'MMM d, yyyy h:mm:ss a')}
                            </div>
                          </div>
                          {log.details && (
                            <div>
                              <strong>Details:</strong>
                              <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compliance Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>
                Generate and download compliance and audit reports
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleGenerateReport('gdpr')} disabled={loading}>
                Generate GDPR Report
              </Button>
              <Button onClick={() => handleGenerateReport('security')} disabled={loading}>
                Generate Security Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <Alert key={report.id}>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{report.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Period: {format(new Date(report.period_start), 'MMM d, yyyy')} - {format(new Date(report.period_end), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Generated: {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getReportStatusBadge(report.status)}
                      {report.status === 'ready' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}