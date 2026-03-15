import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { z } from 'zod';
import { sanitizeFormData } from '@/hooks/useSanitizedForm';

const leadFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().max(100, 'First name is too long').optional().default(''),
  last_name: z.string().max(100, 'Last name is too long').optional().default(''),
  phone: z.string().max(30, 'Phone number is too long').optional().default(''),
  source: z.string().optional().default(''),
  interest_level: z.enum(['cold', 'warm', 'hot']).default('cold'),
  estimated_value: z.string().optional().default(''),
  stage_id: z.string().optional().default(''),
  notes: z.string().max(5000, 'Notes are too long').optional().default(''),
  assigned_salesperson: z.string().optional().default(''),
  referral_code: z.string().max(50, 'Referral code is too long').optional().default(''),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  onClose: () => void;
  onSuccess: () => void;
  lead?: any;
}

interface LeadStage {
  id: string;
  name: string;
  color: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onClose, onSuccess, lead }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<LeadStage[]>([]);
  const [salespeople, setSalespeople] = useState([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: lead?.email || '',
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    phone: lead?.phone || '',
    source: lead?.source || '',
    interest_level: lead?.interest_level || 'cold',
    estimated_value: lead?.estimated_value?.toString() || '',
    stage_id: lead?.stage_id || '',
    notes: lead?.notes || '',
    assigned_salesperson: lead?.assigned_salesperson || '',
    referral_code: lead?.referral_code || ''
  });

  useEffect(() => {
    fetchStages();
    fetchSalespeople();
  }, []);

  const fetchStages = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('lead_stages')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_closed', false)
        .order('order_index');

      if (error) throw error;
      setStages(data || []);
      
      // Set default stage if creating new lead
      if (!lead && data && data.length > 0) {
        setFormData(prev => ({ ...prev, stage_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const fetchSalespeople = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('organization_id', profile.organization_id)
        .in('role', ['staff', 'manager', 'owner']);

      if (error) throw error;
      setSalespeople(data || []);
    } catch (error) {
      console.error('Error fetching salespeople:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    // Validate form data with Zod
    const result = leadFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      toast.error('Please fix the validation errors');
      return;
    }
    setValidationErrors({});

    // Sanitize form data before submission
    const sanitizedData = sanitizeFormData(result.data);

    setLoading(true);
    try {
      const leadData = {
        ...sanitizedData,
        organization_id: profile.organization_id,
        entered_by: profile.id,
        estimated_value: sanitizedData.estimated_value ? parseFloat(sanitizedData.estimated_value) : null,
        stage_id: sanitizedData.stage_id || null,
        assigned_salesperson: sanitizedData.assigned_salesperson || null
      };

      let dbResult;
      if (lead) {
        dbResult = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', lead.id);
      } else {
        dbResult = await supabase
          .from('leads')
          .insert([leadData]);
      }

      if (dbResult.error) throw dbResult.error;

      toast.success(lead ? 'Lead updated successfully' : 'Lead created successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving lead:', error);
      toast.error(error.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              aria-required="true"
              aria-invalid={!!validationErrors.email}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {validationErrors.email && (
              <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source">Source</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="How did they find us?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="walk_in">Walk In</SelectItem>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="interest_level">Interest Level</Label>
              <Select value={formData.interest_level} onValueChange={(value) => setFormData({ ...formData, interest_level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stage_id">Sales Stage</Label>
              <Select value={formData.stage_id} onValueChange={(value) => setFormData({ ...formData, stage_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimated_value">Estimated Value ($)</Label>
              <Input
                id="estimated_value"
                type="number"
                step="0.01"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assigned_salesperson">Assigned Salesperson</Label>
              <Select 
                value={formData.assigned_salesperson} 
                onValueChange={(value) => setFormData({ ...formData, assigned_salesperson: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No assignment</SelectItem>
                  {salespeople.map((person: any) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.first_name} {person.last_name} ({person.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="referral_code">Referral Code</Label>
              <Input
                id="referral_code"
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                placeholder="If lead came from referral link"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};