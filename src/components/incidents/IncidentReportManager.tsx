import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, AlertTriangle, FileText, Users, Calendar, Eye, Edit, FileX } from 'lucide-react';

interface IncidentReport {
  id: string;
  incident_date: string;
  incident_type: string;
  severity: string;
  description: string;
  injured_person_name: string;
  injured_person_type: string;
  actions_taken: string;
  medical_attention_required: boolean;
  medical_provider: string;
  follow_up_required: boolean;
  follow_up_date: string;
  insurance_notified: boolean;
  insurance_claim_number: string;
  status: string;
  resolved_at: string;
  resolution_notes: string;
  photos: string[];
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface InsuranceClaim {
  id: string;
  claim_number: string;
  insurance_company: string;
  claim_type: string;
  claim_amount: number;
  claim_status: string;
  filed_date: string;
  settlement_amount: number;
  settlement_date: string;
  incident_reports: {
    incident_date: string;
    description: string;
  };
}

export default function IncidentReportManager() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('incidents');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [isAddIncidentOpen, setIsAddIncidentOpen] = useState(false);
  const [isViewIncidentOpen, setIsViewIncidentOpen] = useState(false);
  const [incidentType, setIncidentType] = useState('accident');
  const [severity, setSeverity] = useState('minor');
  const [description, setDescription] = useState('');
  const [injuredPersonName, setInjuredPersonName] = useState('');
  const [injuredPersonType, setInjuredPersonType] = useState('member');
  const [actionsTaken, setActionsTaken] = useState('');
  const [medicalAttentionRequired, setMedicalAttentionRequired] = useState(false);
  const [medicalProvider, setMedicalProvider] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [insuranceNotified, setInsuranceNotified] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserOrganization();
      fetchIncidents();
      fetchClaims();
    }
  }, [user]);

  const fetchUserOrganization = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user?.id)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
    } else {
      setOrganizationId(data.organization_id);
    }
  };

  const fetchIncidents = async () => {
    const { data, error } = await supabase
      .from('incident_reports')
      .select(`
        *,
        profiles!incident_reports_reported_by_fkey (
          first_name,
          last_name
        )
      `)
      .order('incident_date', { ascending: false });

    if (error) {
      console.error('Error fetching incidents:', error);
    } else {
      setIncidents((data as any) || []);
    }
  };

  const fetchClaims = async () => {
    const { data, error } = await supabase
      .from('insurance_claims')
      .select(`
        *,
        incident_reports (
          incident_date,
          description
        )
      `)
      .order('filed_date', { ascending: false });

    if (error) {
      console.error('Error fetching claims:', error);
    } else {
      setClaims((data as any) || []);
    }
  };

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !organizationId) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from('incident_reports')
      .insert({
        organization_id: organizationId,
        reported_by: user?.id,
        incident_date: new Date().toISOString(),
        incident_type: incidentType,
        severity: severity,
        description: description,
        injured_person_name: injuredPersonName || null,
        injured_person_type: injuredPersonType,
        actions_taken: actionsTaken || null,
        medical_attention_required: medicalAttentionRequired,
        medical_provider: medicalProvider || null,
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate || null,
        insurance_notified: insuranceNotified,
        status: 'open'
      });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create incident report",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Incident report created successfully",
      });
      
      // Reset form
      setDescription('');
      setInjuredPersonName('');
      setActionsTaken('');
      setMedicalProvider('');
      setFollowUpDate('');
      setIncidentType('accident');
      setSeverity('minor');
      setInjuredPersonType('member');
      setMedicalAttentionRequired(false);
      setFollowUpRequired(false);
      setInsuranceNotified(false);
      setIsAddIncidentOpen(false);
      
      // Refresh data
      fetchIncidents();
    }
  };

  const handleCloseIncident = async (incidentId: string) => {
    const { error } = await supabase
      .from('incident_reports')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id
      })
      .eq('id', incidentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to close incident",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Incident closed successfully",
      });
      fetchIncidents();
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      'minor': <Badge variant="default">Minor</Badge>,
      'moderate': <Badge variant="secondary">Moderate</Badge>,
      'serious': <Badge variant="destructive">Serious</Badge>,
      'critical': <Badge className="bg-red-600">Critical</Badge>
    };
    return badges[severity as keyof typeof badges] || <Badge variant="outline">{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'open': <Badge variant="destructive">Open</Badge>,
      'investigating': <Badge variant="secondary">Investigating</Badge>,
      'resolved': <Badge variant="default">Resolved</Badge>,
      'closed': <Badge variant="outline">Closed</Badge>
    };
    return badges[status as keyof typeof badges] || <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate stats
  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
  const criticalIncidents = incidents.filter(i => i.severity === 'serious' || i.severity === 'critical').length;
  const medicalIncidents = incidents.filter(i => i.medical_attention_required).length;
  const totalClaimAmount = claims.reduce((sum, claim) => sum + (claim.claim_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Incidents</p>
                <p className="text-2xl font-bold">{totalIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Open Cases</p>
                <p className="text-2xl font-bold">{openIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{criticalIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Medical Attn</p>
                <p className="text-2xl font-bold">{medicalIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileX className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Insurance Claims</p>
                <p className="text-xl font-bold">{formatCurrency(totalClaimAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="incidents">Incident Reports</TabsTrigger>
            <TabsTrigger value="claims">Insurance Claims</TabsTrigger>
            <TabsTrigger value="investigations">Investigations</TabsTrigger>
          </TabsList>

          {activeTab === 'incidents' && (
            <Dialog open={isAddIncidentOpen} onOpenChange={setIsAddIncidentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Report Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Incident Report</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddIncident} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="incidentType">Incident Type</Label>
                      <Select value={incidentType} onValueChange={setIncidentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accident">Accident</SelectItem>
                          <SelectItem value="injury">Injury</SelectItem>
                          <SelectItem value="equipment">Equipment Failure</SelectItem>
                          <SelectItem value="property">Property Damage</SelectItem>
                          <SelectItem value="theft">Theft/Security</SelectItem>
                          <SelectItem value="complaint">Complaint</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="severity">Severity Level</Label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="serious">Serious</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Incident Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      placeholder="Describe what happened in detail..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="injuredPersonName">Injured Person Name</Label>
                      <Input
                        id="injuredPersonName"
                        value={injuredPersonName}
                        onChange={(e) => setInjuredPersonName(e.target.value)}
                        placeholder="If applicable"
                      />
                    </div>

                    <div>
                      <Label htmlFor="injuredPersonType">Person Type</Label>
                      <Select value={injuredPersonType} onValueChange={setInjuredPersonType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="visitor">Visitor</SelectItem>
                          <SelectItem value="contractor">Contractor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="actionsTaken">Immediate Actions Taken</Label>
                    <Textarea
                      id="actionsTaken"
                      value={actionsTaken}
                      onChange={(e) => setActionsTaken(e.target.value)}
                      rows={3}
                      placeholder="What actions were taken immediately after the incident?"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="medicalAttention"
                        checked={medicalAttentionRequired}
                        onCheckedChange={(checked) => setMedicalAttentionRequired(checked as boolean)}
                      />
                      <Label htmlFor="medicalAttention">Medical attention required</Label>
                    </div>

                    {medicalAttentionRequired && (
                      <div>
                        <Label htmlFor="medicalProvider">Medical Provider/Facility</Label>
                        <Input
                          id="medicalProvider"
                          value={medicalProvider}
                          onChange={(e) => setMedicalProvider(e.target.value)}
                          placeholder="Hospital, clinic, or medical provider"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="followUpRequired"
                        checked={followUpRequired}
                        onCheckedChange={(checked) => setFollowUpRequired(checked as boolean)}
                      />
                      <Label htmlFor="followUpRequired">Follow-up required</Label>
                    </div>

                    {followUpRequired && (
                      <div>
                        <Label htmlFor="followUpDate">Follow-up Date</Label>
                        <Input
                          id="followUpDate"
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="insuranceNotified"
                        checked={insuranceNotified}
                        onCheckedChange={(checked) => setInsuranceNotified(checked as boolean)}
                      />
                      <Label htmlFor="insuranceNotified">Insurance company notified</Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Report..." : "Create Incident Report"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{incident.incident_type}</h3>
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {incident.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Date: {formatDate(incident.incident_date)}</span>
                        {incident.injured_person_name && (
                          <span>Injured: {incident.injured_person_name}</span>
                        )}
                        {incident.medical_attention_required && (
                          <span className="text-red-600">Medical Attention</span>
                        )}
                        {incident.insurance_notified && (
                          <span className="text-blue-600">Insurance Notified</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIncident(incident);
                          setIsViewIncidentOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {incident.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseIncident(incident.id)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {incidents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No incident reports filed yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Claim #{claim.claim_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {claim.insurance_company} • {claim.claim_type}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Filed: {formatDate(claim.filed_date)} • Amount: {formatCurrency(claim.claim_amount || 0)}
                      </div>
                      {claim.settlement_amount && (
                        <div className="text-sm text-green-600">
                          Settled: {formatCurrency(claim.settlement_amount)} on {formatDate(claim.settlement_date)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        claim.claim_status === 'settled' ? 'default' :
                        claim.claim_status === 'denied' ? 'destructive' : 'secondary'
                      }>
                        {claim.claim_status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {claims.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No insurance claims filed yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investigations">
          <Card>
            <CardHeader>
              <CardTitle>Incident Investigations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Investigation tracking coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Incident Dialog */}
      <Dialog open={isViewIncidentOpen} onOpenChange={setIsViewIncidentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incident Report Details</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Incident Type</Label>
                  <p className="text-sm">{selectedIncident.incident_type}</p>
                </div>
                <div>
                  <Label>Severity</Label>
                  <div>{getSeverityBadge(selectedIncident.severity)}</div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedIncident.description}</p>
              </div>

              {selectedIncident.injured_person_name && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Injured Person</Label>
                    <p className="text-sm">{selectedIncident.injured_person_name}</p>
                  </div>
                  <div>
                    <Label>Person Type</Label>
                    <p className="text-sm">{selectedIncident.injured_person_type}</p>
                  </div>
                </div>
              )}

              {selectedIncident.actions_taken && (
                <div>
                  <Label>Actions Taken</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedIncident.actions_taken}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Medical Attention</Label>
                  <p className="text-sm">{selectedIncident.medical_attention_required ? 'Yes' : 'No'}</p>
                  {selectedIncident.medical_provider && (
                    <p className="text-xs text-muted-foreground">{selectedIncident.medical_provider}</p>
                  )}
                </div>
                <div>
                  <Label>Insurance Notified</Label>
                  <p className="text-sm">{selectedIncident.insurance_notified ? 'Yes' : 'No'}</p>
                  {selectedIncident.insurance_claim_number && (
                    <p className="text-xs text-muted-foreground">Claim: {selectedIncident.insurance_claim_number}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedIncident.status)}</div>
                </div>
                <div>
                  <Label>Date Reported</Label>
                  <p className="text-sm">{formatDateTime(selectedIncident.incident_date)}</p>
                </div>
              </div>

              {selectedIncident.resolution_notes && (
                <div>
                  <Label>Resolution Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedIncident.resolution_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}