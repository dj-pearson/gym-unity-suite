import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, Users, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const membershipPlanSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  billing_interval: z.enum(['monthly', 'quarterly', 'yearly']),
  max_classes_per_month: z.coerce.number().nullable().optional(),
  access_level: z.enum(['single_location', 'all_locations']),
});

type MembershipPlanFormData = z.infer<typeof membershipPlanSchema>;

interface MembershipPlanFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<MembershipPlanFormData & { id: string }>;
}

export default function MembershipPlanForm({ onSuccess, onCancel, initialData }: MembershipPlanFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isUnlimitedClasses, setIsUnlimitedClasses] = useState(
    initialData?.max_classes_per_month === null || initialData?.max_classes_per_month === undefined
  );

  const form = useForm<MembershipPlanFormData>({
    resolver: zodResolver(membershipPlanSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      billing_interval: initialData?.billing_interval || 'monthly',
      max_classes_per_month: initialData?.max_classes_per_month || 10,
      access_level: initialData?.access_level || 'single_location',
    },
  });

  const onSubmit = async (data: MembershipPlanFormData) => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      const planData = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        billing_interval: data.billing_interval,
        max_classes_per_month: isUnlimitedClasses ? null : data.max_classes_per_month,
        access_level: data.access_level,
        organization_id: profile.organization_id,
      };

      if (initialData?.id) {
        // Update existing plan
        const { error } = await supabase
          .from('membership_plans')
          .update(planData)
          .eq('id', initialData.id)
          .eq('organization_id', profile.organization_id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Membership plan updated successfully",
        });
      } else {
        // Create new plan
        const { error } = await supabase
          .from('membership_plans')
          .insert(planData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Membership plan created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save membership plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (interval: string) => {
    switch (interval) {
      case 'monthly': return '/month';
      case 'quarterly': return '/quarter';
      case 'yearly': return '/year';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {initialData?.id ? 'Edit Membership Plan' : 'Create Membership Plan'}
        </h2>
        <p className="text-muted-foreground">
          Set up pricing and access levels for gym members
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Plan Details */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Plan Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Basic, Premium, VIP"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-10"
                    {...form.register('price')}
                  />
                </div>
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what's included in this plan..."
                {...form.register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing & Access */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Billing & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing_interval">Billing Interval</Label>
                <Select
                  value={form.watch('billing_interval')}
                  onValueChange={(value) => form.setValue('billing_interval', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.billing_interval && (
                  <p className="text-sm text-destructive">{form.formState.errors.billing_interval.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_level">Access Level</Label>
                <Select
                  value={form.watch('access_level')}
                  onValueChange={(value) => form.setValue('access_level', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_location">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Single Location
                      </div>
                    </SelectItem>
                    <SelectItem value="all_locations">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        All Locations
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.access_level && (
                  <p className="text-sm text-destructive">{form.formState.errors.access_level.message}</p>
                )}
              </div>
            </div>

            {/* Class Limits */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="unlimited_classes">Unlimited Classes</Label>
                <Switch
                  id="unlimited_classes"
                  checked={isUnlimitedClasses}
                  onCheckedChange={setIsUnlimitedClasses}
                />
              </div>
              
              {!isUnlimitedClasses && (
                <div className="space-y-2">
                  <Label htmlFor="max_classes_per_month">Max Classes per Month</Label>
                  <Input
                    id="max_classes_per_month"
                    type="number"
                    min="1"
                    placeholder="10"
                    {...form.register('max_classes_per_month')}
                  />
                  {form.formState.errors.max_classes_per_month && (
                    <p className="text-sm text-destructive">{form.formState.errors.max_classes_per_month.message}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="gym-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Plan Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{form.watch('name') || 'Plan Name'}</span>
                <span className="text-2xl font-bold text-primary">
                  ${form.watch('price') || 0}{formatPrice(form.watch('billing_interval'))}
                </span>
              </div>
              {form.watch('description') && (
                <p className="text-sm text-muted-foreground">{form.watch('description')}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Classes:</span>
                <span className="font-medium">
                  {isUnlimitedClasses ? 'Unlimited' : `${form.watch('max_classes_per_month') || 0}/month`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Access:</span>
                <span className="font-medium capitalize">
                  {form.watch('access_level')?.replace('_', ' ') || 'Single Location'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-gradient-secondary hover:opacity-90">
            {loading ? 'Saving...' : initialData?.id ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
}