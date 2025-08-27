import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface LeadStage {
  id: string;
  name: string;
  color: string;
  description: string | null;
  order_index: number;
  is_closed: boolean;
}

interface LeadStagesManagerProps {
  onClose: () => void;
}

export const LeadStagesManager: React.FC<LeadStagesManagerProps> = ({ onClose }) => {
  const { profile } = useAuth();
  const [stages, setStages] = useState<LeadStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStageForm, setShowStageForm] = useState(false);
  const [editingStage, setEditingStage] = useState<LeadStage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    description: '',
    is_closed: false
  });

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_stages')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('order_index');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast.error('Failed to load stages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    try {
      const stageData = {
        ...formData,
        organization_id: profile.organization_id,
        order_index: editingStage ? editingStage.order_index : stages.length + 1
      };

      let result;
      if (editingStage) {
        result = await supabase
          .from('lead_stages')
          .update(stageData)
          .eq('id', editingStage.id);
      } else {
        result = await supabase
          .from('lead_stages')
          .insert([stageData]);
      }

      if (result.error) throw result.error;

      toast.success(editingStage ? 'Stage updated successfully' : 'Stage created successfully');
      setShowStageForm(false);
      setEditingStage(null);
      setFormData({ name: '', color: '#3b82f6', description: '', is_closed: false });
      fetchStages();
    } catch (error: any) {
      console.error('Error saving stage:', error);
      toast.error(error.message || 'Failed to save stage');
    }
  };

  const handleEdit = (stage: LeadStage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      color: stage.color,
      description: stage.description || '',
      is_closed: stage.is_closed
    });
    setShowStageForm(true);
  };

  const handleDelete = async (stage: LeadStage) => {
    if (!confirm('Are you sure you want to delete this stage? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_stages')
        .delete()
        .eq('id', stage.id);

      if (error) throw error;

      toast.success('Stage deleted successfully');
      fetchStages();
    } catch (error: any) {
      console.error('Error deleting stage:', error);
      toast.error(error.message || 'Failed to delete stage');
    }
  };

  const handleAddNew = () => {
    setEditingStage(null);
    setFormData({ name: '', color: '#3b82f6', description: '', is_closed: false });
    setShowStageForm(true);
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-64">Loading stages...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Lead Stages Management
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stage
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage the sales pipeline stages for your organization. Drag to reorder stages.
            </p>

            <div className="grid gap-4">
              {stages.map((stage) => (
                <Card key={stage.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: stage.color }}
                          />
                          <CardTitle className="text-lg">{stage.name}</CardTitle>
                          {stage.is_closed && (
                            <Badge variant="secondary">Closed</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(stage)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(stage)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {stage.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {stages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No stages found. Add your first stage to get started.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showStageForm && (
        <Dialog open onOpenChange={() => setShowStageForm(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStage ? 'Edit Stage' : 'Add New Stage'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Stage Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., New Lead, Qualified, Tour Scheduled"
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description of this stage"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_closed"
                  checked={formData.is_closed}
                  onChange={(e) => setFormData({ ...formData, is_closed: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_closed">Closed stage (won/lost)</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowStageForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStage ? 'Update Stage' : 'Create Stage'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};