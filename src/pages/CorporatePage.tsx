import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CorporateAccountManager } from "@/components/corporate/CorporateAccountManager";
import { BulkMemberOperations } from "@/components/corporate/BulkMemberOperations";
import { CorporateInvoiceManager } from "@/components/corporate/CorporateInvoiceManager";
import { Building2, Users, FileText, BarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function CorporatePage() {
  const { profile } = useAuth();

  const { data: corporateStats } = useQuery({
    queryKey: ['corporate-stats', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      
      // Get corporate accounts count
      const { count: accountsCount } = await supabase
        .from('corporate_accounts')
        .select('*', { count: 'exact' })
        .eq('organization_id', profile.organization_id);

      // Get active accounts
      const { count: activeAccountsCount } = await supabase
        .from('corporate_accounts')
        .select('*', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');

      // Get monthly revenue from corporate accounts
      const { data: revenue } = await supabase
        .from('corporate_accounts')
        .select('monthly_rate_per_member, used_member_allocation')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');

      const monthlyRevenue = revenue?.reduce((sum, account) => 
        sum + (account.monthly_rate_per_member * account.used_member_allocation), 0
      ) || 0;

      // Get total corporate members  
      const { data: accountIds } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('organization_id', profile.organization_id);
      
      let totalMembers = 0;
      if (accountIds && accountIds.length > 0) {
        const { count: membersCount } = await supabase
          .from('corporate_members')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .in('corporate_account_id', accountIds.map(a => a.id));
        totalMembers = membersCount || 0;
      }

      return {
        totalAccounts: accountsCount || 0,
        activeAccounts: activeAccountsCount || 0,
        totalMembers,
        monthlyRevenue
      };
    },
    enabled: !!profile?.organization_id
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Corporate Management</h1>
        <p className="text-muted-foreground">
          Manage corporate accounts, bulk operations, and enterprise billing
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corporate Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporateStats?.totalAccounts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {corporateStats?.activeAccounts || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corporate Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporateStats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active corporate memberships
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${corporateStats?.monthlyRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              From corporate accounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Account</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${corporateStats?.activeAccounts ? 
                Math.round((corporateStats.monthlyRevenue / corporateStats.activeAccounts) || 0) : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly revenue per account
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Corporate Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="bulk-operations" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Bulk Operations</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Billing & Invoices</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <CorporateAccountManager />
        </TabsContent>

        <TabsContent value="bulk-operations">
          <BulkMemberOperations />
        </TabsContent>

        <TabsContent value="billing">
          <CorporateInvoiceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}