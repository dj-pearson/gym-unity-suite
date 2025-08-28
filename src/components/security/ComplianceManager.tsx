import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Shield, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  CreditCard,
  Globe,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';

interface ComplianceStandard {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  lastAudit: string;
  nextAudit: string;
  score: number;
  requirements: ComplianceRequirement[];
}

interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  status: 'met' | 'partial' | 'not_met';
  lastCheck: string;
  evidence?: string;
}

interface DataRequest {
  id: string;
  type: 'access' | 'deletion' | 'portability';
  memberName: string;
  memberEmail: string;
  requestDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
}

const COMPLIANCE_STANDARDS: ComplianceStandard[] = [
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation',
    status: 'compliant',
    lastAudit: new Date(Date.now() - 86400000 * 30).toISOString(),
    nextAudit: new Date(Date.now() + 86400000 * 335).toISOString(),
    score: 95,
    requirements: [
      {
        id: 'gdpr-1',
        name: 'Data Processing Records',
        description: 'Maintain records of all processing activities',
        status: 'met',
        lastCheck: new Date(Date.now() - 86400000 * 7).toISOString(),
        evidence: 'Processing register updated weekly'
      },
      {
        id: 'gdpr-2',
        name: 'Privacy Policy',
        description: 'Clear and accessible privacy policy',
        status: 'met',
        lastCheck: new Date(Date.now() - 86400000 * 14).toISOString(),
        evidence: 'Privacy policy v2.1 published'
      },
      {
        id: 'gdpr-3',
        name: 'Consent Management',
        description: 'Valid consent for data processing',
        status: 'partial',
        lastCheck: new Date(Date.now() - 86400000 * 3).toISOString(),
        evidence: 'Some legacy consents need updating'
      }
    ]
  },
  {
    id: 'pci_dss',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    status: 'compliant',
    lastAudit: new Date(Date.now() - 86400000 * 90).toISOString(),
    nextAudit: new Date(Date.now() + 86400000 * 275).toISOString(),
    score: 100,
    requirements: [
      {
        id: 'pci-1',
        name: 'Secure Network',
        description: 'Firewall configuration and secure transmission',
        status: 'met',
        lastCheck: new Date(Date.now() - 86400000).toISOString(),
        evidence: 'Quarterly security scan passed'
      },
      {
        id: 'pci-2',
        name: 'Cardholder Data Protection',
        description: 'Protect stored cardholder data',
        status: 'met',
        lastCheck: new Date(Date.now() - 86400000).toISOString(),
        evidence: 'No card data stored locally'
      }
    ]
  },
  {
    id: 'ccpa',
    name: 'CCPA',
    description: 'California Consumer Privacy Act',
    status: 'partial',
    lastAudit: new Date(Date.now() - 86400000 * 60).toISOString(),
    nextAudit: new Date(Date.now() + 86400000 * 305).toISOString(),
    score: 80,
    requirements: [
      {
        id: 'ccpa-1',
        name: 'Consumer Rights Notice',
        description: 'Inform consumers of their privacy rights',
        status: 'met',
        lastCheck: new Date(Date.now() - 86400000 * 21).toISOString(),
        evidence: 'Privacy notice updated for CCPA'
      },
      {
        id: 'ccpa-2',
        name: 'Data Deletion Requests',
        description: 'Process consumer deletion requests',
        status: 'partial',
        lastCheck: new Date(Date.now() - 86400000 * 5).toISOString(),
        evidence: 'Manual process, needs automation'
      }
    ]
  }
];

