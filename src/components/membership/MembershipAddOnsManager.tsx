import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Users,
  Calendar,
  Zap
} from 'lucide-react';

const addOnSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  billing_frequency: z.enum(['one_time', 'monthly', 'weekly', 'per_session']),
  category: z.enum(['training', 'classes', 'amenities', 'nutrition', 'merchandise']),
  is_active: z.boolean(),
  max_uses: z.number().optional(),
  validity_days: z.number().optional(),
});

type AddOnFormData = z.infer<typeof addOnSchema>;

export function MembershipAddOnsManager() {
  const [addOns, setAddOns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<any>(null);
  const { organization } = useAuth();
  const { toast } = useToast();

  const form = useForm<AddOnFormData>({
    resolver: zodResolver(addOnSchema),
    defaultValues: {
      billing_frequency: 'monthly',
      category: 'training',
      is_active: true,
    },
  });

  useEffect(() => {
    fetchAddOns();
  }, [organization?.id]);

  const fetchAddOns = async () => {
    if (!organization?.id) return;

    try {
      setIsLoading(true);
      // Note: This would require a new table 'membership_add_ons' in the database
      // For now, we'll simulate the data structure
      setAddOns([
        {
          id: 'sample-1',
          name: 'Personal Training Session',
          description: 'One-on-one training with certified trainer',
          price: 75.00,
          billing_frequency: 'per_session',
          category: 'training',
          is_active: true,
          max_uses: null,
          validity_days: 90,
        },
        {
          id: 'sample-2',
          name: 'Premium Classes Package',
          description: 'Access to premium group fitness classes',
          price: 29.99,
          billing_frequency: 'monthly',
          category: 'classes',
          is_active: true,
          max_uses: null,
          validity_days: null,
        },
        {
          id: 'sample-3',
          name: 'Towel Service',
          description: 'Fresh towel provided each visit',
          price: 9.99,
          billing_frequency: 'monthly',
          category: 'amenities',
          is_active: true,
          max_uses: null,
          validity_days: null,
        },
      ]);
    } catch (error: any) {
      toast({
        title: 'Error loading add-ons',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: AddOnFormData) => {
    try {
      // In a real implementation, this would create/update in the database
      const newAddOn = {
        id: editingAddOn?.id || `addon-${Date.now()}`,
        ...data,
        organization_id: organization?.id,
        created_at: editingAddOn?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (editingAddOn) {
        setAddOns(prev => prev.map(a => a.id === editingAddOn.id ? newAddOn : a));
        toast({
          title: 'Add-on updated',
          description: 'The membership add-on has been updated successfully.',
        });
      } else {
        setAddOns(prev => [...prev, newAddOn]);
        toast({
          title: 'Add-on created',
          description: 'The new membership add-on has been created.',
        });
      }

      setIsDialogOpen(false);
      setEditingAddOn(null);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error saving add-on',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (addOn: any) => {
    setEditingAddOn(addOn);
    form.reset(addOn);
    setIsDialogOpen(true);
  };

  const handleDelete = async (addOnId: string) => {
    try {
      setAddOns(prev => prev.filter(a => a.id !== addOnId));
      toast({
        title: 'Add-on deleted',
        description: 'The membership add-on has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting add-on',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training': return <Users className="w-4 h-4" />;
      case 'classes': return <Calendar className="w-4 h-4" />;
      case 'amenities': return <Package className="w-4 h-4" />;
      case 'nutrition': return <Zap className="w-4 h-4" />;
      case 'merchandise': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'training': return 'bg-blue-100 text-blue-700';
      case 'classes': return 'bg-purple-100 text-purple-700';
      case 'amenities': return 'bg-green-100 text-green-700';
      case 'nutrition': return 'bg-orange-100 text-orange-700';
      case 'merchandise': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatPrice = (price: number, frequency: string) => {
    const formatted = `$${price.toFixed(2)}`;
    switch (frequency) {
      case 'monthly': return `${formatted}/month`;
      case 'weekly': return `${formatted}/week`;
      case 'per_session': return `${formatted}/session`;
      case 'one_time': return formatted;
      default: return formatted;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-48 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Membership Add-Ons</h2>
          <p className="text-muted-foreground">
            Manage additional services and amenities for your members
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAddOn(null); form.reset(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Add-On
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAddOn ? 'Edit Add-On' : 'Create New Add-On'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...form.register('price', { valueAsNumber: true })}
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select 
                    {...form.register('category')} 
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="training">Personal Training</option>
                    <option value="classes">Premium Classes</option>
                    <option value="amenities">Amenities</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="merchandise">Merchandise</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="billing_frequency">Billing Frequency</Label>
                  <select 
                    {...form.register('billing_frequency')} 
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="one_time">One-time</option>
                    <option value="per_session">Per Session</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_uses">Max Uses (optional)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    {...form.register('max_uses', { valueAsNumber: true })}
                    placeholder="Unlimited if empty"
                  />
                </div>

                <div>
                  <Label htmlFor="validity_days">Validity Days (optional)</Label>
                  <Input
                    id="validity_days"
                    type="number"
                    {...form.register('validity_days', { valueAsNumber: true })}
                    placeholder="No expiry if empty"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={form.watch('is_active')}
                  onCheckedChange={(checked) => form.setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAddOn ? 'Update' : 'Create'} Add-On
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {addOns.map((addOn) => (
          <Card key={addOn.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${getCategoryColor(addOn.category)}`}>
                    {getCategoryIcon(addOn.category)}
                  </div>
                  <CardTitle className="text-lg">{addOn.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(addOn)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(addOn.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {addOn.description && (
                <p className="text-sm text-muted-foreground">
                  {addOn.description}
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">
                  {formatPrice(addOn.price, addOn.billing_frequency)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {addOn.category}
                </Badge>
                <Badge variant={addOn.is_active ? 'default' : 'secondary'}>
                  {addOn.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {addOn.max_uses && (
                  <Badge variant="outline">
                    {addOn.max_uses} uses max
                  </Badge>
                )}
                {addOn.validity_days && (
                  <Badge variant="outline">
                    {addOn.validity_days} days valid
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {addOns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Add-Ons Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first membership add-on to offer additional services to your members.
            </p>
            <Button onClick={() => { setEditingAddOn(null); form.reset(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Add-On
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}