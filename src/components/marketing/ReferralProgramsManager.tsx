import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Gift, TrendingUp, UserPlus, Share2, Award } from 'lucide-react';

interface ReferralProgram {
  id: string;
  name: string;
  description?: string;
  referrer_reward_type: 'discount' | 'free_classes' | 'cash_credit' | 'loyalty_points' | 'merchandise';
  referrer_reward_value: number;
  referee_reward_type?: 'discount' | 'free_classes' | 'cash_credit' | 'loyalty_points' | 'merchandise';
  referee_reward_value?: number;
  max_referrals_per_member?: number;
  program_start_date: string;
  program_end_date?: string;
  is_active: boolean;
  created_at: string;
  referrals_count?: number;
  conversions_count?: number;
}

interface MemberReferral {
  id: string;
  referrer_id: string;
  referee_email: string;
  referee_name?: string;
  referral_code?: string;
  status: 'pending' | 'signed_up' | 'converted' | 'rewarded' | 'expired';
  signup_date?: string;
  conversion_date?: string;
  reward_given_date?: string;
  notes?: string;
  created_at: string;
  referrer?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  program?: {
    name: string;
  };
}

interface ProgramFormData {
  name: string;
  description: string;
  referrer_reward_type: string;
  referrer_reward_value: string;
  referee_reward_type: string;
  referee_reward_value: string;
  max_referrals_per_member: string;
  program_start_date: string;
  program_end_date: string;
  is_active: boolean;
}

