import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Edit, 
  AlertTriangle, 
  Shield, 
  Calendar,
  User,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface IncidentReport {
  id: string;
  location_id?: string;
  reported_by: string;
  incident_date: string;
  incident_type: string;
  severity: string;
  description: string;
  injured_person_name?: string;
  injured_person_type?: string;
  actions_taken?: string;
  medical_attention_required: boolean;
  medical_provider?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  insurance_notified: boolean;
  insurance_claim_number?: string;
  status: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  locations?: {
    name: string;
  } | null;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Location {
  id: string;
  name: string;
}

export default function IncidentReports() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);

  const [formData, setFormData] = useState({
    location_id: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: new Date().toTimeString().slice(0, 5),
    incident_type: 'injury',
    severity: 'minor',
    description: '',
    injured_person_name: '',
    injured_person_type: 'member',
    actions_taken: '',
    medical_attention_required: false,
    medical_provider: '',
    follow_up_required: false,
    follow_up_date: '',
    insurance_notified: false,
    insurance_claim_number: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Fetch incident reports with location and reporter info
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incident_reports')
        .select(`
          *,
          locations:location_id (
            name
          ),
          profiles:reported_by (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('incident_date', { ascending: false });

      if (incidentsError) throw incidentsError;

      // Fetch locations for dropdown
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      if (locationsError) throw locationsError;

      setIncidents((incidentsData || []).map(incident => {
        const locations = incident.locations && 
          typeof incident.locations === 'object' && 
          incident.locations !== null && 
          !Array.isArray(incident.locations) &&
          'name' in incident.locations ? incident.locations : null;
        
        const profiles = incident.profiles && 
          typeof incident.profiles === 'object' && 
          incident.profiles !== null && 
          !Array.isArray(incident.profiles) &&
          'first_name' in incident.profiles ? incident.profiles : null;
        
        return {
          ...incident,
          locations,
          profiles
        };
      }));
      setLocations(locationsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch incident reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    try {
      const incidentDateTime = `${formData.incident_date}T${formData.incident_time}:00`;
      
      const incidentData = {
        organization_id: profile.organization_id,
        reported_by: profile.id,
        location_id: formData.location_id || null,
        incident_date: incidentDateTime,
        incident_type: formData.incident_type,
        severity: formData.severity,
        description: formData.description,
        injured_person_name: formData.injured_person_name || null,
        injured_person_type: formData.injured_person_type || null,
        actions_taken: formData.actions_taken || null,
        medical_attention_required: formData.medical_attention_required,
        medical_provider: formData.medical_provider || null,
        follow_up_required: formData.follow_up_required,
        follow_up_date: formData.follow_up_date || null,
        insurance_notified: formData.insurance_notified,
        insurance_claim_number: formData.insurance_claim_number || null
      };

      let error;
      if (editingIncident) {
        const { error: updateError } = await supabase
          .from('incident_reports')
          .update(incidentData)
          .eq('id', editingIncident.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('incident_reports')
          .insert([incidentData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingIncident ? "Incident Updated" : "Incident Reported",
        description: `Incident report has been ${editingIncident ? 'updated' : 'submitted'} successfully.`
      });

      setShowAddDialog(false);
      setEditingIncident(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving incident:', error);
      toast({
        title: "Error",
        description: "Failed to save incident report",
        variant: "destructive"
      });
    }
  };

  const handleResolveIncident = async (incident: IncidentReport) => {
    const resolutionNotes = prompt("Enter resolution notes:");
    if (!resolutionNotes) return;

    try {
      const { error } = await supabase
        .from('incident_reports')
        .update({
          status: 'resolved',
          resolved_by: profile?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', incident.id);

      if (error) throw error;

      toast({
        title: "Incident Resolved",
        description: "Incident has been marked as resolved."
      });

      fetchData();
    } catch (error) {
      console.error('Error resolving incident:', error);
      toast({
        title: "Error",
        description: "Failed to resolve incident",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      location_id: '',
      incident_date: new Date().toISOString().split('T')[0],
      incident_time: new Date().toTimeString().slice(0, 5),
      incident_type: 'injury',
      severity: 'minor',
      description: '',
      injured_person_name: '',
      injured_person_type: 'member',
      actions_taken: '',
      medical_attention_required: false,
      medical_provider: '',
      follow_up_required: false,
      follow_up_date: '',
      insurance_notified: false,
      insurance_claim_number: ''
    });
  };

  const getSeverityBadge = (severity: string) => {
    const severities = {
      minor: { label: 'Minor', variant: 'outline' as const, color: 'text-blue-600' },
      moderate: { label: 'Moderate', variant: 'secondary' as const, color: 'text-yellow-600' },
      major: { label: 'Major', variant: 'destructive' as const, color: 'text-orange-600' },
      critical: { label: 'Critical', variant: 'destructive' as const, color: 'text-red-600' }
    };

    const config = severities[severity as keyof typeof severities] || severities.minor;
    return (
      <Badge variant={config.variant} className={`${config.color}`}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statuses = {
      open: { label: 'Open', variant: 'destructive' as const, icon: XCircle },
      investigating: { label: 'Investigating', variant: 'secondary' as const, icon: Clock },
      resolved: { label: 'Resolved', variant: 'outline' as const, icon: CheckCircle },
      closed: { label: 'Closed', variant: 'outline' as const, icon: CheckCircle }
    };

    const config = statuses[status as keyof typeof statuses] || statuses.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getIncidentTypeBadge = (type: string) => {
    const types = {
      injury: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      equipment_malfunction: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      property_damage: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      safety_violation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <Badge variant="outline" className={types[type as keyof typeof types] || types.other}>
        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.injured_person_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  if (loading) {
    return <div className="flex justify-center p-4">Loading incident reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingIncident(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {editingIncident ? 'Edit Incident Report' : 'Report New Incident'}
              </DialogTitle>
              <DialogDescription>
                {editingIncident ? 'Update incident details' : 'Complete this form to report a safety incident'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_id">Location</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incident_type">Incident Type *</Label>
                  <Select
                    value={formData.incident_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, incident_type: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="injury">Injury</SelectItem>
                      <SelectItem value="equipment_malfunction">Equipment Malfunction</SelectItem>
                      <SelectItem value="property_damage">Property Damage</SelectItem>
                      <SelectItem value="safety_violation">Safety Violation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incident_date">Date *</Label>
                  <Input
                    id="incident_date"
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, incident_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incident_time">Time *</Label>
                  <Input
                    id="incident_time"
                    type="time"
                    value={formData.incident_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, incident_time: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="injured_person_type">Injured Person Type</Label>
                  <Select
                    value={formData.injured_person_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, injured_person_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="injured_person_name">Injured Person Name</Label>
                  <Input
                    id="injured_person_name"
                    value={formData.injured_person_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, injured_person_name: e.target.value }))}
                    placeholder="Full name of the injured person"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of what happened..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actions_taken">Immediate Actions Taken</Label>
                <Textarea
                  id="actions_taken"
                  value={formData.actions_taken}
                  onChange={(e) => setFormData(prev => ({ ...prev, actions_taken: e.target.value }))}
                  placeholder="What immediate actions were taken..."
                  rows={3}
                />
              </div>

              {/* Medical Attention Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Medical Information</h4>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medical_attention_required"
                    checked={formData.medical_attention_required}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, medical_attention_required: checked as boolean }))
                    }
                  />
                  <Label htmlFor="medical_attention_required">Medical attention required</Label>
                </div>

                {formData.medical_attention_required && (
                  <div className="space-y-2">
                    <Label htmlFor="medical_provider">Medical Provider</Label>
                    <Input
                      id="medical_provider"
                      value={formData.medical_provider}
                      onChange={(e) => setFormData(prev => ({ ...prev, medical_provider: e.target.value }))}
                      placeholder="Hospital, clinic, or medical provider"
                    />
                  </div>
                )}
              </div>

              {/* Follow-up Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Follow-up & Insurance</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="follow_up_required"
                      checked={formData.follow_up_required}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, follow_up_required: checked as boolean }))
                      }
                    />
                    <Label htmlFor="follow_up_required">Follow-up required</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance_notified"
                      checked={formData.insurance_notified}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, insurance_notified: checked as boolean }))
                      }
                    />
                    <Label htmlFor="insurance_notified">Insurance notified</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.follow_up_required && (
                    <div className="space-y-2">
                      <Label htmlFor="follow_up_date">Follow-up Date</Label>
                      <Input
                        id="follow_up_date"
                        type="date"
                        value={formData.follow_up_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                      />
                    </div>
                  )}

                  {formData.insurance_notified && (
                    <div className="space-y-2">
                      <Label htmlFor="insurance_claim_number">Claim Number</Label>
                      <Input
                        id="insurance_claim_number"
                        value={formData.insurance_claim_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, insurance_claim_number: e.target.value }))}
                        placeholder="Insurance claim number"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIncident ? 'Update Report' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Reports ({filteredIncidents.length})</CardTitle>
          <CardDescription>
            Track and manage safety incidents and follow-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterStatus !== 'all' || filterSeverity !== 'all'
                ? 'No incidents found matching your filters.' 
                : 'No incident reports yet. Safety first!'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident Details</TableHead>
                  <TableHead>Date & Location</TableHead>
                  <TableHead>Type & Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium line-clamp-2">{incident.description}</div>
                        {incident.injured_person_name && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {incident.injured_person_name} ({incident.injured_person_type})
                          </div>
                        )}
                        {incident.profiles && (
                          <div className="text-xs text-muted-foreground">
                            Reported by: {incident.profiles.first_name} {incident.profiles.last_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(incident.incident_date), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {incident.locations && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {incident.locations.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getIncidentTypeBadge(incident.incident_type)}
                        {getSeverityBadge(incident.severity)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(incident.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {incident.medical_attention_required && (
                          <Badge variant="outline" className="text-red-600">
                            Medical Attention
                          </Badge>
                        )}
                        {incident.follow_up_required && incident.follow_up_date && (
                          <div className="text-xs text-muted-foreground">
                            Follow-up: {format(new Date(incident.follow_up_date), 'MMM dd')}
                          </div>
                        )}
                        {incident.insurance_notified && (
                          <Badge variant="outline" className="text-blue-600">
                            Insurance Notified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {incident.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveIncident(incident)}
                          >
                            Resolve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle viewing/editing incident details
                            toast({
                              title: "Feature Coming Soon",
                              description: "Incident details view will be available soon."
                            });
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}