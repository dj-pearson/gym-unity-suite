import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';

interface CertificationRequirement {
  id: string;
  certification_name: string;
  description: string;
  validity_period_months: number;
  is_required: boolean;
  required_for_roles: string[];
  renewal_notice_days: number;
  training_provider?: string;
  cost_estimate?: number;
  created_at: string;
}

export function CertificationRequirementsManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requirements, setRequirements] = useState<CertificationRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<CertificationRequirement | null>(null);
  const [formData, setFormData] = useState({
    certification_name: '',
    description: '',
    validity_period_months: 12,
    is_required: true,
    required_for_roles: ['staff'],
    renewal_notice_days: 30,
    training_provider: '',
    cost_estimate: '',
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchRequirements();
    }
  }, [profile?.organization_id]);

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('certification_requirements')
        .select('*')
        .eq('organization_id', profile!.organization_id)
        .order('certification_name');

      if (error) throw error;
      setRequirements(data || []);
    } catch (error) {
      console.error('Error fetching certification requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certification requirements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        cost_estimate: formData.cost_estimate ? Number(formData.cost_estimate) : null,
        organization_id: profile!.organization_id,
      };

      if (editingRequirement) {
        const { error } = await supabase
          .from('certification_requirements')
          .update(data)
          .eq('id', editingRequirement.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Certification requirement updated successfully' });
      } else {
        const { error } = await supabase
          .from('certification_requirements')
          .insert([data]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Certification requirement created successfully' });
      }

      setDialogOpen(false);
      resetForm();
      fetchRequirements();
    } catch (error) {
      console.error('Error saving certification requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to save certification requirement',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (requirementId: string) => {
    if (!confirm('Are you sure you want to delete this certification requirement?')) return;

    try {
      const { error } = await supabase
        .from('certification_requirements')
        .delete()
        .eq('id', requirementId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Certification requirement deleted successfully' });
      fetchRequirements();
    } catch (error) {
      console.error('Error deleting certification requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete certification requirement',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      certification_name: '',
      description: '',
      validity_period_months: 12,
      is_required: true,
      required_for_roles: ['staff'],
      renewal_notice_days: 30,
      training_provider: '',
      cost_estimate: '',
    });
    setEditingRequirement(null);
  };

  const openEditDialog = (requirement: CertificationRequirement) => {
    setEditingRequirement(requirement);
    setFormData({
      certification_name: requirement.certification_name,
      description: requirement.description || '',
      validity_period_months: requirement.validity_period_months,
      is_required: requirement.is_required,
      required_for_roles: requirement.required_for_roles,
      renewal_notice_days: requirement.renewal_notice_days,
      training_provider: requirement.training_provider || '',
      cost_estimate: requirement.cost_estimate?.toString() || '',
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div>Loading certification requirements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Certification Requirements</h2>
          <p className="text-muted-foreground">Manage required certifications for staff members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Requirement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRequirement ? 'Edit' : 'Add'} Certification Requirement
              </DialogTitle>
              <DialogDescription>
                Define certification requirements for staff members
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certification_name">Certification Name</Label>
                  <Input
                    id="certification_name"
                    value={formData.certification_name}
                    onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="training_provider">Training Provider</Label>
                  <Input
                    id="training_provider"
                    value={formData.training_provider}
                    onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="validity_period_months">Validity Period (Months)</Label>
                  <Input
                    id="validity_period_months"
                    type="number"
                    min="1"
                    value={formData.validity_period_months}
                    onChange={(e) => setFormData({ ...formData, validity_period_months: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="renewal_notice_days">Renewal Notice (Days)</Label>
                  <Input
                    id="renewal_notice_days"
                    type="number"
                    min="1"
                    value={formData.renewal_notice_days}
                    onChange={(e) => setFormData({ ...formData, renewal_notice_days: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cost_estimate">Cost Estimate ($)</Label>
                  <Input
                    id="cost_estimate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_estimate}
                    onChange={(e) => setFormData({ ...formData, cost_estimate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                />
                <Label htmlFor="is_required">Required Certification</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRequirement ? 'Update' : 'Create'} Requirement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {requirements.map((requirement) => (
          <Card key={requirement.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {requirement.certification_name}
                    {requirement.is_required && (
                      <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Required
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Valid for {requirement.validity_period_months} months • 
                    Renewal notice: {requirement.renewal_notice_days} days
                    {requirement.cost_estimate && ` • Estimated cost: $${requirement.cost_estimate}`}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(requirement)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(requirement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {requirement.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{requirement.description}</p>
                {requirement.training_provider && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Provider: {requirement.training_provider}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        ))}

        {requirements.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No certification requirements defined yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create requirements to track staff certifications and compliance.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}