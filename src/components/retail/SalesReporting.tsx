import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, ShoppingCart, Users, Download, Receipt } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format, subDays, startOfDay, endOfDay } from 'date-fns';

interface SalesSummary {
  total_transactions: number;
  total_revenue: number;
  total_tax: number;
  average_transaction: number;
  unique_customers: number;
}

interface Transaction {
  id: string;
  transaction_number: string;
  total_amount: number;
  payment_method: string;
  transaction_date: string;
  status: string;
  cashier_name?: string;
  member_name?: string;
  item_count: number;
}

export function SalesReporting() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Fetch sales summary
  const { data: salesSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['sales-summary', dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return null;

      const { data, error } = await supabase
        .from('retail_transactions')
        .select('total_amount, tax_amount, member_id, status')
        .eq('status', 'completed')
        .gte('transaction_date', startOfDay(dateRange.from).toISOString())
        .lte('transaction_date', endOfDay(dateRange.to).toISOString());

      if (error) throw error;

      const summary: SalesSummary = {
        total_transactions: data.length,
        total_revenue: data.reduce((sum, t) => sum + Number(t.total_amount), 0),
        total_tax: data.reduce((sum, t) => sum + Number(t.tax_amount || 0), 0),
        average_transaction: data.length > 0 
          ? data.reduce((sum, t) => sum + Number(t.total_amount), 0) / data.length 
          : 0,
        unique_customers: new Set(data.filter(t => t.member_id).map(t => t.member_id)).size
      };

      return summary;
    }
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['retail-transactions', dateRange, paymentFilter],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return [];

      // Simplified query without complex relationships
      let query = supabase
        .from('retail_transactions')
        .select(`
          *,
          retail_transaction_items(quantity)
        `)
        .eq('status', 'completed')
        .gte('transaction_date', startOfDay(dateRange.from).toISOString())
        .lte('transaction_date', endOfDay(dateRange.to).toISOString())
        .order('transaction_date', { ascending: false });

      if (paymentFilter !== 'all') {
        query = query.eq('payment_method', paymentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(transaction => ({
        ...transaction,
        cashier_name: 'Staff Member', // Simplified for now
        member_name: transaction.member_id ? 'Member' : null,
        item_count: transaction.retail_transaction_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
      })) || [];
    }
  });

  // Fetch top products
  const { data: topProducts } = useQuery({
    queryKey: ['top-products', dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return [];

      const { data, error } = await supabase
        .from('retail_transaction_items')
        .select(`
          quantity,
          line_total,
          retail_products(name, sku),
          retail_transactions!inner(transaction_date, status)
        `)
        .eq('retail_transactions.status', 'completed')
        .gte('retail_transactions.transaction_date', startOfDay(dateRange.from).toISOString())
        .lte('retail_transactions.transaction_date', endOfDay(dateRange.to).toISOString());

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map();
      data?.forEach(item => {
        const productKey = item.retail_products.sku;
        if (productMap.has(productKey)) {
          const existing = productMap.get(productKey);
          existing.total_quantity += item.quantity;
          existing.total_revenue += Number(item.line_total);
        } else {
          productMap.set(productKey, {
            name: item.retail_products.name,
            sku: item.retail_products.sku,
            total_quantity: item.quantity,
            total_revenue: Number(item.line_total)
          });
        }
      });

      // Convert to array and sort by revenue
      return Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);
    }
  });

  const exportData = () => {
    if (!transactions) return;
    
    const csvContent = [
      'Transaction #,Date,Total,Payment Method,Cashier,Member,Items',
      ...transactions.map(t => 
        `${t.transaction_number},${format(new Date(t.transaction_date), 'yyyy-MM-dd HH:mm')},${t.total_amount},${t.payment_method},${t.cashier_name},${t.member_name || 'Walk-in'},${t.item_count}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Reporting</h2>
          <p className="text-muted-foreground">Analyze retail sales performance and trends</p>
        </div>
        <Button onClick={exportData} disabled={!transactions?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="space-y-1">
          <label className="text-sm font-medium">Date Range</label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
            />
            <Input
              type="date"
              value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Payment Method</label>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="text-center py-8">Loading summary...</div>
      ) : salesSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${salesSummary.total_revenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesSummary.total_transactions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${salesSummary.average_transaction.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${salesSummary.total_tax.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesSummary.unique_customers}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.transaction_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.transaction_date), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="font-medium">${Number(transaction.total_amount).toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.payment_method}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={product.sku}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>{product.total_quantity}</TableCell>
                      <TableCell className="font-medium">
                        ${product.total_revenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">Loading top products...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}