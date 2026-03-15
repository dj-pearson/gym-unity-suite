import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { sanitizeFormData } from '@/hooks/useSanitizedForm';

const addMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  phone: z.string().max(30, 'Phone number is too long').optional().default(''),
});

type AddMemberValues = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddMemberDialog({ isOpen, onClose, onSuccess }: AddMemberDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    // Validate with Zod
    const result = addMemberSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      toast({
        title: 'Validation error',
        description: 'Please fix the highlighted fields',
        variant: 'destructive',
      });
      return;
    }
    setValidationErrors({});

    // Sanitize validated data
    const sanitizedData = sanitizeFormData(result.data);

    setLoading(true);
    try {
      // Generate a cryptographically stronger temporary password
      const tempPassword = crypto.getRandomValues(new Uint8Array(16))
        .reduce((str, byte) => str + byte.toString(36).padStart(2, '0'), '');

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: tempPassword,
        options: {
          data: {
            first_name: sanitizedData.first_name,
            last_name: sanitizedData.last_name,
            phone: sanitizedData.phone,
            organization_id: profile.organization_id,
            role: 'member',
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with additional information
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: sanitizedData.first_name,
            last_name: sanitizedData.last_name,
            phone: sanitizedData.phone,
            organization_id: profile.organization_id,
            role: 'member',
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: 'Member added successfully',
        description: `${sanitizedData.first_name} ${sanitizedData.last_name} has been added to your gym.`,
      });

      setFormData({ email: '', first_name: '', last_name: '', phone: '' });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error adding member',
        description: error.message || 'An error occurred while adding the member.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              aria-required="true"
              aria-invalid={!!validationErrors.email}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="member@example.com"
            />
            {validationErrors.email && (
              <p className="text-sm text-destructive">{validationErrors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                required
                aria-required="true"
                aria-invalid={!!validationErrors.first_name}
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
              {validationErrors.first_name && (
                <p className="text-sm text-destructive">{validationErrors.first_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                required
                aria-required="true"
                aria-invalid={!!validationErrors.last_name}
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
              {validationErrors.last_name && (
                <p className="text-sm text-destructive">{validationErrors.last_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
