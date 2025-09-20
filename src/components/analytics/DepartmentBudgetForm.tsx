import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

const budgetSchema = z.object({
  department_name: z.string().min(1, 'Department is required'),
  budget_year: z.string().min(1, 'Budget year is required'),
  budget_month: z.string().optional(),
  revenue_budget: z.string().min(1, 'Revenue budget is required'),
  expense_budget: z.string().min(1, 'Expense budget is required'),
  profit_target: z.string().optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface DepartmentBudgetFormProps {
  budget?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const DepartmentBudgetForm: React.FC<DepartmentBudgetFormProps> = ({ budget, onSuccess, onCancel }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2);
  const months = [
    { value: '', label: 'Annual Budget' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      department_name: budget?.department_name || '',
      budget_year: budget?.budget_year?.toString() || currentYear.toString(),
      budget_month: budget?.budget_month?.toString() || '',
      revenue_budget: budget?.revenue_budget?.toString() || '',
      expense_budget: budget?.expense_budget?.toString() || '',
      profit_target: budget?.profit_target?.toString() || '',
    },
  });

  const createBudget = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const revenueBudget = Number(data.revenue_budget);
      const expenseBudget = Number(data.expense_budget);
      const profitTarget = data.profit_target ? Number(data.profit_target) : revenueBudget - expenseBudget;

      const budgetData = {
        organization_id: profile.organization_id,
        department_name: data.department_name,
        budget_year: Number(data.budget_year),
        budget_month: data.budget_month ? Number(data.budget_month) : null,
        revenue_budget: revenueBudget,
        expense_budget: expenseBudget,
        profit_target: profitTarget,
        created_by: profile.id,
      };

      if (budget) {
        const { error } = await supabase
          .from('department_budgets')
          .update(budgetData)
          .eq('id', budget.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('department_budgets')
          .insert([budgetData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-budgets'] });
      toast.success(budget ? 'Budget updated successfully' : 'Budget created successfully');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to ${budget ? 'update' : 'create'} budget: ${error.message}`);
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    createBudget.mutate(data);
  };

  // Calculate profit target automatically when revenue or expense budget changes
  const watchRevenue = form.watch('revenue_budget');
  const watchExpense = form.watch('expense_budget');

  React.useEffect(() => {
    if (watchRevenue && watchExpense) {
      const revenue = Number(watchRevenue);
      const expense = Number(watchExpense);
      if (!isNaN(revenue) && !isNaN(expense)) {
        form.setValue('profit_target', (revenue - expense).toString());
      }
    }
  }, [watchRevenue, watchExpense, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Year</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget_month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Period</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="revenue_budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revenue Budget</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expense_budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense Budget</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profit_target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profit Target (Auto-calculated)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    readOnly
                    className="bg-muted"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createBudget.isPending}>
            {createBudget.isPending ? 'Saving...' : (budget ? 'Update Budget' : 'Set Budget')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DepartmentBudgetForm;