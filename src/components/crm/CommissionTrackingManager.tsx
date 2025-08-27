import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CommissionRecord {
  id: string;
  salesperson_id: string;
  lead_id: string;
  member_id: string | null;
  commission_type: 'membership' | 'upsell' | 'renewal' | 'referral' | 'tour_conversion';
  amount: number;
  percentage: number;
  base_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed' | 'cancelled';
  earned_date: string;
  paid_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  salesperson?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  lead?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  member?: {
    first_name: string;
    last_name: string;
  };
}

interface CommissionRule {
  id: string;
  commission_type: 'membership' | 'upsell' | 'renewal' | 'referral' | 'tour_conversion';
  percentage: number;
  flat_amount: number | null;
  min_threshold: number | null;
  max_cap: number | null;
  effective_date: string;
  expiry_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

interface SalespersonStats {
  salesperson_id: string;
  salesperson_name: string;
  total_commissions: number;
  pending_amount: number;
  paid_amount: number;
  conversion_count: number;
  average_commission: number;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

interface Salesperson {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const typeColors = {
  membership: 'bg-purple-100 text-purple-800',
  upsell: 'bg-blue-100 text-blue-800',
  renewal: 'bg-green-100 text-green-800',
  referral: 'bg-orange-100 text-orange-800',
  tour_conversion: 'bg-indigo-100 text-indigo-800',
};

export const CommissionTrackingManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<SalespersonStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<CommissionRecord | null>(null);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [filterSalesperson, setFilterSalesperson] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [formData, setFormData] = useState({
    salesperson_id: '',
    lead_id: '',
    member_id: '',
    commission_type: 'membership' as CommissionRecord['commission_type'],
    base_amount: '',
    percentage: '',
    amount: '',
    earned_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [ruleData, setRuleData] = useState({
    commission_type: 'membership' as CommissionRule['commission_type'],
    percentage: '',
    flat_amount: '',
    min_threshold: '',
    max_cap: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: '',
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchCommissions();
      fetchRules();
      fetchSalespeople();
      fetchLeads();
      fetchMembers();
      fetchStats();
    }
  }, [profile?.organization_id, dateRange]);

  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('salesperson_commissions')
        .select(`
          *,
          salesperson:profiles!salesperson_id(first_name, last_name, email),
          lead:leads(first_name, last_name, email),
          member:profiles!member_id(first_name, last_name)
        `)
        .gte('earned_date', dateRange.start)
        .lte('earned_date', dateRange.end)
        .order('earned_date', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.error('Failed to load commissions');
    }
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching commission rules:', error);
    }
  };

  const fetchSalespeople = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile?.organization_id)
        .in('role', ['owner', 'manager', 'staff', 'salesperson'])
        .order('first_name');

