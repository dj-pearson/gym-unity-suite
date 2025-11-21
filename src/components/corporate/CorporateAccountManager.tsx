import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Users, DollarSign } from "lucide-react";
import { getSemanticStatusColor } from "@/lib/colorUtils";

interface CorporateAccount {
  id: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
  billing_address?: string;
  total_member_allocation: number;
  used_member_allocation: number;
  monthly_rate_per_member: number;
  status: string;
  billing_cycle: string;
  contract_start_date: string;
  contract_end_date?: string;
}

export function CorporateAccountManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);

  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    billing_address: "",
    total_member_allocation: 0,
    monthly_rate_per_member: 0,
    billing_cycle: "monthly",
    status: "active",
    contract_start_date: "",
    contract_end_date: "",
    special_terms: ""
  });

  const { data: corporateAccounts, isLoading } = useQuery({
    queryKey: ['corporate-accounts', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedAccount) {
        const { error } = await supabase
          .from('corporate_accounts')
          .update(data)
          .eq('id', selectedAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('corporate_accounts')
          .insert({ ...data, organization_id: profile?.organization_id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-accounts'] });
      toast({
        title: "Success",
        description: `Corporate account ${selectedAccount ? 'updated' : 'created'} successfully`,
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save corporate account",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setSelectedAccount(null);
    setFormData({
      company_name: "",
      contact_person: "",
      contact_email: "",
      contact_phone: "",
      billing_address: "",
      total_member_allocation: 0,
      monthly_rate_per_member: 0,
      billing_cycle: "monthly",
      status: "active",
      contract_start_date: "",
      contract_end_date: "",
      special_terms: ""
    });
  };

  const handleEdit = (account: CorporateAccount) => {
    setSelectedAccount(account);
    setFormData({
      company_name: account.company_name,
      contact_person: account.contact_person,
      contact_email: account.contact_email,
      contact_phone: account.contact_phone || "",
      billing_address: account.billing_address || "",
      total_member_allocation: account.total_member_allocation,
      monthly_rate_per_member: account.monthly_rate_per_member,
      billing_cycle: account.billing_cycle,
      status: account.status,
      contract_start_date: account.contract_start_date,
      contract_end_date: account.contract_end_date || "",
      special_terms: ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Corporate Accounts</h2>
          <p className="text-muted-foreground">Manage corporate membership accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Corporate Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? 'Edit Corporate Account' : 'Add Corporate Account'}
              </DialogTitle>
              <DialogDescription>
                {selectedAccount ? 'Update corporate account details' : 'Create a new corporate membership account'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="total_member_allocation">Member Allocation</Label>
                  <Input
                    id="total_member_allocation"
                    type="number"
                    value={formData.total_member_allocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_member_allocation: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="monthly_rate_per_member">Rate per Member ($)</Label>
                  <Input
                    id="monthly_rate_per_member"
                    type="number"
                    step="0.01"
                    value={formData.monthly_rate_per_member}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_rate_per_member: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billing_cycle">Billing Cycle</Label>
                  <Select value={formData.billing_cycle} onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contract_start_date">Contract Start Date</Label>
                  <Input
                    id="contract_start_date"
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contract_end_date">Contract End Date</Label>
                  <Input
                    id="contract_end_date"
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="billing_address">Billing Address</Label>
                <Textarea
                  id="billing_address"
                  value={formData.billing_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : (selectedAccount ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {corporateAccounts?.map((account) => (
          <Card key={account.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEdit(account)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    {account.company_name}
                  </CardTitle>
                  <CardDescription>{account.contact_person}</CardDescription>
                </div>
                <Badge className={getSemanticStatusColor(account.status)}>
                  {account.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-1 h-4 w-4" />
                    Members
                  </span>
                  <span className="text-sm font-medium">
                    {account.used_member_allocation}/{account.total_member_allocation}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-muted-foreground">
                    <DollarSign className="mr-1 h-4 w-4" />
                    Rate
                  </span>
                  <span className="text-sm font-medium">
                    ${account.monthly_rate_per_member}/member
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Billing</span>
                  <span className="text-sm font-medium capitalize">{account.billing_cycle}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}