import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Save, UserPlus } from 'lucide-react';

interface StaffFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export default function StaffForm({ onSuccess, onCancel, initialData }: StaffFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    role: initialData?.role || 'staff',
    employee_id: initialData?.employee_id || '',
    department: initialData?.department || '',
    hourly_rate: initialData?.hourly_rate || '',
    hire_date: initialData?.hire_date || '',
    status: initialData?.status || 'active',
    certifications: initialData?.certifications?.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      const staffData = {
        ...formData,
        organization_id: profile.organization_id,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        hire_date: formData.hire_date || null,
        certifications: formData.certifications 
          ? formData.certifications.split(',').map(cert => cert.trim()).filter(cert => cert)
          : [],
      };

      if (initialData?.id) {
        // Update existing staff member
        const { error } = await supabase
          .from('profiles')
          .update(staffData)
          .eq('id', initialData.id);

        if (error) throw error;

        toast({
          title: "Staff member updated",
          description: "Staff member information has been updated successfully.",
        });
      } else {
        // Create new staff member - this would typically involve inviting them
        // For now, we'll show a placeholder message
        toast({
          title: "Feature in progress",
          description: "Staff invitation system will be implemented soon.",
          variant: "destructive",
        });
        return;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving staff member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">
              {initialData ? 'Edit Staff Member' : 'Add New Staff Member'}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Certifications</h3>
            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications (comma-separated)</Label>
              <Textarea
                id="certifications"
                value={formData.certifications}
                onChange={(e) => handleInputChange('certifications', e.target.value)}
                placeholder="e.g., CPR Certified, Personal Training Certification, Yoga Instructor"
                rows={3}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-secondary hover:opacity-90">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : (initialData ? 'Update Staff Member' : 'Add Staff Member')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}