      if (error) throw error;
      setSalespeople(data || []);
    } catch (error) {
      console.error('Error fetching salespeople:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile?.organization_id)
        .order('first_name');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('organization_id', profile?.organization_id)
        .eq('role', 'member')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: rawData, error } = await supabase
        .from('salesperson_commissions')
        .select(`
          salesperson_id,
          amount,
          status,
          salesperson:profiles!salesperson_id(first_name, last_name)
        `)
        .gte('earned_date', dateRange.start)
        .lte('earned_date', dateRange.end);

      if (error) throw error;

      // Group and calculate stats
      const statsMap = new Map<string, SalespersonStats>();
      
      rawData?.forEach((commission) => {
        const key = commission.salesperson_id;
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            salesperson_id: key,
            salesperson_name: `${commission.salesperson?.first_name} ${commission.salesperson?.last_name}`,
            total_commissions: 0,
            pending_amount: 0,
            paid_amount: 0,
            conversion_count: 0,
            average_commission: 0,
          });
        }

        const stats = statsMap.get(key)!;
        stats.total_commissions += commission.amount;
        stats.conversion_count += 1;

        if (commission.status === 'pending' || commission.status === 'approved') {
          stats.pending_amount += commission.amount;
        } else if (commission.status === 'paid') {
          stats.paid_amount += commission.amount;
        }
      });

      // Calculate averages
      statsMap.forEach((stats) => {
        stats.average_commission = stats.total_commissions / stats.conversion_count;
      });

      setStats(Array.from(statsMap.values()));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCommission = () => {
    const baseAmount = parseFloat(formData.base_amount) || 0;
    const percentage = parseFloat(formData.percentage) || 0;
    
    if (baseAmount > 0 && percentage > 0) {
      const calculatedAmount = (baseAmount * percentage) / 100;
      setFormData({ ...formData, amount: calculatedAmount.toFixed(2) });
    }
  };

  useEffect(() => {
    if (formData.base_amount && formData.percentage) {
      calculateCommission();
    }
  }, [formData.base_amount, formData.percentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const commissionData = {
        salesperson_id: formData.salesperson_id,
        lead_id: formData.lead_id || null,
        member_id: formData.member_id || null,
        commission_type: formData.commission_type,
        base_amount: parseFloat(formData.base_amount),
        percentage: parseFloat(formData.percentage),
        amount: parseFloat(formData.amount),
        earned_date: formData.earned_date,
        status: 'pending',
        notes: formData.notes || null,
        created_by: user?.id,
      };

      let error;
      if (editingCommission) {
        const result = await supabase
          .from('salesperson_commissions')
          .update(commissionData)
          .eq('id', editingCommission.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('salesperson_commissions')
          .insert([commissionData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingCommission ? 'Commission updated!' : 'Commission recorded!');
      setIsDialogOpen(false);
      setEditingCommission(null);
      resetForm();
      fetchCommissions();
      fetchStats();
    } catch (error) {
      console.error('Error saving commission:', error);
      toast.error('Failed to save commission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rulePayload = {
        organization_id: profile?.organization_id,
        commission_type: ruleData.commission_type,
        percentage: parseFloat(ruleData.percentage) || 0,
        flat_amount: ruleData.flat_amount ? parseFloat(ruleData.flat_amount) : null,
        min_threshold: ruleData.min_threshold ? parseFloat(ruleData.min_threshold) : null,
        max_cap: ruleData.max_cap ? parseFloat(ruleData.max_cap) : null,
        effective_date: ruleData.effective_date,
        expiry_date: ruleData.expiry_date || null,
        notes: ruleData.notes || null,
        is_active: true,
        created_by: user?.id,
      };

      let error;
      if (editingRule) {
        const result = await supabase
          .from('commission_rules')
          .update(rulePayload)
          .eq('id', editingRule.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('commission_rules')
          .insert([rulePayload]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingRule ? 'Commission rule updated!' : 'Commission rule created!');
      setIsRuleDialogOpen(false);
      setEditingRule(null);
      resetRuleForm();
      fetchRules();
    } catch (error) {
      console.error('Error saving commission rule:', error);
      toast.error('Failed to save commission rule');
    }
  };

  const updateCommissionStatus = async (commissionId: string, status: CommissionRecord['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'paid') {
        updateData.paid_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('salesperson_commissions')
        .update(updateData)
        .eq('id', commissionId);

      if (error) throw error;

      toast.success(`Commission marked as ${status}`);
      fetchCommissions();
      fetchStats();
    } catch (error) {
      console.error('Error updating commission status:', error);
      toast.error('Failed to update commission status');
    }
  };

  const handleEdit = (commission: CommissionRecord) => {
    setEditingCommission(commission);
    setFormData({
      salesperson_id: commission.salesperson_id,
      lead_id: commission.lead_id || '',
      member_id: commission.member_id || '',
      commission_type: commission.commission_type,
      base_amount: commission.base_amount.toString(),
      percentage: commission.percentage.toString(),
      amount: commission.amount.toString(),
      earned_date: commission.earned_date.split('T')[0],
      notes: commission.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule: CommissionRule) => {
    setEditingRule(rule);
    setRuleData({
      commission_type: rule.commission_type,
      percentage: rule.percentage.toString(),
      flat_amount: rule.flat_amount?.toString() || '',
      min_threshold: rule.min_threshold?.toString() || '',
      max_cap: rule.max_cap?.toString() || '',
      effective_date: rule.effective_date.split('T')[0],
      expiry_date: rule.expiry_date?.split('T')[0] || '',
      notes: rule.notes || '',
    });
    setIsRuleDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      salesperson_id: '',
      lead_id: '',
      member_id: '',
      commission_type: 'membership',
      base_amount: '',
      percentage: '',
      amount: '',
      earned_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const resetRuleForm = () => {
    setRuleData({
      commission_type: 'membership',
      percentage: '',
      flat_amount: '',
      min_threshold: '',
      max_cap: '',
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      notes: '',
    });
  };

  const filteredCommissions = commissions.filter(commission => {
    if (filterSalesperson !== 'all' && commission.salesperson_id !== filterSalesperson) return false;
    if (filterStatus !== 'all' && commission.status !== filterStatus) return false;
    if (filterType !== 'all' && commission.commission_type !== filterType) return false;
    return true;
  });

  const totalPendingAmount = filteredCommissions
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaidAmount = filteredCommissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commission Tracking</h2>
          <p className="text-gray-600">Track and manage sales commissions</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                resetRuleForm();
                setEditingRule(null);
              }}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Manage Rules
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Commission Rule' : 'Create Commission Rule'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRuleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commission_type">Commission Type *</Label>
                  <Select
                    value={ruleData.commission_type}
                    onValueChange={(value: CommissionRule['commission_type']) =>
                      setRuleData({ ...ruleData, commission_type: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="membership">Membership Sale</SelectItem>
                      <SelectItem value="upsell">Upsell</SelectItem>
                      <SelectItem value="renewal">Renewal</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="tour_conversion">Tour Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Percentage (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={ruleData.percentage}
                      onChange={(e) => setRuleData({ ...ruleData, percentage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flat_amount">Flat Amount ($)</Label>
                    <Input
                      id="flat_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={ruleData.flat_amount}
                      onChange={(e) => setRuleData({ ...ruleData, flat_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_threshold">Min Threshold ($)</Label>
                    <Input
                      id="min_threshold"
                      type="number"
                      step="0.01"
                      min="0"
                      value={ruleData.min_threshold}
                      onChange={(e) => setRuleData({ ...ruleData, min_threshold: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_cap">Max Cap ($)</Label>
                    <Input
                      id="max_cap"
                      type="number"
                      step="0.01"
                      min="0"
                      value={ruleData.max_cap}
                      onChange={(e) => setRuleData({ ...ruleData, max_cap: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="effective_date">Effective Date *</Label>
                    <Input
                      id="effective_date"
                      type="date"
                      value={ruleData.effective_date}
                      onChange={(e) => setRuleData({ ...ruleData, effective_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={ruleData.expiry_date}
                      onChange={(e) => setRuleData({ ...ruleData, expiry_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={ruleData.notes}
                    onChange={(e) => setRuleData({ ...ruleData, notes: e.target.value })}
                    placeholder="Additional rule details..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsRuleDialogOpen(false);
                      setEditingRule(null);
                      resetRuleForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setEditingCommission(null);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Record Commission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCommission ? 'Edit Commission' : 'Record New Commission'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salesperson_id">Salesperson *</Label>
                  <Select
                    value={formData.salesperson_id}
                    onValueChange={(value) => setFormData({ ...formData, salesperson_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select salesperson" />
                    </SelectTrigger>
                    <SelectContent>
                      {salespeople.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.first_name} {person.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission_type">Type *</Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={(value: CommissionRecord['commission_type']) =>
                      setFormData({ ...formData, commission_type: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="membership">Membership Sale</SelectItem>
                      <SelectItem value="upsell">Upsell</SelectItem>
                      <SelectItem value="renewal">Renewal</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="tour_conversion">Tour Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead_id">Lead</Label>
                  <Select
                    value={formData.lead_id}
                    onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.first_name} {lead.last_name} ({lead.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member_id">Member</Label>
                  <Select
                    value={formData.member_id}
                    onValueChange={(value) => setFormData({ ...formData, member_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_amount">Base Amount ($) *</Label>
                    <Input
                      id="base_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_amount}
                      onChange={(e) => setFormData({ ...formData, base_amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Percentage (%) *</Label>
                    <Input
                      id="percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Commission ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="earned_date">Earned Date *</Label>
                  <Input
                    id="earned_date"
                    type="date"
                    value={formData.earned_date}
                    onChange={(e) => setFormData({ ...formData, earned_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Commission details, context..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingCommission(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {editingCommission ? 'Update Commission' : 'Record Commission'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex space-x-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>
        <Button onClick={() => {
          fetchCommissions();
          fetchStats();
        }}>
          Apply Filter
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(totalPendingAmount + totalPaidAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Salespeople</p>
                <p className="text-2xl font-bold text-gray-900">{stats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Select value={filterSalesperson} onValueChange={setFilterSalesperson}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Salespeople</SelectItem>
            {salespeople.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.first_name} {person.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="membership">Membership</SelectItem>
            <SelectItem value="upsell">Upsell</SelectItem>
            <SelectItem value="renewal">Renewal</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="tour_conversion">Tour Conversion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lead/Member</TableHead>
                <TableHead>Base Amount</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Earned Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {commission.salesperson?.first_name} {commission.salesperson?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{commission.salesperson?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={typeColors[commission.commission_type]}>
                      {commission.commission_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {commission.lead ? (
                      <div>
                        <p className="text-sm">{commission.lead.first_name} {commission.lead.last_name}</p>
                        <p className="text-xs text-gray-500">Lead</p>
                      </div>
                    ) : commission.member ? (
                      <div>
                        <p className="text-sm">{commission.member.first_name} {commission.member.last_name}</p>
                        <p className="text-xs text-gray-500">Member</p>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>${commission.base_amount.toFixed(2)}</TableCell>
                  <TableCell>{commission.percentage}%</TableCell>
                  <TableCell className="font-medium">
                    ${commission.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {new Date(commission.earned_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[commission.status]}>
                      {commission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(commission)}
                        disabled={commission.status === 'paid'}
                      >
                        Edit
                      </Button>
                      {commission.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCommissionStatus(commission.id, 'approved')}
                        >
                          Approve
                        </Button>
                      )}
                      {commission.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCommissionStatus(commission.id, 'paid')}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCommissions.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No commissions found</p>
              <p className="text-sm text-gray-400 mb-4">
                Record your first commission to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Rules */}
      {rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commission Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Flat Amount</TableHead>
                  <TableHead>Min Threshold</TableHead>
                  <TableHead>Max Cap</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Badge className={typeColors[rule.commission_type]}>
                        {rule.commission_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{rule.percentage}%</TableCell>
                    <TableCell>
                      {rule.flat_amount ? `$${rule.flat_amount.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {rule.min_threshold ? `$${rule.min_threshold.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {rule.max_cap ? `$${rule.max_cap.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(rule.effective_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};