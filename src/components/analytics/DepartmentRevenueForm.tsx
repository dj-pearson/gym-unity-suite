import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

const REVENUE_SOURCES = [
  'Membership Fees',
  'Personal Training Sessions',
  'Group Classes',
  'Day Passes',
  'Product Sales',
  'Services',
  'Events',
  'Rentals',
  'Other'
];

const revenueSchema = z.object({
  department_name: z.string().min(1, 'Department is required'),
  revenue_source: z.string().min(1, 'Revenue source is required'),
  period_start: z.date({ required_error: 'Start date is required' }),
  period_end: z.date({ required_error: 'End date is required' }),
  revenue_amount: z.string().min(1, 'Revenue amount is required'),
  transaction_count: z.string().optional(),
});

type RevenueFormData = z.infer<typeof revenueSchema>;

interface DepartmentRevenueFormProps {
  revenue?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const DepartmentRevenueForm: React.FC<DepartmentRevenueFormProps> = ({ revenue, onSuccess, onCancel }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      department_name: revenue?.department_name || '',
      revenue_source: revenue?.revenue_source || '',
      period_start: revenue?.period_start ? new Date(revenue.period_start) : new Date(),
      period_end: revenue?.period_end ? new Date(revenue.period_end) : new Date(),
      revenue_amount: revenue?.revenue_amount?.toString() || '',
      transaction_count: revenue?.transaction_count?.toString() || '',
    },
  });

  const createRevenue = useMutation({
    mutationFn: async (data: RevenueFormData) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const revenueAmount = Number(data.revenue_amount);
      const transactionCount = data.transaction_count ? Number(data.transaction_count) : 0;

      const revenueData = {
        organization_id: profile.organization_id,
        department_name: data.department_name,
        revenue_source: data.revenue_source,
        period_start: data.period_start.toISOString().split('T')[0],
        period_end: data.period_end.toISOString().split('T')[0],
        revenue_amount: revenueAmount,
        transaction_count: transactionCount,
        average_transaction_value: transactionCount > 0 ? revenueAmount / transactionCount : 0,
        created_by: profile.id,
      };

      if (revenue) {
        const { error } = await supabase
          .from('department_revenues')
          .update(revenueData)
          .eq('id', revenue.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('department_revenues')
          .insert([revenueData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-pl'] });
      toast.success(revenue ? 'Revenue updated successfully' : 'Revenue added successfully');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to ${revenue ? 'update' : 'add'} revenue: ${error.message}`);
    },
  });

  const onSubmit = (data: RevenueFormData) => {
    if (data.period_start > data.period_end) {
      toast.error('End date must be after start date');
      return;
    }
    createRevenue.mutate(data);
  };

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
            name="revenue_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revenue Source</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select revenue source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REVENUE_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
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
            name="period_start"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Period Start</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick start date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period_end"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Period End</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick end date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="revenue_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revenue Amount</FormLabel>
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
            name="transaction_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Count (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Number of transactions"
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
          <Button type="submit" disabled={createRevenue.isPending}>
            {createRevenue.isPending ? 'Saving...' : (revenue ? 'Update Revenue' : 'Add Revenue')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DepartmentRevenueForm;