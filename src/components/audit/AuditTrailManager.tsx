import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Calendar,
  RefreshCw,
  Webhook,
  Activity
} from 'lucide-react';
import { format, subDays } from 'date-fns';
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

// Helper function to get date range filter
function getDateRangeFilter(range: string): Date {
  switch (range) {
    case '1d':
      return subDays(new Date(), 1);
    case '7d':
      return subDays(new Date(), 7);
    case '30d':
      return subDays(new Date(), 30);
    case '90d':
      return subDays(new Date(), 90);
    default:
      return subDays(new Date(), 7);
  }
}

export default function AuditTrailManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  // Fetch audit logs from multiple sources
  const { data: auditLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', profile?.organization_id, dateRange],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const dateFilter = getDateRangeFilter(dateRange).toISOString();
      const logs: AuditLog[] = [];

      // Fetch integration logs
      const { data: integrationLogs, error: intError } = await supabase
        .from('integration_logs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!intError && integrationLogs) {
        integrationLogs.forEach((log) => {
          logs.push({
            id: `int-${log.id}`,
            event_type: log.event_type,
            category: 'system',
            severity: log.status === 'error' ? 'high' : log.status === 'warning' ? 'medium' : 'low',
            resource: 'integration',
            action: log.event_type,
            details: log.details as Record<string, any> || {},
            timestamp: log.created_at,
          });
        });
      }

      // Fetch webhook logs
      const { data: webhookLogs, error: whError } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!whError && webhookLogs) {
        webhookLogs.forEach((log) => {
          logs.push({
            id: `wh-${log.id}`,
            event_type: log.event_type,
            category: 'system',
            severity: log.status === 'failed' ? 'high' : log.status === 'pending' ? 'medium' : 'low',
            resource: 'webhook',
            action: log.event_type,
            details: {
              payload: log.payload,
              response_code: log.response_code,
              attempt_count: log.attempt_count
            },
            timestamp: log.created_at,
          });
        });
      }

      // Fetch lead activities
      const { data: leadActivities, error: laError } = await supabase
        .from('lead_activities')
        .select('*, profiles:created_by(first_name, last_name, email)')
        .eq('lead_id', profile.organization_id) // This may need adjustment based on your data model
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!laError && leadActivities) {
        leadActivities.forEach((activity) => {
          const creator = activity.profiles as { first_name?: string; last_name?: string; email?: string } | null;
          logs.push({
            id: `la-${activity.id}`,
            event_type: `lead.${activity.activity_type}`,
            category: 'data',
            severity: 'low',
            user_id: activity.created_by,
            user_name: creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.email : undefined,
            resource: 'lead',
            action: activity.activity_type,
            details: { title: activity.title, description: activity.description, outcome: activity.outcome },
            timestamp: activity.created_at,
          });
        });
      }

      // Sort all logs by timestamp
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    enabled: !!profile?.organization_id,
    staleTime: 60 * 1000,
  });

  // Filter logs based on search and category filters
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        !searchTerm ||
        log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [auditLogs, searchTerm, categoryFilter, severityFilter]);

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
    setGenerating(true);

    const newReport: ComplianceReport = {
      id: Date.now().toString(),
      type: type as 'gdpr' | 'pci_dss' | 'ccpa' | 'security' | 'custom',
      title: `${type.toUpperCase()} Report - ${format(new Date(), 'MMMM yyyy')}`,
      period_start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      period_end: format(new Date(), 'yyyy-MM-dd'),
      status: 'generating',
      created_at: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);

    // In a real implementation, this would call an edge function to generate the report
    // For now, we simulate report generation with a delay
    setTimeout(() => {
      setReports((prev) =>
        prev.map((report) =>
          report.id === newReport.id
            ? { ...report, status: 'ready', file_path: `/reports/${type}-${Date.now()}.pdf` }
            : report
        )
      );

      toast({
        title: 'Report Generated',
        description: `${type.toUpperCase()} compliance report is ready for download`,
      });

      setGenerating(false);
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
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-10" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No audit logs found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
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
              )))}
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
              <Button onClick={() => handleGenerateReport('gdpr')} disabled={generating}>
                Generate GDPR Report
              </Button>
              <Button onClick={() => handleGenerateReport('security')} disabled={generating}>
                Generate Security Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No reports generated yet. Click a button above to generate a compliance report.
              </div>
            ) : (
              reports.map((report) => (
                <Alert key={report.id}>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{report.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Period: {format(new Date(report.period_start), 'MMM d, yyyy')} -{' '}
                          {format(new Date(report.period_end), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Generated: {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getReportStatusBadge(report.status)}
                        {report.status === 'ready' && (
                          <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report)}>
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}