export default function ReferralProgramsManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [referrals, setReferrals] = useState<MemberReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ReferralProgram | null>(null);
  const [formData, setFormData] = useState<ProgramFormData>({
    name: '',
    description: '',
    referrer_reward_type: 'discount',
    referrer_reward_value: '10',
    referee_reward_type: 'discount',
    referee_reward_value: '5',
    max_referrals_per_member: '10',
    program_start_date: '',
    program_end_date: '',
    is_active: true
  });

  useEffect(() => {
    fetchPrograms();
    fetchReferrals();
  }, [profile?.organization_id]);

  const fetchPrograms = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('referral_programs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get referral counts for each program
      const programsWithCounts = await Promise.all((data || []).map(async (program) => {
        const { data: referralData } = await supabase
          .from('member_referrals')
          .select('status')
          .eq('program_id', program.id);

        const referrals_count = referralData?.length || 0;
        const conversions_count = referralData?.filter(r => r.status === 'converted').length || 0;

        return {
          ...program,
          referrals_count,
          conversions_count
        };
      }));

      setPrograms(programsWithCounts as ReferralProgram[]);
    } catch (error: any) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('member_referrals')
        .select(`
          *,
          referrer:profiles!referrer_id(first_name, last_name, email, organization_id),
          program:referral_programs!program_id(name)
        `)
        .eq('referrer.organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReferrals(data as any[] || []);
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !profile?.organization_id) return;

    try {
      const programData = {
        organization_id: profile.organization_id,
        name: formData.name,
        description: formData.description || null,
        referrer_reward_type: formData.referrer_reward_type as ReferralProgram['referrer_reward_type'],
        referrer_reward_value: parseFloat(formData.referrer_reward_value) || 0,
        referee_reward_type: formData.referee_reward_type === 'none' ? null : formData.referee_reward_type,
        referee_reward_value: formData.referee_reward_type === 'none' ? null : parseFloat(formData.referee_reward_value) || 0,
        max_referrals_per_member: formData.max_referrals_per_member ? parseInt(formData.max_referrals_per_member) : null,
        program_start_date: formData.program_start_date,
        program_end_date: formData.program_end_date || null,
        is_active: formData.is_active,
        created_by: profile.id
      };

      if (editingProgram) {
        const { error } = await supabase
          .from('referral_programs')
          .update(programData)
          .eq('id', editingProgram.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('referral_programs')
          .insert([programData]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Referral program ${editingProgram ? 'updated' : 'created'} successfully`,
      });

      setProgramDialogOpen(false);
      resetForm();
      fetchPrograms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save referral program",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (programId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('referral_programs')
        .update({ is_active: !isActive })
        .eq('id', programId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Program ${!isActive ? 'activated' : 'deactivated'}`,
      });

      fetchPrograms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update program",
        variant: "destructive",
      });
    }
  };

  const handleReferralStatusUpdate = async (referralId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'converted') {
        updateData.conversion_date = new Date().toISOString();
      } else if (newStatus === 'rewarded') {
        updateData.reward_given_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('member_referrals')
        .update(updateData)
        .eq('id', referralId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Referral status updated to ${newStatus}`,
      });

      fetchReferrals();
      fetchPrograms(); // Refresh to update counts
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update referral",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      referrer_reward_type: 'discount',
      referrer_reward_value: '10',
      referee_reward_type: 'discount',
      referee_reward_value: '5',
      max_referrals_per_member: '10',
      program_start_date: '',
      program_end_date: '',
      is_active: true
    });
    setEditingProgram(null);
  };

  const handleEdit = (program: ReferralProgram) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description || '',
      referrer_reward_type: program.referrer_reward_type,
      referrer_reward_value: program.referrer_reward_value.toString(),
      referee_reward_type: program.referee_reward_type || 'none',
      referee_reward_value: program.referee_reward_value?.toString() || '0',
      max_referrals_per_member: program.max_referrals_per_member?.toString() || '',
      program_start_date: program.program_start_date.split('T')[0],
      program_end_date: program.program_end_date ? program.program_end_date.split('T')[0] : '',
      is_active: program.is_active
    });
    setProgramDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'signed_up': return 'bg-blue-100 text-blue-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'rewarded': return 'bg-purple-100 text-purple-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center py-8">Loading referral programs...</div>;

  const totalReferrals = referrals.length;
  const totalConversions = referrals.filter(r => r.status === 'converted').length;
  const activePrograms = programs.filter(p => p.is_active).length;
  const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Referral Programs</h2>
          <p className="text-muted-foreground">
            Create and manage member referral programs
          </p>
        </div>
        <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'Edit' : 'Create'} Referral Program</DialogTitle>
              <DialogDescription>
                Set up rewards for members who refer new customers
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Program Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_referrals">Max Referrals per Member</Label>
                  <Input
                    id="max_referrals"
                    type="number"
                    value={formData.max_referrals_per_member}
                    onChange={(e) => setFormData({ ...formData, max_referrals_per_member: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description of the referral program"
                />
              </div>

              {/* Referrer Rewards */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Referrer Rewards (For existing members)</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="referrer_reward_type">Reward Type</Label>
                    <Select value={formData.referrer_reward_type} onValueChange={(value) => setFormData({ ...formData, referrer_reward_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="free_classes">Free Classes</SelectItem>
                        <SelectItem value="cash_credit">Cash Credit</SelectItem>
                        <SelectItem value="loyalty_points">Loyalty Points</SelectItem>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referrer_reward_value">
                      Reward Value {formData.referrer_reward_type === 'discount' && '(%)'}
                    </Label>
                    <Input
                      id="referrer_reward_value"
                      type="number"
                      value={formData.referrer_reward_value}
                      onChange={(e) => setFormData({ ...formData, referrer_reward_value: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Referee Rewards */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Referee Rewards (For new members)</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="referee_reward_type">Reward Type</Label>
                    <Select value={formData.referee_reward_type} onValueChange={(value) => setFormData({ ...formData, referee_reward_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Reward</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="free_classes">Free Classes</SelectItem>
                        <SelectItem value="cash_credit">Cash Credit</SelectItem>
                        <SelectItem value="loyalty_points">Loyalty Points</SelectItem>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.referee_reward_type !== 'none' && (
                    <div>
                      <Label htmlFor="referee_reward_value">
                        Reward Value {formData.referee_reward_type === 'discount' && '(%)'}
                      </Label>
                      <Input
                        id="referee_reward_value"
                        type="number"
                        value={formData.referee_reward_value}
                        onChange={(e) => setFormData({ ...formData, referee_reward_value: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.program_start_date}
                    onChange={(e) => setFormData({ ...formData, program_start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.program_end_date}
                    onChange={(e) => setFormData({ ...formData, program_end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active Program</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setProgramDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProgram ? 'Update' : 'Create'} Program
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Referral Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{activePrograms}</div>
                <div className="text-sm text-muted-foreground">Active Programs</div>
              </div>
              <Share2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalReferrals}</div>
                <div className="text-sm text-muted-foreground">Total Referrals</div>
              </div>
              <UserPlus className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalConversions}</div>
                <div className="text-sm text-muted-foreground">Conversions</div>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Programs</CardTitle>
          <CardDescription>
            Manage your member referral programs and track performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No referral programs</h3>
              <p className="text-muted-foreground">
                Create referral programs to incentivize member referrals
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {programs.map((program) => (
                <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Gift className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{program.name}</h4>
                      {program.description && (
                        <p className="text-sm text-muted-foreground">{program.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          Referrer: {program.referrer_reward_type} ({program.referrer_reward_value})
                        </Badge>
                        {program.referee_reward_type && (
                          <Badge variant="outline">
                            Referee: {program.referee_reward_type} ({program.referee_reward_value})
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{program.referrals_count || 0} referrals</p>
                      <p className="text-sm text-muted-foreground">
                        {program.conversions_count || 0} conversions
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={program.is_active}
                        onCheckedChange={() => handleToggleActive(program.id, program.is_active)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(program)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>
              Track member referral activity and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {referrals.slice(0, 10).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{referral.referee_name || referral.referee_email}</h4>
                    <p className="text-sm text-muted-foreground">
                      Referred by: {referral.referrer?.first_name} {referral.referrer?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Program: {referral.program?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(referral.status)}>
                      {referral.status}
                    </Badge>
                    {referral.status === 'signed_up' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReferralStatusUpdate(referral.id, 'converted')}
                      >
                        Mark Converted
                      </Button>
                    )}
                    {referral.status === 'converted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReferralStatusUpdate(referral.id, 'rewarded')}
                      >
                        Mark Rewarded
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}