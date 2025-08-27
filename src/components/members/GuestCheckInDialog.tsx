import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Phone, User } from 'lucide-react';

interface GuestCheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GuestCheckInDialog({ isOpen, onClose, onSuccess }: GuestCheckInDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guest_name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the guest's name.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.location_id) {
      toast({
        title: "Location Required",
        description: "You must be assigned to a location to process guest check-ins.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if this guest should be converted to a lead
      let leadId = null;
      if (formData.guest_email) {
        // Check if lead already exists
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', formData.guest_email)
          .eq('organization_id', profile.organization_id)
          .maybeSingle();

        if (!existingLead) {
          // Create new lead
          const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert({
              organization_id: profile.organization_id,
              first_name: formData.guest_name.split(' ')[0],
              last_name: formData.guest_name.split(' ').slice(1).join(' ') || '',
              email: formData.guest_email,
              phone: formData.guest_phone || null,
              source: 'guest_visit',
              status: 'lead',
              entered_by: profile.id,
              notes: `Guest check-in: ${formData.notes}`
            })
            .select('id')
            .single();

          if (leadError) {
            console.error('Error creating lead:', leadError);
          } else {
            leadId = newLead.id;
          }
        } else {
          leadId = existingLead.id;
        }
      }

      // Create guest check-in
      const { error } = await supabase
        .from('check_ins')
        .insert({
          member_id: null as any, // Guest check-ins don't have member_id
          location_id: profile.location_id,
          guest_name: formData.guest_name,
          guest_email: formData.guest_email || null,
          guest_phone: formData.guest_phone || null,
          is_guest: true,
          lead_id: leadId,
          checked_in_at: new Date().toISOString()
        });

      if (error) {
        toast({
          title: "Check-in Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Guest Checked In",
        description: `${formData.guest_name} has been checked in successfully.${leadId ? ' A new lead has been created.' : ''}`,
      });

      // Reset form and close dialog
      setFormData({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        notes: ''
      });
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error processing guest check-in:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Guest Check-In
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest_name">Guest Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guest_name"
                placeholder="Enter guest's full name"
                value={formData.guest_name}
                onChange={(e) => handleInputChange('guest_name', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_email">Email (Optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guest_email"
                type="email"
                placeholder="Enter guest's email"
                value={formData.guest_email}
                onChange={(e) => handleInputChange('guest_email', e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Providing an email will automatically create a sales lead
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_phone">Phone (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guest_phone"
                type="tel"
                placeholder="Enter guest's phone"
                value={formData.guest_phone}
                onChange={(e) => handleInputChange('guest_phone', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about the guest visit..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-success hover:opacity-90"
              disabled={loading}
            >
              {loading ? 'Checking In...' : 'Check In Guest'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}