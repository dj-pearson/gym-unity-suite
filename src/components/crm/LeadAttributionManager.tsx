import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Users, 
  CheckCircle, 
  XCircle,
  Clock,
  FileText,
  User,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LeadAttributionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeadAttributionManager: React.FC<LeadAttributionManagerProps> = ({
  isOpen,
  onClose
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('disputes');
  
  const [disputes, setDisputes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  
  // Dispute form
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [disputeForm, setDisputeForm] = useState({
    dispute_reason: '',
    evidence: ''
  });

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isOpen && profile?.organization_id) {
      fetchData();
    }
  }, [isOpen, profile?.organization_id]);

  const fetchData = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    try {
      // Fetch disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from('lead_attribution_disputes')
        .select(`
          *,
          lead:lead_id(first_name, last_name, email, phone),
          disputing_salesperson:disputing_salesperson_id(first_name, last_name, email),
          current_salesperson:current_salesperson_id(first_name, last_name, email),
          reviewer:reviewed_by(first_name, last_name, email)
        `)
        .in('lead_id', (
          await supabase
            .from('leads')
            .select('id')
            .eq('organization_id', profile.organization_id)
        ).data?.map(l => l.id) || []);

      if (disputesError) throw disputesError;
      setDisputes(disputesData || []);

      // Fetch leads with potential attribution issues
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          entered_by:entered_by(first_name, last_name, email),
          assigned_salesperson:assigned_salesperson(first_name, last_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .in('attribution_status', ['disputed', 'pending_approval']);

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      // Fetch salespeople
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('organization_id', profile.organization_id)
        .in('role', ['staff', 'manager', 'owner']);

      if (staffError) throw staffError;
      setSalespeople(staffData || []);

    } catch (error) {
      console.error('Error fetching attribution data:', error);
      toast.error('Failed to load attribution data');
    } finally {
      setLoading(false);
    }
  };

  const createDispute = async (leadId: string) => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lead_attribution_disputes')
        .insert({
          lead_id: leadId,
          disputing_salesperson_id: profile.id,
          current_salesperson_id: selectedLead?.assigned_salesperson?.id,
          dispute_reason: disputeForm.dispute_reason,
          evidence: disputeForm.evidence,
          status: 'pending'
        });

      if (error) throw error;

      // Update lead status
      await supabase
        .from('leads')
        .update({ attribution_status: 'disputed' })
        .eq('id', leadId);

      toast.success('Attribution dispute created successfully');
      setShowDisputeForm(false);
      setDisputeForm({ dispute_reason: '', evidence: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error('Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (disputeId: string, status: 'approved' | 'rejected', resolutionNotes: string, newSalespersonId?: string) => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lead_attribution_disputes')
        .update({
          status,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', disputeId);

      if (error) throw error;

      // If approved, update the lead assignment and status
      if (status === 'approved') {
        const dispute = disputes.find(d => d.id === disputeId);
        if (dispute) {
          await supabase
            .from('leads')
            .update({
              assigned_salesperson: newSalespersonId || dispute.disputing_salesperson_id,
              attribution_status: 'confirmed'
            })
            .eq('id', dispute.lead_id);
        }
      } else {
        // If rejected, mark as confirmed
        const dispute = disputes.find(d => d.id === disputeId);
        if (dispute) {
          await supabase
            .from('leads')
            .update({ attribution_status: 'confirmed' })
            .eq('id', dispute.lead_id);
        }
      }

      toast.success(`Dispute ${status} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  const reassignLead = async (leadId: string, newSalespersonId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          assigned_salesperson: newSalespersonId,
          attribution_status: 'confirmed'
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead reassigned successfully');
      fetchData();
    } catch (error) {
      console.error('Error reassigning lead:', error);
      toast.error('Failed to reassign lead');
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = searchTerm === '' || 
      dispute.lead?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.lead?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.lead?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Lead Attribution Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="disputes">Attribution Disputes</TabsTrigger>
            <TabsTrigger value="reassign">Manual Reassignment</TabsTrigger>
          </TabsList>

          <TabsContent value="disputes" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search disputes by lead name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Disputes Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Current Assignment</TableHead>
                      <TableHead>Disputing Salesperson</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {dispute.lead?.first_name} {dispute.lead?.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {dispute.lead?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dispute.current_salesperson ? (
                            <div>
                              {dispute.current_salesperson.first_name} {dispute.current_salesperson.last_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            {dispute.disputing_salesperson.first_name} {dispute.disputing_salesperson.last_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm truncate">{dispute.dispute_reason}</p>
                            {dispute.evidence && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Evidence provided
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(dispute.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {dispute.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => resolveDispute(dispute.id, 'approved', 'Dispute approved by manager', dispute.disputing_salesperson_id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveDispute(dispute.id, 'rejected', 'Dispute rejected by manager')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {dispute.status !== 'pending' && dispute.reviewer && (
                            <div className="text-sm text-muted-foreground">
                              Reviewed by {dispute.reviewer.first_name} {dispute.reviewer.last_name}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredDisputes.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No attribution disputes found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reassign" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Lead Reassignment</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Reassign leads to different salespeople when attribution needs to be corrected
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Current Assignment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {lead.first_name} {lead.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {lead.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.assigned_salesperson ? (
                            <div>
                              {lead.assigned_salesperson.first_name} {lead.assigned_salesperson.last_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lead.attribution_status === 'confirmed' ? 'default' : 'secondary'}>
                            {lead.attribution_status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) => reassignLead(lead.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Reassign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              {salespeople.map((person) => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.first_name} {person.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {leads.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No leads requiring attribution review
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dispute Form Dialog */}
        <Dialog open={showDisputeForm} onOpenChange={setShowDisputeForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Attribution Dispute</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dispute Reason</Label>
                <Select
                  value={disputeForm.dispute_reason}
                  onValueChange={(value) => setDisputeForm(prev => ({ ...prev, dispute_reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duplicate_lead">Duplicate Lead</SelectItem>
                    <SelectItem value="name_similarity">Similar Name/Information</SelectItem>
                    <SelectItem value="prior_contact">Had Prior Contact</SelectItem>
                    <SelectItem value="referral_attribution">Referral Attribution</SelectItem>
                    <SelectItem value="data_entry_error">Data Entry Error</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Evidence/Details</Label>
                <Textarea
                  value={disputeForm.evidence}
                  onChange={(e) => setDisputeForm(prev => ({ ...prev, evidence: e.target.value }))}
                  placeholder="Provide details and evidence to support your dispute..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDisputeForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => selectedLead && createDispute(selectedLead.id)}
                  disabled={!disputeForm.dispute_reason || loading}
                >
                  Submit Dispute
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};