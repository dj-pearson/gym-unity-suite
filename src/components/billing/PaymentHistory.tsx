import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Download, Search, Filter } from 'lucide-react';
import { SectionLoader } from '@/components/ui/section-loader';
import { EmptyState } from '@/components/ui/empty-state';

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  description?: string;
  member_name?: string;
}

export default function PaymentHistory() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as PaymentRecord[];
    },
    enabled: !!profile?.organization_id,
  });

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch = !searchTerm ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.member_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <SectionLoader variant="table" count={5} columns={5} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="mr-2 h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>
          View and download your payment receipts and transaction history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!filteredPayments?.length ? (
          <EmptyState
            icon={Receipt}
            title="No payments found"
            description={searchTerm || statusFilter !== 'all'
              ? "Try adjusting your search or filter criteria."
              : "Payment transactions will appear here as they are processed."}
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.description || 'Payment'}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {payment.payment_method?.replace('_', ' ') || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(payment.amount / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
