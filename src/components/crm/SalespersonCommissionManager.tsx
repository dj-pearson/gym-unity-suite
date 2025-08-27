import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Settings, 
  Users, 
  Plus, 
  Edit,
  Trash2,
  UserCheck,
  TrendingUp,
  Calculator
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SalespersonCommissionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalespersonCommissionManager: React.FC<SalespersonCommissionManagerProps> = ({
  isOpen,
  onClose
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Organization settings
  const [orgSettings, setOrgSettings] = useState({
    default_commission_type: 'percentage',
    default_commission_value: 5,
    default_revenue_basis: 'monthly_recurring',
    default_duration_months: null,
    allow_split_commissions: false,
    max_split_salespeople: 2,
    require_manager_approval_for_attribution: true
  });

  // Salespeople and their commissions
  const [salespeople, setSalespeople] = useState([]);
  const [salespersonCommissions, setSalespersonCommissions] = useState([]);
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [commissionForm, setCommissionForm] = useState({
    salesperson_id: '',
    commission_type: 'percentage',
    commission_value: 5,
    revenue_basis: 'monthly_recurring',
    duration_months: null,
    is_active: true
  });

  useEffect(() => {
    if (isOpen && profile?.organization_id) {
      fetchData();
    }
  }, [isOpen, profile?.organization_id]);

  const fetchData = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    try {
      // Fetch organization settings
      const { data: orgData, error: orgError } = await supabase
        .from('organization_commission_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (orgError && orgError.code !== 'PGRST116') throw orgError;
      
      if (orgData) {
        setOrgSettings(orgData);
      }

      // Fetch salespeople (staff members)
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('organization_id', profile.organization_id)
        .in('role', ['staff', 'manager', 'owner']);

      if (staffError) throw staffError;
      setSalespeople(staffData || []);

      // Fetch salesperson commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('salesperson_commissions')
        .select(`
          *,
          salesperson:salesperson_id(first_name, last_name, email)
        `)
        .eq('organization_id', profile.organization_id);

      if (commissionsError) throw commissionsError;
      setSalespersonCommissions(commissionsData || []);

    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const saveOrgSettings = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organization_commission_settings')
        .upsert({
          organization_id: profile.organization_id,
          ...orgSettings
        });

      if (error) throw error;
      
      toast.success('Organization commission settings saved');
    } catch (error) {
      console.error('Error saving organization settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      const commissionData = {
        ...commissionForm,
        organization_id: profile.organization_id,
        created_by: profile.id,
        duration_months: commissionForm.duration_months || null
      };

      if (editingCommission) {
        const { error } = await supabase
          .from('salesperson_commissions')
          .update(commissionData)
          .eq('id', editingCommission.id);

        if (error) throw error;
        toast.success('Commission updated successfully');
      } else {
        const { error } = await supabase
          .from('salesperson_commissions')
          .insert(commissionData);

        if (error) throw error;
        toast.success('Commission created successfully');
      }

      setShowCommissionForm(false);
      setEditingCommission(null);
      setCommissionForm({
        salesperson_id: '',
        commission_type: 'percentage',
        commission_value: 5,
        revenue_basis: 'monthly_recurring',
        duration_months: null,
        is_active: true
      });
      
      fetchData();
    } catch (error) {
      console.error('Error saving commission:', error);
      toast.error('Failed to save commission');
    } finally {
      setLoading(false);
    }
  };

  const deleteCommission = async (commissionId: string) => {
    if (!confirm('Are you sure you want to delete this commission setting?')) return;

    try {
      const { error } = await supabase
        .from('salesperson_commissions')
        .delete()
        .eq('id', commissionId);

      if (error) throw error;
      
      toast.success('Commission deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting commission:', error);
      toast.error('Failed to delete commission');
    }
  };

  const startEditCommission = (commission: any) => {
    setEditingCommission(commission);
    setCommissionForm({
      salesperson_id: commission.salesperson_id,
      commission_type: commission.commission_type,
      commission_value: commission.commission_value,
      revenue_basis: commission.revenue_basis,
      duration_months: commission.duration_months,
      is_active: commission.is_active
    });
    setShowCommissionForm(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commission Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Organization Settings</TabsTrigger>
            <TabsTrigger value="commissions">Salesperson Commissions</TabsTrigger>
            <TabsTrigger value="calculations">Commission Calculations</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Default Commission Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Commission Type</Label>
                    <Select
                      value={orgSettings.default_commission_type}
                      onValueChange={(value) => setOrgSettings(prev => ({ ...prev, default_commission_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="flat_rate">Flat Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Commission Value</Label>
                    <Input
                      type="number"
                      value={orgSettings.default_commission_value}
                      onChange={(e) => setOrgSettings(prev => ({ ...prev, default_commission_value: parseFloat(e.target.value) }))}
                      placeholder={orgSettings.default_commission_type === 'percentage' ? '5' : '100'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Revenue Basis</Label>
                    <Select
                      value={orgSettings.default_revenue_basis}
                      onValueChange={(value) => setOrgSettings(prev => ({ ...prev, default_revenue_basis: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total_contract">Total Contract Value</SelectItem>
                        <SelectItem value="monthly_recurring">Monthly Recurring</SelectItem>
                        <SelectItem value="first_payment">First Payment Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (months)</Label>
                    <Input
                      type="number"
                      value={orgSettings.default_duration_months || ''}
                      onChange={(e) => setOrgSettings(prev => ({ ...prev, default_duration_months: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="Leave empty for indefinite"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Allow Split Commissions</Label>
                      <p className="text-sm text-muted-foreground">Allow multiple salespeople to share commissions on a single lead</p>
                    </div>
                    <Switch
                      checked={orgSettings.allow_split_commissions}
                      onCheckedChange={(checked) => setOrgSettings(prev => ({ ...prev, allow_split_commissions: checked }))}
                    />
                  </div>

                  {orgSettings.allow_split_commissions && (
                    <div className="space-y-2">
                      <Label>Maximum Split Salespeople</Label>
                      <Input
                        type="number"
                        min="2"
                        max="5"
                        value={orgSettings.max_split_salespeople}
                        onChange={(e) => setOrgSettings(prev => ({ ...prev, max_split_salespeople: parseInt(e.target.value) }))}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Require Manager Approval for Attribution</Label>
                      <p className="text-sm text-muted-foreground">Require manager approval when reassigning lead attribution</p>
                    </div>
                    <Switch
                      checked={orgSettings.require_manager_approval_for_attribution}
                      onCheckedChange={(checked) => setOrgSettings(prev => ({ ...prev, require_manager_approval_for_attribution: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={saveOrgSettings} disabled={loading}>
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Individual Commission Overrides</h3>
              <Button onClick={() => setShowCommissionForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Commission
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salesperson</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Revenue Basis</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salespersonCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {commission.salesperson.first_name} {commission.salesperson.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {commission.salesperson.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {commission.commission_type === 'percentage' 
                            ? `${commission.commission_value}%`
                            : `$${commission.commission_value}`
                          }
                        </TableCell>
                        <TableCell className="capitalize">
                          {commission.revenue_basis.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          {commission.duration_months ? `${commission.duration_months} months` : 'Indefinite'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={commission.is_active ? 'default' : 'secondary'}>
                            {commission.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startEditCommission(commission)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteCommission(commission.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Commission Form Dialog */}
            <Dialog open={showCommissionForm} onOpenChange={setShowCommissionForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCommission ? 'Edit Commission' : 'Add Commission'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCommissionSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Salesperson</Label>
                    <Select
                      value={commissionForm.salesperson_id}
                      onValueChange={(value) => setCommissionForm(prev => ({ ...prev, salesperson_id: value }))}
                      disabled={!!editingCommission}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select salesperson" />
                      </SelectTrigger>
                      <SelectContent>
                        {salespeople.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.first_name} {person.last_name} ({person.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission Type</Label>
                      <Select
                        value={commissionForm.commission_type}
                        onValueChange={(value) => setCommissionForm(prev => ({ ...prev, commission_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="flat_rate">Flat Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Commission Value</Label>
                      <Input
                        type="number"
                        value={commissionForm.commission_value}
                        onChange={(e) => setCommissionForm(prev => ({ ...prev, commission_value: parseFloat(e.target.value) }))}
                        placeholder={commissionForm.commission_type === 'percentage' ? '5' : '100'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Revenue Basis</Label>
                    <Select
                      value={commissionForm.revenue_basis}
                      onValueChange={(value) => setCommissionForm(prev => ({ ...prev, revenue_basis: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total_contract">Total Contract Value</SelectItem>
                        <SelectItem value="monthly_recurring">Monthly Recurring</SelectItem>
                        <SelectItem value="first_payment">First Payment Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (months)</Label>
                    <Input
                      type="number"
                      value={commissionForm.duration_months || ''}
                      onChange={(e) => setCommissionForm(prev => ({ ...prev, duration_months: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="Leave empty for indefinite"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={commissionForm.is_active}
                      onCheckedChange={(checked) => setCommissionForm(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCommissionForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {editingCommission ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="calculations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Commission Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Commission calculations will be automatically generated when leads convert to members.
                  This section will show pending and processed commissions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};