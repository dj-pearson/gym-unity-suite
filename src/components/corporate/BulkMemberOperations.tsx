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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { getSemanticStatusColor } from "@/lib/colorUtils";

interface BulkOperation {
  id: string;
  operation_type: string;
  total_members: number;
  processed_members: number;
  failed_members: number;
  status: string;
  created_at: string;
  corporate_account_id?: string;
}

export function BulkMemberOperations() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState("bulk_add");
  const [selectedCorporateAccount, setSelectedCorporateAccount] = useState("");
  const [csvData, setCsvData] = useState("");

  const { data: corporateAccounts } = useQuery({
    queryKey: ['corporate-accounts', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('id, company_name, status')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id
  });

  const { data: bulkOperations, isLoading } = useQuery({
    queryKey: ['bulk-operations', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('bulk_member_operations')
        .select(`
          *,
          corporate_accounts(company_name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id
  });

  const startBulkOperation = useMutation({
    mutationFn: async (operationData: any) => {
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',');
      const memberData = lines.slice(1).map(line => {
        const values = line.split(',');
        const member: any = {};
        headers.forEach((header, index) => {
          member[header.trim()] = values[index]?.trim();
        });
        return member;
      });

      // Create bulk operation record
      const { data: operation, error } = await supabase
        .from('bulk_member_operations')
        .insert({
          organization_id: profile?.organization_id,
          corporate_account_id: selectedCorporateAccount || null,
          operation_type: operationType,
          total_members: memberData.length,
          initiated_by: profile?.id,
          operation_data: { members: memberData },
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Process members (simplified - in production, this would be a background job)
      let processedCount = 0;
      let failedCount = 0;

      for (const member of memberData) {
        try {
          if (operationType === 'bulk_add') {
            // Check if user exists within this organization
            let { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('organization_id', profile?.organization_id)
              .eq('email', member.email)
              .single();

            if (!existingProfile) {
              // Note: In a real implementation, you would create auth users first
              // For this demo, we'll skip actual profile creation
              throw new Error(`Profile not found for email: ${member.email}`);
            }

            // Add to corporate account if specified
            if (selectedCorporateAccount && existingProfile) {
              await supabase
                .from('corporate_members')
                .insert({
                  corporate_account_id: selectedCorporateAccount,
                  member_id: existingProfile.id,
                  employee_id: member.employee_id,
                  department: member.department,
                  job_title: member.job_title
                });
            }
          }
          processedCount++;
        } catch (error) {
          failedCount++;
          console.error('Failed to process member:', member, error);
        }
      }

      // Update operation status
      await supabase
        .from('bulk_member_operations')
        .update({
          processed_members: processedCount,
          failed_members: failedCount,
          status: failedCount === 0 ? 'completed' : 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', operation.id);

      return operation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] });
      toast({
        title: "Success",
        description: "Bulk operation started successfully",
      });
      setIsDialogOpen(false);
      setCsvData("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start bulk operation",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Please provide CSV data",
        variant: "destructive",
      });
      return;
    }
    startBulkOperation.mutate({});
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'bulk_add': return <Users className="h-4 w-4" />;
      case 'bulk_update': return <FileText className="h-4 w-4" />;
      default: return <Upload className="h-4 w-4" />;
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bulk Member Operations</h2>
          <p className="text-muted-foreground">Manage members in bulk</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Start Bulk Operation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Member Operation</DialogTitle>
              <DialogDescription>
                Upload member data via CSV to perform bulk operations
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="operation_type">Operation Type</Label>
                  <Select value={operationType} onValueChange={setOperationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulk_add">Bulk Add Members</SelectItem>
                      <SelectItem value="bulk_update">Bulk Update Members</SelectItem>
                      <SelectItem value="bulk_suspend">Bulk Suspend Members</SelectItem>
                      <SelectItem value="bulk_terminate">Bulk Terminate Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="corporate_account">Corporate Account (Optional)</Label>
                  <Select value={selectedCorporateAccount} onValueChange={setSelectedCorporateAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {corporateAccounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="csv_data">CSV Data</Label>
                <Textarea
                  id="csv_data"
                  placeholder="email,first_name,last_name,phone,employee_id,department,job_title
john@example.com,John,Doe,555-1234,EMP001,IT,Developer
jane@example.com,Jane,Smith,555-5678,EMP002,HR,Manager"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Paste your CSV data here. First line should be headers.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={startBulkOperation.isPending}>
                  {startBulkOperation.isPending ? 'Processing...' : 'Start Operation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Operation History</TabsTrigger>
          <TabsTrigger value="templates">CSV Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {bulkOperations?.map((operation) => (
              <Card key={operation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getOperationIcon(operation.operation_type)}
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {operation.operation_type.replace('_', ' ')}
                        </CardTitle>
                        <CardDescription>
                          {(operation as any).corporate_accounts?.company_name || 'No corporate account'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getSemanticStatusColor(operation.status)}>
                      {operation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{operation.total_members}</div>
                        <div className="text-xs text-muted-foreground">Total Members</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div>
                        <div className="text-sm font-medium">{operation.processed_members}</div>
                        <div className="text-xs text-muted-foreground">Processed</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <div>
                        <div className="text-sm font-medium">{operation.failed_members}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">
                      Started: {new Date(operation.created_at).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSV Templates</CardTitle>
              <CardDescription>Copy these templates for your bulk operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bulk Add Members</Label>
                <Textarea
                  readOnly
                  value="email,first_name,last_name,phone,employee_id,department,job_title
john@example.com,John,Doe,555-1234,EMP001,IT,Developer
jane@example.com,Jane,Smith,555-5678,EMP002,HR,Manager"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Bulk Update Members</Label>
                <Textarea
                  readOnly
                  value="email,department,job_title,employee_id
john@example.com,Engineering,Senior Developer,EMP001
jane@example.com,Human Resources,HR Director,EMP002"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}