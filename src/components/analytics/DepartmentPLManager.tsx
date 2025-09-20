import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, TrendingUp, TrendingDown, DollarSign, Target, Building2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DepartmentRevenueForm from './DepartmentRevenueForm';
import CostAllocationForm from './CostAllocationForm';
import DepartmentBudgetForm from './DepartmentBudgetForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DEPARTMENTS = [
  'Membership',
  'Personal Training',
  'Group Classes',
  'Childcare',
  'Pro Shop',
  'Spa Services',
  'Pool/Aquatics',
  'Court Sports',
  'Cafe/Nutrition',
  'Other'
];

const DepartmentPLManager = () => {
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [showCostForm, setShowCostForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const getPeriodDates = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'current-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return { start: quarterStart, end: new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0) };
      case 'year':
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start: periodStart, end: periodEnd } = getPeriodDates();

  const { data: departmentData, isLoading } = useQuery({
    queryKey: ['department-pl', profile?.organization_id, selectedPeriod, selectedDepartment],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      // Get revenue data
      let revenueQuery = supabase
        .from('department_revenues')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .lte('period_end', periodEnd.toISOString().split('T')[0]);

      if (selectedDepartment !== 'all') {
        revenueQuery = revenueQuery.eq('department_name', selectedDepartment);
      }

      const { data: revenues, error: revenueError } = await revenueQuery;
      if (revenueError) throw revenueError;

      // Get cost allocation data
      let costQuery = supabase
        .from('cost_allocations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .lte('period_end', periodEnd.toISOString().split('T')[0]);

      if (selectedDepartment !== 'all') {
        costQuery = costQuery.eq('department_name', selectedDepartment);
      }

      const { data: costs, error: costError } = await costQuery;
      if (costError) throw costError;

      // Aggregate by department
      const departmentMap = new Map();

      revenues?.forEach(revenue => {
        const dept = revenue.department_name;
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, { 
            name: dept, 
            revenue: 0, 
            costs: 0, 
            transactions: 0,
            revenueItems: [],
            costItems: []
          });
        }
        const current = departmentMap.get(dept);
        current.revenue += Number(revenue.revenue_amount);
        current.transactions += revenue.transaction_count || 0;
        current.revenueItems.push(revenue);
      });

      costs?.forEach(cost => {
        const dept = cost.department_name;
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, { 
            name: dept, 
            revenue: 0, 
            costs: 0, 
            transactions: 0,
            revenueItems: [],
            costItems: []
          });
        }
        const current = departmentMap.get(dept);
        current.costs += Number(cost.allocated_amount);
        current.costItems.push(cost);
      });

      return Array.from(departmentMap.values()).map(dept => ({
        ...dept,
        profit: dept.revenue - dept.costs,
        margin: dept.revenue > 0 ? ((dept.revenue - dept.costs) / dept.revenue) * 100 : 0
      }));
    },
    enabled: !!profile?.organization_id,
  });

  const totalRevenue = departmentData?.reduce((sum, dept) => sum + dept.revenue, 0) || 0;
  const totalCosts = departmentData?.reduce((sum, dept) => sum + dept.costs, 0) || 0;
  const totalProfit = totalRevenue - totalCosts;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  if (isLoading) {
    return <div className="p-6">Loading department P&L data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Dialog open={showRevenueForm} onOpenChange={setShowRevenueForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Revenue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Department Revenue</DialogTitle>
              </DialogHeader>
              <DepartmentRevenueForm
                onSuccess={() => setShowRevenueForm(false)}
                onCancel={() => setShowRevenueForm(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showCostForm} onOpenChange={setShowCostForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Allocate Costs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Allocate Department Costs</DialogTitle>
              </DialogHeader>
              <CostAllocationForm
                onSuccess={() => setShowCostForm(false)}
                onCancel={() => setShowCostForm(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Target className="mr-2 h-4 w-4" />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Set Department Budget</DialogTitle>
              </DialogHeader>
              <DepartmentBudgetForm
                onSuccess={() => setShowBudgetForm(false)}
                onCancel={() => setShowBudgetForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalCosts.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallMargin >= 0 ? 'text-success' : 'text-destructive'}`}>
              {overallMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Profitability</CardTitle>
          <CardDescription>
            Revenue, costs, and profit analysis by department for {format(periodStart, 'MMM dd')} - {format(periodEnd, 'MMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentData?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No P&L data found for the selected period. Add revenue and cost data to get started.
              </div>
            ) : (
              departmentData?.map((dept) => (
                <div key={dept.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{dept.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {dept.transactions} transactions
                        </p>
                      </div>
                    </div>
                    <Badge variant={dept.profit >= 0 ? "default" : "destructive"}>
                      {dept.margin.toFixed(1)}% margin
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="font-medium text-success">${dept.revenue.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Costs</div>
                      <div className="font-medium text-destructive">${dept.costs.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Profit</div>
                      <div className={`font-medium ${dept.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ${dept.profit.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Transaction</div>
                      <div className="font-medium">
                        ${dept.transactions > 0 ? (dept.revenue / dept.transactions).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentPLManager;