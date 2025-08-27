import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().min(4, 'Please select a color'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

const predefinedColors = [
  '#ef4444', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#dc2626', // red-600
  '#ea580c', // orange-600
  '#ca8a04', // yellow-600
];

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: predefinedColors[0],
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, profile?.organization_id]);

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        description: editingCategory.description || '',
        color: editingCategory.color,
      });
      setShowForm(true);
    }
  }, [editingCategory, form]);

  const fetchCategories = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_categories')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      const categoryData = {
        name: data.name,
        description: data.description || null,
        color: data.color,
        organization_id: profile.organization_id,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('class_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('class_categories')
          .insert(categoryData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      form.reset();
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('class_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Manage Class Categories
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showForm ? (
            <>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  Organize your classes with custom categories
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-secondary hover:opacity-90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading categories...</div>
                </div>
              ) : categories.length === 0 ? (
                <Card className="gym-card">
                  <CardContent className="text-center py-12">
                    <Palette className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No categories yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first category to organize classes
                    </p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="bg-gradient-secondary hover:opacity-90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Category
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {categories.map((category) => (
                    <Card key={category.id} className="gym-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: category.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">
                                {category.name}
                              </h4>
                              {category.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {category.description}
                                </p>
                              )}
                            </div>
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: category.color,
                                color: category.color 
                              }}
                            >
                              {category.name}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Yoga, HIIT, Strength"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this category..."
                  {...form.register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label>Category Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        form.watch('color') === color 
                          ? 'border-foreground scale-110 shadow-lg' 
                          : 'border-muted hover:border-muted-foreground hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => form.setValue('color', color)}
                    />
                  ))}
                </div>
                {form.formState.errors.color && (
                  <p className="text-sm text-destructive">{form.formState.errors.color.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-secondary hover:opacity-90"
                >
                  {loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}