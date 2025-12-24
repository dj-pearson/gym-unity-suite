import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

interface RevenueAnalyticsProps {
  timeRange: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  membershipRevenue: number;
  otherRevenue: number;
  transactions: number;
}

interface RevenueBreakdown {
  name: string;
  value: number;
  color: string;
}

export default function RevenueAnalytics({ timeRange }: RevenueAnalyticsProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgTransactionValue, setAvgTransactionValue] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);

  useEffect(() => {
    fetchRevenueAnalytics();
  }, [profile?.organization_id, timeRange]);

  const fetchRevenueAnalytics = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch transactions - SECURITY: Filter by organization_id for multi-tenant isolation
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('amount, created_at, membership_id')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString())
        .eq('payment_status', 'completed')
        .order('created_at');

      if (!transactions) return;

      // Calculate total revenue and metrics
      const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalRevenue(total);
      setAvgTransactionValue(transactions.length > 0 ? total / transactions.length : 0);

      // Group by date for trend chart
      const dailyRevenue: { [date: string]: RevenueData } = {};
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toLocaleDateString();
        if (!dailyRevenue[date]) {
          dailyRevenue[date] = {
            date,
            revenue: 0,
            membershipRevenue: 0,
            otherRevenue: 0,
            transactions: 0
          };
        }
        
        const amount = Number(transaction.amount);
        dailyRevenue[date].revenue += amount;
        dailyRevenue[date].transactions += 1;
        
        if (transaction.membership_id) {
          dailyRevenue[date].membershipRevenue += amount;
        } else {
          dailyRevenue[date].otherRevenue += amount;
        }
      });

      const chartData = Object.values(dailyRevenue).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setRevenueData(chartData);

      // Calculate revenue breakdown
      const membershipRevenue = transactions
        .filter(t => t.membership_id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const otherRevenue = total - membershipRevenue;

      setRevenueBreakdown([
        { name: 'Membership Fees', value: membershipRevenue, color: '#3b82f6' },
        { name: 'Other Revenue', value: otherRevenue, color: '#10b981' }
      ]);

      // Calculate growth (compare with previous period)
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - parseInt(timeRange));
      
      // SECURITY: Filter by organization_id for multi-tenant isolation
      const { data: prevTransactions } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString())
        .eq('payment_status', 'completed');

      const prevTotal = prevTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
      setRevenueGrowth(growth);

    } catch (error: any) {
      console.error('Error fetching revenue analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading revenue analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className={`text-xs mt-1 flex items-center gap-1 ${
                  revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {revenueGrowth >= 0 && '+'}{revenueGrowth.toFixed(1)}% vs previous period
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${avgTransactionValue.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Avg Transaction</div>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {revenueData.reduce((sum, d) => sum + d.transactions, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Daily revenue breakdown over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="membershipRevenue" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Membership Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="otherRevenue" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Other Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>
              Revenue distribution by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>
              Daily transaction count over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transactions" fill="#8b5cf6" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}