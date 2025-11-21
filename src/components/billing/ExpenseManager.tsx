import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Receipt, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getSemanticStatusColor } from '@/lib/colorUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ExpenseForm from './ExpenseForm';
import VendorManager from './VendorManager';
import ExpenseCategoryManager from './ExpenseCategoryManager';

const ExpenseManager = () => {
  const { profile } = useAuth();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories(name),
          expense_vendors(name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: monthlyTotal } = useQuery({
    queryKey: ['monthly-expenses', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return 0;
      
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', profile.organization_id)
        .gte('expense_date', startOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data?.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) || 0;
    },
    enabled: !!profile?.organization_id,
  });

  if (isLoading) {
    return <div className="p-6">Loading expenses...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyTotal?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenses?.filter(e => e.payment_status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
                </DialogTitle>
              </DialogHeader>
              <ExpenseForm
                expense={selectedExpense}
                onSuccess={() => {
                  setShowExpenseForm(false);
                  setSelectedExpense(null);
                }}
                onCancel={() => {
                  setShowExpenseForm(false);
                  setSelectedExpense(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Manage your business expenses and receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expenses recorded yet. Add your first expense to get started.
                  </div>
                ) : (
                  expenses?.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowExpenseForm(true);
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{expense.description}</h4>
                          <Badge className={getSemanticStatusColor(expense.payment_status)}>
                            {expense.payment_status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {expense.expense_categories?.name} • {expense.expense_vendors?.name || 'No vendor'} • {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${Number(expense.amount).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{expense.payment_method}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <VendorManager />
        </TabsContent>

        <TabsContent value="categories">
          <ExpenseCategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseManager;