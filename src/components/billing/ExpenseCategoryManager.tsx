import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Tag, Edit, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface CategoryFormData {
  name: string;
  description: string;
  budget_amount: string;
}

const ExpenseCategoryManager = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const form = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      budget_amount: '',
    },
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['expense-categories', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const createCategory = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const categoryData = {
        organization_id: profile.organization_id,
        name: data.name,
        description: data.description || null,
        budget_amount: data.budget_amount ? parseFloat(data.budget_amount) : null,
      };

      if (selectedCategory) {
        const { error } = await supabase
          .from('expense_categories')
          .update(categoryData)
          .eq('id', selectedCategory.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expense_categories')
          .insert([categoryData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success(selectedCategory ? 'Category updated successfully' : 'Category created successfully');
      setShowCategoryForm(false);
      setSelectedCategory(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(`Failed to ${selectedCategory ? 'update' : 'create'} category: ${error.message}`);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: false })
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success('Category deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate category: ${error.message}`);
    },
  });

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      description: category.description || '',
      budget_amount: category.budget_amount ? category.budget_amount.toString() : '',
    });
    setShowCategoryForm(true);
  };

  const onSubmit = (data: CategoryFormData) => {
    createCategory.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Organize your expenses by category and set budgets</CardDescription>
            </div>
            
            <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedCategory(null);
                  form.reset();
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {selectedCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter category name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter category description" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Budget (Optional)</FormLabel>
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

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setSelectedCategory(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCategory.isPending}>
                        {createCategory.isPending ? 'Saving...' : (selectedCategory ? 'Update Category' : 'Create Category')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No categories found. Add your first category to get started.
              </div>
            ) : (
              categories?.map((category) => (
                <Card key={category.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{category.name}</CardTitle>
                      </div>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {category.description && (
                      <CardDescription className="text-sm">
                        {category.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {category.budget_amount && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <DollarSign className="h-3 w-3" />
                        <span>Budget: ${Number(category.budget_amount).toFixed(2)}/month</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate this category? This action will prevent it from being used in new expenses but won't affect existing records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCategory.mutate(category.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseCategoryManager;