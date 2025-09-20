import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const COST_CATEGORIES = [
  'Salaries & Benefits',
  'Utilities',
  'Equipment Maintenance',
  'Marketing & Advertising',
  'Insurance',
  'Rent & Facilities',
  'Supplies & Materials',
  'Professional Services',
  'Technology',
  'Other'
];

const ALLOCATION_BASIS = [
  'Square Footage',
  'Revenue Percentage',
  'Employee Count',
  'Usage Hours',
  'Direct Assignment',
  'Equal Distribution',
  'Custom Formula'
];

const costSchema = z.object({
  department_name: z.string().min(1, 'Department is required'),
  cost_category: z.string().min(1, 'Cost category is required'),
  period_start: z.date({ required_error: 'Start date is required' }),
  period_end: z.date({ required_error: 'End date is required' }),
  allocated_amount: z.string().min(1, 'Allocated amount is required'),
  allocation_basis: z.string().min(1, 'Allocation basis is required'),
  allocation_percentage: z.string().optional(),
  notes: z.string().optional(),
});

type CostFormData = z.infer<typeof costSchema>;

interface CostAllocationFormProps {
  cost?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const CostAllocationForm: React.FC<CostAllocationFormProps> = ({ cost, onSuccess, onCancel }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      department_name: cost?.department_name || '',
      cost_category: cost?.cost_category || '',
      period_start: cost?.period_start ? new Date(cost.period_start) : new Date(),
      period_end: cost?.period_end ? new Date(cost.period_end) : new Date(),
      allocated_amount: cost?.allocated_amount?.toString() || '',
      allocation_basis: cost?.allocation_basis || '',
      allocation_percentage: cost?.allocation_percentage?.toString() || '',
      notes: cost?.notes || '',
    },
  });

  const createCost = useMutation({
    mutationFn: async (data: CostFormData) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const costData = {
        organization_id: profile.organization_id,
        department_name: data.department_name,
        cost_category: data.cost_category,
        period_start: data.period_start.toISOString().split('T')[0],
        period_end: data.period_end.toISOString().split('T')[0],
        allocated_amount: Number(data.allocated_amount),
        allocation_basis: data.allocation_basis,
        allocation_percentage: data.allocation_percentage ? Number(data.allocation_percentage) : null,
        notes: data.notes || null,
        created_by: profile.id,
      };

      if (cost) {
        const { error } = await supabase
          .from('cost_allocations')
          .update(costData)
          .eq('id', cost.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cost_allocations')
          .insert([costData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-pl'] });
      toast.success(cost ? 'Cost allocation updated successfully' : 'Cost allocation added successfully');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Failed to ${cost ? 'update' : 'add'} cost allocation: ${error.message}`);
    },
  });

  const onSubmit = (data: CostFormData) => {
    if (data.period_start > data.period_end) {
      toast.error('End date must be after start date');
      return;
    }
    createCost.mutate(data);
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
            name="cost_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COST_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
            name="allocated_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allocated Amount</FormLabel>
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
            name="allocation_basis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allocation Basis</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select allocation basis" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ALLOCATION_BASIS.map((basis) => (
                      <SelectItem key={basis} value={basis}>
                        {basis}
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
            name="allocation_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allocation Percentage (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes about this cost allocation"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createCost.isPending}>
            {createCost.isPending ? 'Saving...' : (cost ? 'Update Allocation' : 'Add Allocation')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CostAllocationForm;