import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface CertificationRequirement {
  id: string;
  certification_name: string;
  validity_period_months: number;
  renewal_notice_days: number;
}

interface StaffCertification {
  id: string;
  staff_id: string;
  requirement_id: string;
  certification_number?: string;
  issued_date: string;
  expiry_date: string;
  issuing_authority?: string;
  verification_status: string;
  file_url?: string;
  renewal_cost?: number;
  renewal_completed_at?: string;
  notes?: string;
  certification_requirements: CertificationRequirement | null;
  profiles: StaffMember | null;
}

export function StaffCertificationsManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<StaffCertification[]>([]);
  const [requirements, setRequirements] = useState<CertificationRequirement[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<StaffCertification | null>(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    requirement_id: '',
    certification_number: '',
    issued_date: '',
    expiry_date: '',
    issuing_authority: '',
    verification_status: 'pending',
    renewal_cost: '',
    notes: '',
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile?.organization_id]);

  const fetchData = async () => {
    try {
      const [certificationsResult, requirementsResult, staffResult] = await Promise.all([
        supabase
          .from('staff_certifications')
          .select(`
            *,
            certification_requirements!inner (
              id,
              certification_name,
              validity_period_months,
              renewal_notice_days
            ),
            profiles!inner (
              id,
              first_name,
              last_name,
              role
            )
          `)
          .eq('organization_id', profile!.organization_id)
          .order('expiry_date'),
        
        supabase
          .from('certification_requirements')
          .select('*')
          .eq('organization_id', profile!.organization_id)
          .order('certification_name'),
        
        supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .eq('organization_id', profile!.organization_id)
          .in('role', ['owner', 'manager', 'staff', 'trainer'])
          .order('first_name')
      ]);

      if (certificationsResult.error) throw certificationsResult.error;
      if (requirementsResult.error) throw requirementsResult.error;
      if (staffResult.error) throw staffResult.error;

      setCertifications((certificationsResult.data as any) || []);
      setRequirements(requirementsResult.data || []);
      setStaffMembers(staffResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certification data',
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
        renewal_cost: formData.renewal_cost ? Number(formData.renewal_cost) : null,
        organization_id: profile!.organization_id,
        created_by: profile!.id,
      };

      if (editingCertification) {
        const { error } = await supabase
          .from('staff_certifications')
          .update(data)
          .eq('id', editingCertification.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Staff certification updated successfully' });
      } else {
        const { error } = await supabase
          .from('staff_certifications')
          .insert([data]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Staff certification added successfully' });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving staff certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to save staff certification',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (certificationId: string) => {
    if (!confirm('Are you sure you want to delete this certification record?')) return;

    try {
      const { error } = await supabase
        .from('staff_certifications')
        .delete()
        .eq('id', certificationId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Staff certification deleted successfully' });
      fetchData();
    } catch (error) {
      console.error('Error deleting staff certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete staff certification',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      requirement_id: '',
      certification_number: '',
      issued_date: '',
      expiry_date: '',
      issuing_authority: '',
      verification_status: 'pending',
      renewal_cost: '',
      notes: '',
    });
    setEditingCertification(null);
  };

  const openEditDialog = (certification: StaffCertification) => {
    setEditingCertification(certification);
    setFormData({
      staff_id: certification.staff_id,
      requirement_id: certification.requirement_id,
      certification_number: certification.certification_number || '',
      issued_date: certification.issued_date,
      expiry_date: certification.expiry_date,
      issuing_authority: certification.issuing_authority || '',
      verification_status: certification.verification_status,
      renewal_cost: certification.renewal_cost?.toString() || '',
      notes: certification.notes || '',
    });
    setDialogOpen(true);
  };

  const getCertificationStatus = (certification: StaffCertification) => {
    const today = new Date();
    const expiryDate = new Date(certification.expiry_date);
    const noticeDate = addDays(today, certification.certification_requirements?.renewal_notice_days || 30);

    if (isBefore(expiryDate, today)) {
      return { status: 'expired', color: 'destructive', icon: XCircle };
    } else if (isBefore(expiryDate, noticeDate)) {
      return { status: 'expiring_soon', color: 'secondary', icon: AlertTriangle };
    } else {
      return { status: 'valid', color: 'default', icon: CheckCircle };
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return <div>Loading staff certifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Staff Certifications</h2>
          <p className="text-muted-foreground">Track and manage staff certification compliance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCertification ? 'Edit' : 'Add'} Staff Certification
              </DialogTitle>
              <DialogDescription>
                Record certification details for a staff member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staff_id">Staff Member</Label>
                  <Select value={formData.staff_id} onValueChange={(value) => setFormData({ ...formData, staff_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name} ({staff.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requirement_id">Certification Type</Label>
                  <Select value={formData.requirement_id} onValueChange={(value) => setFormData({ ...formData, requirement_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select certification" />
                    </SelectTrigger>
                    <SelectContent>
                      {requirements.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.certification_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certification_number">Certification Number</Label>
                  <Input
                    id="certification_number"
                    value={formData.certification_number}
                    onChange={(e) => setFormData({ ...formData, certification_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="issuing_authority">Issuing Authority</Label>
                  <Input
                    id="issuing_authority"
                    value={formData.issuing_authority}
                    onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="issued_date">Issue Date</Label>
                  <Input
                    id="issued_date"
                    type="date"
                    value={formData.issued_date}
                    onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="renewal_cost">Renewal Cost ($)</Label>
                  <Input
                    id="renewal_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.renewal_cost}
                    onChange={(e) => setFormData({ ...formData, renewal_cost: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="verification_status">Verification Status</Label>
                <Select value={formData.verification_status} onValueChange={(value) => setFormData({ ...formData, verification_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCertification ? 'Update' : 'Add'} Certification
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {certifications.map((certification) => {
          const statusInfo = getCertificationStatus(certification);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={certification.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {certification.profiles?.first_name} {certification.profiles?.last_name}
                      <Badge variant="outline">{certification.profiles?.role}</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <strong>{certification.certification_requirements?.certification_name}</strong>
                      <StatusIcon className={`h-4 w-4 ${statusInfo.status === 'expired' ? 'text-red-500' : statusInfo.status === 'expiring_soon' ? 'text-yellow-500' : 'text-green-500'}`} />
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getVerificationBadge(certification.verification_status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(certification)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(certification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Issue Date:</strong> {format(new Date(certification.issued_date), 'MMM d, yyyy')}</p>
                    <p><strong>Expiry Date:</strong> {format(new Date(certification.expiry_date), 'MMM d, yyyy')}</p>
                    {certification.certification_number && (
                      <p><strong>Certificate #:</strong> {certification.certification_number}</p>
                    )}
                  </div>
                  <div>
                    {certification.issuing_authority && (
                      <p><strong>Issuing Authority:</strong> {certification.issuing_authority}</p>
                    )}
                    {certification.renewal_cost && (
                      <p><strong>Renewal Cost:</strong> ${certification.renewal_cost}</p>
                    )}
                  </div>
                </div>
                {certification.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm">{certification.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {certifications.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No staff certifications recorded yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add certifications to track compliance and renewal schedules.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}