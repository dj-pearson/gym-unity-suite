import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Clock, CheckCircle, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface SafetyViolation {
  id: string;
  violation_type: string;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  immediate_action_taken: string | null;
  corrective_action_required: string | null;
  assigned_to: string | null;
  target_resolution_date: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  equipment: {
    name: string;
    equipment_type: string;
  };
  assignee: {
    first_name: string;
    last_name: string;
  } | null;
  creator: {
    first_name: string;
    last_name: string;
  };
}

export function SafetyViolationManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedViolation, setSelectedViolation] = useState<SafetyViolation | null>(null);
  const [resolutionForm, setResolutionForm] = useState({
    resolution_notes: '',
    follow_up_required: false,
    follow_up_date: '',
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: violations, isLoading } = useQuery({
    queryKey: ['safety-violations'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('safety_violations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Simplified - return basic data for now  
      return data?.map(violation => ({
        ...violation,
        severity_level: violation.severity_level as 'low' | 'medium' | 'high' | 'critical',
        status: violation.status as 'open' | 'in_progress' | 'resolved' | 'closed',
        equipment: { name: 'Equipment', equipment_type: 'cardio' },
        assignee: null,
        creator: { first_name: 'Staff', last_name: 'Member' }
      })) || [];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('organization_id', profile.organization_id)
        .in('role', ['staff', 'manager', 'owner'])
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const updateViolationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('safety_violations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-violations'] });
      toast.success('Violation updated successfully');
      setSelectedViolation(null);
    },
  });

  const resolveViolationMutation = useMutation({
    mutationFn: async (violationId: string) => {
      const { data, error } = await supabase
        .from('safety_violations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionForm.resolution_notes,
          follow_up_required: resolutionForm.follow_up_required,
          follow_up_date: resolutionForm.follow_up_date || null,
        })
        .eq('id', violationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-violations'] });
      toast.success('Violation resolved successfully');
      setSelectedViolation(null);
      setResolutionForm({
        resolution_notes: '',
        follow_up_required: false,
        follow_up_date: '',
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const violationTypes = [
    'Equipment Malfunction',
    'Safety Guard Missing',
    'Improper Maintenance',
    'Electrical Hazard',
    'Structural Damage',
    'User Safety Risk',
    'Fire Safety',
    'Emergency Equipment',
    'Accessibility Issue',
    'Other Safety Concern'
  ];

  const criticalViolations = violations?.filter(v => v.severity_level === 'critical' && v.status === 'open') || [];
  const openViolations = violations?.filter(v => v.status === 'open') || [];
  const overdueViolations = violations?.filter(v => 
    v.status === 'open' && 
    v.target_resolution_date && 
    new Date(v.target_resolution_date) < new Date()
  ) || [];

  if (isLoading) {
    return <div>Loading safety violations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalViolations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-orange-600">{openViolations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-yellow-600">{overdueViolations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {violations?.filter(v => v.status === 'resolved').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Violations Alert */}
      {criticalViolations.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Critical Safety Violations Require Immediate Attention
            </CardTitle>
            <CardDescription className="text-red-600">
              {criticalViolations.length} critical violation(s) must be addressed immediately for safety compliance.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Violations List */}
      <div className="grid gap-4">
        {violations?.map((violation) => (
          <Card key={violation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{violation.equipment.name}</CardTitle>
                    <Badge className={getSeverityColor(violation.severity_level)}>
                      {getSeverityIcon(violation.severity_level)}
                      <span className="ml-1 capitalize">{violation.severity_level}</span>
                    </Badge>
                  </div>
                  <CardDescription>
                    {violation.equipment.equipment_type} • {violation.violation_type}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(violation.status)}>
                    {getStatusIcon(violation.status)}
                    <span className="ml-1 capitalize">{violation.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{violation.description}</p>
                </div>

                {violation.immediate_action_taken && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Immediate Action Taken</p>
                    <p className="text-sm">{violation.immediate_action_taken}</p>
                  </div>
                )}

                {violation.corrective_action_required && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Corrective Action Required</p>
                    <p className="text-sm">{violation.corrective_action_required}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(violation.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {violation.creator.first_name} {violation.creator.last_name}
                    </p>
                  </div>

                  {violation.assignee && (
                    <div>
                      <p className="text-muted-foreground">Assigned To</p>
                      <p className="font-medium">
                        {violation.assignee.first_name} {violation.assignee.last_name}
                      </p>
                    </div>
                  )}

                  {violation.target_resolution_date && (
                    <div>
                      <p className="text-muted-foreground">Target Resolution</p>
                      <p className="font-medium">
                        {new Date(violation.target_resolution_date).toLocaleDateString()}
                      </p>
                      {new Date(violation.target_resolution_date) < new Date() && violation.status === 'open' && (
                        <Badge variant="destructive" className="text-xs mt-1">Overdue</Badge>
                      )}
                    </div>
                  )}
                </div>

                {violation.resolved_at && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-800">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="font-medium">Resolved on {new Date(violation.resolved_at).toLocaleDateString()}</span>
                    </div>
                    {violation.resolution_notes && (
                      <p className="text-sm text-green-600 mt-1">{violation.resolution_notes}</p>
                    )}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">View Details</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Safety Violation Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Full violation details here */}
                        <div className="grid gap-4">
                          <div>
                            <Label>Equipment</Label>
                            <p className="text-sm">{violation.equipment.name} ({violation.equipment.equipment_type})</p>
                          </div>
                          
                          <div>
                            <Label>Violation Type</Label>
                            <p className="text-sm">{violation.violation_type}</p>
                          </div>
                          
                          <div>
                            <Label>Description</Label>
                            <p className="text-sm">{violation.description}</p>
                          </div>

                          {violation.immediate_action_taken && (
                            <div>
                              <Label>Immediate Action Taken</Label>
                              <p className="text-sm">{violation.immediate_action_taken}</p>
                            </div>
                          )}

                          {violation.corrective_action_required && (
                            <div>
                              <Label>Corrective Action Required</Label>
                              <p className="text-sm">{violation.corrective_action_required}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {violation.status === 'open' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedViolation(violation)}>
                          Update Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Violation Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select 
                              defaultValue={violation.status}
                              onValueChange={(value) => 
                                updateViolationMutation.mutate({
                                  id: violation.id,
                                  updates: { status: value }
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="assigned_to">Assign To</Label>
                            <Select 
                              value={violation.assigned_to || ''}
                              onValueChange={(value) => 
                                updateViolationMutation.mutate({
                                  id: violation.id,
                                  updates: { assigned_to: value }
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select staff member" />
                              </SelectTrigger>
                              <SelectContent>
                                {staff?.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {(violation.status === 'open' || violation.status === 'in_progress') && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="default">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolve Safety Violation</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="resolution_notes">Resolution Notes</Label>
                            <Textarea
                              id="resolution_notes"
                              value={resolutionForm.resolution_notes}
                              onChange={(e) => setResolutionForm(prev => ({ ...prev, resolution_notes: e.target.value }))}
                              placeholder="Describe how this violation was resolved..."
                              className="min-h-[100px]"
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedViolation(null)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => resolveViolationMutation.mutate(violation.id)}
                              disabled={!resolutionForm.resolution_notes.trim()}
                            >
                              Mark as Resolved
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}