const DATA_REQUESTS: DataRequest[] = [
  {
    id: '1',
    type: 'access',
    memberName: 'Jane Smith',
    memberEmail: 'jane.smith@email.com',
    requestDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'pending',
    dueDate: new Date(Date.now() + 86400000 * 28).toISOString()
  },
  {
    id: '2',
    type: 'deletion',
    memberName: 'Robert Johnson',
    memberEmail: 'robert.j@email.com',
    requestDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'in_progress',
    dueDate: new Date(Date.now() + 86400000 * 25).toISOString()
  },
  {
    id: '3',
    type: 'portability',
    memberName: 'Maria Garcia',
    memberEmail: 'maria.garcia@email.com',
    requestDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: 'completed',
    dueDate: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

export default function ComplianceManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [standards, setStandards] = useState<ComplianceStandard[]>(COMPLIANCE_STANDARDS);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>(DATA_REQUESTS);
  const [loading, setLoading] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'met':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial':
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'non_compliant':
      case 'not_met':
      case 'pending':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      compliant: 'default',
      partial: 'secondary',
      non_compliant: 'destructive',
      met: 'default',
      not_met: 'destructive',
      pending: 'secondary',
      in_progress: 'secondary',
      completed: 'default'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getComplianceIcon = (standardId: string) => {
    switch (standardId) {
      case 'gdpr':
        return <Globe className="w-5 h-5 text-primary" />;
      case 'pci_dss':
        return <CreditCard className="w-5 h-5 text-primary" />;
      case 'ccpa':
        return <Shield className="w-5 h-5 text-primary" />;
      default:
        return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  const handleExportComplianceReport = async (standardId: string) => {
    setLoading(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Report Generated",
      description: "Compliance report has been downloaded successfully"
    });
    
    setLoading(false);
  };

  const handleProcessDataRequest = (requestId: string, action: 'approve' | 'reject') => {
    setDataRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, status: action === 'approve' ? 'in_progress' : 'completed' }
        : request
    ));

    toast({
      title: "Request Updated",
      description: `Data request has been ${action}d`
    });
  };

  const getOverallComplianceScore = () => {
    const totalScore = standards.reduce((sum, standard) => sum + standard.score, 0);
    return Math.round(totalScore / standards.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Management</h2>
          <p className="text-muted-foreground">
            Monitor compliance standards and manage data protection requirements
          </p>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Overall Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={getOverallComplianceScore()} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {getOverallComplianceScore()}% compliant across all standards
              </p>
            </div>
            <Badge variant={getOverallComplianceScore() >= 90 ? 'default' : 'secondary'}>
              {getOverallComplianceScore()}/100
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="standards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="standards">Compliance Standards</TabsTrigger>
          <TabsTrigger value="data-requests">Data Requests</TabsTrigger>
          <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="standards" className="space-y-4">
          {standards.map((standard) => (
            <Card key={standard.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getComplianceIcon(standard.id)}
                    <div>
                      <CardTitle className="text-lg">{standard.name}</CardTitle>
                      <CardDescription>{standard.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(standard.status)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExportComplianceReport(standard.id)}
                      disabled={loading}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Last Audit:</span>
                      <p className="text-muted-foreground">{format(new Date(standard.lastAudit), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Next Audit:</span>
                      <p className="text-muted-foreground">{format(new Date(standard.nextAudit), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Score:</span>
                      <p className="text-muted-foreground">{standard.score}/100</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Requirements Status:</h4>
                    <div className="space-y-2">
                      {standard.requirements.map((requirement) => (
                        <Alert key={requirement.id}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              {getStatusIcon(requirement.status)}
                              <div className="space-y-1">
                                <p className="font-medium text-sm">{requirement.name}</p>
                                <p className="text-xs text-muted-foreground">{requirement.description}</p>
                                {requirement.evidence && (
                                  <p className="text-xs text-green-600">{requirement.evidence}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Last checked: {format(new Date(requirement.lastCheck), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(requirement.status)}
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="data-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>
                Manage member data access, deletion, and portability requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataRequests.map((request) => (
                  <Alert key={request.id}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{request.type}</Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        <div>
                          <p className="font-medium">{request.memberName}</p>
                          <p className="text-sm text-muted-foreground">{request.memberEmail}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>Requested: {format(new Date(request.requestDate), 'MMM d, yyyy')}</p>
                          <p>Due: {format(new Date(request.dueDate), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleProcessDataRequest(request.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleProcessDataRequest(request.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-trail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Audit Trail</CardTitle>
              <CardDescription>
                View compliance-related activities and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4" />
                <p>Audit trail functionality will be implemented with production logging</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}