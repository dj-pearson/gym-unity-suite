import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ActivityFormProps {
  leadId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({ leadId, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: 'note',
    title: '',
    description: '',
    scheduled_at: '',
    outcome: '',
    next_action: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);
    try {
      const activityData = {
        lead_id: leadId,
        created_by: profile.id,
        activity_type: formData.activity_type,
        title: formData.title,
        description: formData.description || null,
        scheduled_at: formData.scheduled_at || null,
        outcome: formData.outcome || null,
        next_action: formData.next_action || null,
        ...(formData.activity_type === 'appointment' || formData.activity_type === 'call' 
          ? { completed_at: new Date().toISOString() } 
          : {})
      };

      const { error } = await supabase
        .from('lead_activities')
        .insert([activityData]);

      if (error) throw error;

      // Update lead's last contact date
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          last_contact_date: new Date().toISOString(),
          ...(formData.next_action && { next_follow_up_date: formData.scheduled_at || null })
        })
        .eq('id', leadId);

      if (leadError) console.error('Error updating lead:', leadError);

      toast.success('Activity logged successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error logging activity:', error);
      toast.error(error.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  const activityTypes = [
    { value: 'call', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'note', label: 'Note' },
    { value: 'follow_up', label: 'Follow-up' }
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="activity_type">Activity Type</Label>
            <Select 
              value={formData.activity_type} 
              onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the activity"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Detailed notes about the activity"
            />
          </div>

          {(formData.activity_type === 'appointment' || formData.activity_type === 'follow_up') && (
            <div>
              <Label htmlFor="scheduled_at">Scheduled Date/Time</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label htmlFor="outcome">Outcome</Label>
            <Textarea
              id="outcome"
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              rows={2}
              placeholder="What was the result of this activity?"
            />
          </div>

          <div>
            <Label htmlFor="next_action">Next Action</Label>
            <Textarea
              id="next_action"
              value={formData.next_action}
              onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
              rows={2}
              placeholder="What needs to be done next?"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Logging...' : 'Log Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};