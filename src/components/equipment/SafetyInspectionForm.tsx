import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Camera, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SafetyInspectionFormProps {
  inspection?: any;
  onClose: () => void;
}

export function SafetyInspectionForm({ inspection, onClose }: SafetyInspectionFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    equipment_id: inspection?.equipment_id || '',
    checklist_id: inspection?.checklist_id || '',
    inspector_id: inspection?.inspector_id || user?.id || '',
    scheduled_date: inspection?.scheduled_date || new Date().toISOString().split('T')[0],
    inspection_notes: inspection?.inspection_notes || '',
    recommendations: inspection?.recommendations || '',
  });
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [inspectionResults, setInspectionResults] = useState<Record<string, any>>({});

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

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, equipment_type, status')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const { data: checklists } = useQuery({
    queryKey: ['inspection-checklists'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('inspection_checklists')
        .select('id, checklist_name, equipment_type, description')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('checklist_name');
      if (error) throw error;
      return data;
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

  // Load checklist items when checklist is selected
  useEffect(() => {
    if (formData.checklist_id) {
      const loadChecklistItems = async () => {
        const { data, error } = await supabase
          .from('inspection_checklist_items')
          .select('*')
          .eq('checklist_id', formData.checklist_id)
          .order('item_number');
        
        if (error) {
          toast.error('Failed to load checklist items');
          return;
        }
        
        setChecklistItems(data || []);
      };
      loadChecklistItems();
    }
  }, [formData.checklist_id]);

  // Load existing inspection results if editing
  useEffect(() => {
    if (inspection?.id) {
      const loadInspectionResults = async () => {
        const { data, error } = await supabase
          .from('inspection_results')
          .select('*')
          .eq('inspection_id', inspection.id);
        
        if (error) return;
        
        const resultsMap = data?.reduce((acc, result) => {
          acc[result.checklist_item_id] = result;
          return acc;
        }, {} as Record<string, any>) || {};
        
        setInspectionResults(resultsMap);
      };
      loadInspectionResults();
    }
  }, [inspection?.id]);

  const saveInspectionMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('Organization not found');

      let inspectionId = inspection?.id;

      // Create or update inspection
      if (inspectionId) {
        const { error } = await supabase
          .from('safety_inspections')
          .update({
            ...formData,
            organization_id: profile.organization_id,
          })
          .eq('id', inspectionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('safety_inspections')
          .insert({
            ...formData,
            organization_id: profile.organization_id,
          })
          .select()
          .single();
        if (error) throw error;
        inspectionId = data.id;
      }

      // Save inspection results
      const results = Object.entries(inspectionResults).map(([itemId, result]) => ({
        inspection_id: inspectionId,
        checklist_item_id: itemId,
        result_status: result.result_status || 'not_applicable',
        inspector_notes: result.inspector_notes || '',
        action_required: result.action_required || '',
      }));

      if (results.length > 0) {
        // Delete existing results first if updating
        if (inspection?.id) {
          await supabase
            .from('inspection_results')
            .delete()
            .eq('inspection_id', inspectionId);
        }

        const { error } = await supabase
          .from('inspection_results')
          .insert(results);
        if (error) throw error;
      }

      return inspectionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-inspections'] });
      toast.success(inspection ? 'Inspection updated successfully' : 'Inspection scheduled successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Error saving inspection:', error);
      toast.error('Failed to save inspection');
    },
  });

  const updateInspectionResult = (itemId: string, field: string, value: any) => {
    setInspectionResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'needs_repair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredChecklists = checklists?.filter(checklist => {
    if (!formData.equipment_id) return true;
    const selectedEquipment = equipment?.find(eq => eq.id === formData.equipment_id);
    return !selectedEquipment || checklist.equipment_type === selectedEquipment.equipment_type;
  });

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Information</CardTitle>
          <CardDescription>
            {inspection ? 'Review and update inspection details' : 'Schedule a new safety inspection'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipment">Equipment</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.equipment_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="checklist">Inspection Checklist</Label>
              <Select 
                value={formData.checklist_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, checklist_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select checklist" />
                </SelectTrigger>
                <SelectContent>
                  {filteredChecklists?.map((checklist) => (
                    <SelectItem key={checklist.id} value={checklist.id}>
                      {checklist.checklist_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inspector">Inspector</Label>
              <Select 
                value={formData.inspector_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, inspector_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inspector" />
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

            <div>
              <Label htmlFor="scheduled_date">Scheduled Date</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      {checklistItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inspection Checklist</CardTitle>
            <CardDescription>
              Complete each inspection item. Critical items must pass for equipment certification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklistItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">#{item.item_number}</span>
                      <span>{item.item_description}</span>
                      {item.is_critical && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Critical
                        </Badge>
                      )}
                    </div>
                    {item.expected_condition && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Expected: {item.expected_condition}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Result Status</Label>
                    <Select 
                      value={inspectionResults[item.id]?.result_status || ''} 
                      onValueChange={(value) => updateInspectionResult(item.id, 'result_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Pass
                          </div>
                        </SelectItem>
                        <SelectItem value="fail">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                            Fail
                          </div>
                        </SelectItem>
                        <SelectItem value="needs_repair">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                            Needs Repair
                          </div>
                        </SelectItem>
                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Inspector Notes</Label>
                    <Textarea
                      placeholder="Add notes about this inspection item..."
                      value={inspectionResults[item.id]?.inspector_notes || ''}
                      onChange={(e) => updateInspectionResult(item.id, 'inspector_notes', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                </div>

                {inspectionResults[item.id]?.result_status === 'fail' || 
                 inspectionResults[item.id]?.result_status === 'needs_repair' && (
                  <div>
                    <Label>Action Required</Label>
                    <Textarea
                      placeholder="Describe corrective action needed..."
                      value={inspectionResults[item.id]?.action_required || ''}
                      onChange={(e) => updateInspectionResult(item.id, 'action_required', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="inspection_notes">Inspection Notes</Label>
            <Textarea
              id="inspection_notes"
              placeholder="General notes about the inspection..."
              value={formData.inspection_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, inspection_notes: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              placeholder="Recommendations for maintenance or improvements..."
              value={formData.recommendations}
              onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => saveInspectionMutation.mutate()}
          disabled={saveInspectionMutation.isPending || !formData.equipment_id || !formData.checklist_id}
        >
          {saveInspectionMutation.isPending ? 'Saving...' : inspection ? 'Update Inspection' : 'Schedule Inspection'}
        </Button>
      </div>
    </div>
  );
}