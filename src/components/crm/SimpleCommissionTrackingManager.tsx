import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const SimpleCommissionTrackingManager: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [commissionRecords, setCommissionRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissions();
  }, [profile?.organization_id]);

  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('salesperson_commissions')
        .select(`
          *,
          salesperson:profiles!salesperson_id(first_name, last_name, email, role)
        `)
        .eq('organization_id', profile?.organization_id);

      if (error) throw error;
      setCommissionRecords(data || []);
    } catch (error: any) {
      console.error('Error fetching commissions:', error);
      toast({
        title: "Error loading commissions",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalCommissions = commissionRecords.reduce((sum, record) => sum + (record.commission_value || 0), 0);
  const activeCommissions = commissionRecords.filter(record => record.is_active).length;

  if (loading) {
    return <div className="animate-pulse">Loading commission data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Commissions</p>
                <p className="text-2xl font-bold">${totalCommissions.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{activeCommissions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Commission</p>
                <p className="text-2xl font-bold">
                  ${commissionRecords.length > 0 ? (totalCommissions / commissionRecords.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">${totalCommissions.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Rules Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Commission Settings</CardTitle>
            <Button className="flex items-center gap-2" disabled>
              <Plus className="w-4 h-4" />
              Add Commission Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {commissionRecords.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Commission Rules</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up commission rules to track and manage sales team performance.
              </p>
              <Button variant="outline" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Commission Type</TableHead>
                  <TableHead>Commission Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration (Months)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.salesperson?.first_name} {record.salesperson?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.salesperson?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.commission_type}</Badge>
                    </TableCell>
                    <TableCell>
                      ${record.commission_value || 0}
                      {record.revenue_basis && (
                        <div className="text-xs text-muted-foreground">
                          Based on {record.revenue_basis}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.is_active ? 'default' : 'secondary'}>
                        {record.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.duration_months || 'Ongoing'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Commission Features Coming Soon */}
      <Card>
        <CardContent className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Advanced Commission Features</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enhanced commission tracking, automated calculations, and detailed reporting coming soon.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">Automated Calculations</Badge>
            <Badge variant="secondary">Performance Reports</Badge>
            <Badge variant="secondary">Payment Tracking</Badge>
            <Badge variant="secondary">Commission Disputes</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};