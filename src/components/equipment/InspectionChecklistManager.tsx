import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, AlertTriangle, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export function InspectionChecklistManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [checklistForm, setChecklistForm] = useState({
    checklist_name: '',
    equipment_type: '',
    description: '',
    frequency_days: 30,
    requires_certification: false,
  });
  const [itemForm, setItemForm] = useState({
    item_number: 1,
    item_description: '',
    is_critical: false,
    expected_condition: '',
    inspection_method: '',
    pass_criteria: '',
    fail_criteria: '',
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

  const { data: checklists } = useQuery({
    queryKey: ['inspection-checklists'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('inspection_checklists')
        .select(`
          *,
          creator:profiles!inspection_checklists_created_by_fkey(first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('checklist_name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const { data: checklistItems } = useQuery({
    queryKey: ['inspection-checklist-items', selectedChecklist?.id],
    queryFn: async () => {
      if (!selectedChecklist?.id) return [];
      const { data, error } = await supabase
        .from('inspection_checklist_items')
        .select('*')
        .eq('checklist_id', selectedChecklist.id)
        .order('item_number');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedChecklist?.id,
  });

  const createChecklistMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('inspection_checklists')
        .insert({
          ...checklistForm,
          organization_id: profile.organization_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-checklists'] });
      toast.success('Inspection checklist created successfully');
      setShowChecklistForm(false);
      setChecklistForm({
        checklist_name: '',
        equipment_type: '',
        description: '',
        frequency_days: 30,
        requires_certification: false,
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChecklist?.id) throw new Error('No checklist selected');

      const { data, error } = await supabase
        .from('inspection_checklist_items')
        .insert({
          ...itemForm,
          checklist_id: selectedChecklist.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-checklist-items', selectedChecklist?.id] });
      toast.success('Checklist item added successfully');
      setShowItemForm(false);
      setItemForm({
        item_number: (checklistItems?.length || 0) + 1,
        item_description: '',
        is_critical: false,
        expected_condition: '',
        inspection_method: '',
        pass_criteria: '',
        fail_criteria: '',
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('inspection_checklist_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-checklist-items', selectedChecklist?.id] });
      toast.success('Checklist item deleted successfully');
    },
  });

  const equipmentTypes = [
    'cardio', 'strength', 'free_weights', 'functional', 'pool', 'spa', 'hvac', 'safety', 'other'
  ];

  const inspectionMethods = [
    'Visual Inspection', 'Functional Test', 'Measurement', 'Load Test', 'Safety Check', 'Documentation Review'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Inspection Checklists</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage standardized inspection checklists for different equipment types
          </p>
        </div>
        <Dialog open={showChecklistForm} onOpenChange={setShowChecklistForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Checklist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Inspection Checklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="checklist_name">Checklist Name</Label>
                <Input
                  id="checklist_name"
                  value={checklistForm.checklist_name}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, checklist_name: e.target.value }))}
                  placeholder="e.g., Treadmill Safety Inspection"
                />
              </div>
              
              <div>
                <Label htmlFor="equipment_type">Equipment Type</Label>
                <Select 
                  value={checklistForm.equipment_type} 
                  onValueChange={(value) => setChecklistForm(prev => ({ ...prev, equipment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency_days">Inspection Frequency (Days)</Label>
                <Input
                  id="frequency_days"
                  type="number"
                  value={checklistForm.frequency_days}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, frequency_days: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={checklistForm.description}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when and how this checklist should be used..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_certification"
                  checked={checklistForm.requires_certification}
                  onCheckedChange={(checked) => setChecklistForm(prev => ({ ...prev, requires_certification: !!checked }))}
                />
                <Label htmlFor="requires_certification">Requires certified inspector</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowChecklistForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createChecklistMutation.mutate()}
                  disabled={createChecklistMutation.isPending || !checklistForm.checklist_name || !checklistForm.equipment_type}
                >
                  Create Checklist
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Checklists Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Checklists List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Checklists</CardTitle>
            <CardDescription>Select a checklist to view and edit items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklists?.map((checklist) => (
                <div
                  key={checklist.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                    selectedChecklist?.id === checklist.id ? 'border-primary bg-muted' : ''
                  }`}
                  onClick={() => setSelectedChecklist(checklist)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{checklist.checklist_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {checklist.equipment_type.charAt(0).toUpperCase() + checklist.equipment_type.slice(1).replace('_', ' ')}
                        • Every {checklist.frequency_days} days
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {checklist.requires_certification && (
                        <Badge variant="secondary" className="text-xs">
                          Certified Required
                        </Badge>
                      )}
                      <Badge variant={checklist.is_active ? 'default' : 'secondary'}>
                        {checklist.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {checklist.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {checklist.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedChecklist ? `${selectedChecklist.checklist_name} Items` : 'Checklist Items'}
                </CardTitle>
                <CardDescription>
                  {selectedChecklist ? 'Manage inspection items for this checklist' : 'Select a checklist to view items'}
                </CardDescription>
              </div>
              {selectedChecklist && (
                <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Checklist Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="item_number">Item Number</Label>
                          <Input
                            id="item_number"
                            type="number"
                            value={itemForm.item_number}
                            onChange={(e) => setItemForm(prev => ({ ...prev, item_number: parseInt(e.target.value) }))}
                          />
                        </div>
                        <div className="flex items-center space-x-2 mt-6">
                          <Checkbox
                            id="is_critical"
                            checked={itemForm.is_critical}
                            onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_critical: !!checked }))}
                          />
                          <Label htmlFor="is_critical">Critical Safety Item</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="item_description">Item Description</Label>
                        <Textarea
                          id="item_description"
                          value={itemForm.item_description}
                          onChange={(e) => setItemForm(prev => ({ ...prev, item_description: e.target.value }))}
                          placeholder="Describe what needs to be inspected..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="expected_condition">Expected Condition</Label>
                        <Input
                          id="expected_condition"
                          value={itemForm.expected_condition}
                          onChange={(e) => setItemForm(prev => ({ ...prev, expected_condition: e.target.value }))}
                          placeholder="What should be observed for a pass..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="inspection_method">Inspection Method</Label>
                        <Select 
                          value={itemForm.inspection_method} 
                          onValueChange={(value) => setItemForm(prev => ({ ...prev, inspection_method: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select inspection method" />
                          </SelectTrigger>
                          <SelectContent>
                            {inspectionMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pass_criteria">Pass Criteria</Label>
                          <Textarea
                            id="pass_criteria"
                            value={itemForm.pass_criteria}
                            onChange={(e) => setItemForm(prev => ({ ...prev, pass_criteria: e.target.value }))}
                            placeholder="When does this item pass..."
                            className="min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fail_criteria">Fail Criteria</Label>
                          <Textarea
                            id="fail_criteria"
                            value={itemForm.fail_criteria}
                            onChange={(e) => setItemForm(prev => ({ ...prev, fail_criteria: e.target.value }))}
                            placeholder="When does this item fail..."
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowItemForm(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => createItemMutation.mutate()}
                          disabled={createItemMutation.isPending || !itemForm.item_description}
                        >
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedChecklist ? (
              <div className="space-y-3">
                {checklistItems?.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            #{item.item_number}
                          </span>
                          <span className="font-medium">{item.item_description}</span>
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
                        {item.inspection_method && (
                          <p className="text-sm text-muted-foreground">
                            Method: {item.inspection_method}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {checklistItems?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No items in this checklist yet.</p>
                    <p className="text-sm">Add inspection items to get started.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a checklist to view and manage items.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}