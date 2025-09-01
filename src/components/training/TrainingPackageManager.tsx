import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Package, Plus, Edit, Trash2, DollarSign, Clock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';

interface TrainingPackage {
  id: string;
  name: string;
  description: string;
  session_count: number;
  session_duration_minutes: number;
  price: number;
  expiration_days: number;
  is_active: boolean;
  created_at: string;
}

export default function TrainingPackageManager() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const canManageTraining = permissions.hasRole('owner') || permissions.hasRole('manager') || permissions.hasRole('staff');
  const [packages, setPackages] = useState<TrainingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TrainingPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    session_count: 1,
    session_duration_minutes: 60,
    price: 0,
    expiration_days: 90,
    is_active: true
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('training_packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: "Error",
        description: "Failed to load training packages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      session_count: 1,
      session_duration_minutes: 60,
      price: 0,
      expiration_days: 90,
      is_active: true
    });
    setEditingPackage(null);
  };

  const handleEdit = (pkg: TrainingPackage) => {
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      session_count: pkg.session_count,
      session_duration_minutes: pkg.session_duration_minutes,
      price: pkg.price,
      expiration_days: pkg.expiration_days,
      is_active: pkg.is_active
    });
    setEditingPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageTraining) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage training packages",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim() || formData.price <= 0 || formData.session_count <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (editingPackage) {
        // Update existing package
        const { error } = await supabase
          .from('training_packages')
          .update({
            name: formData.name,
            description: formData.description || null,
            session_count: formData.session_count,
            session_duration_minutes: formData.session_duration_minutes,
            price: formData.price,
            expiration_days: formData.expiration_days,
            is_active: formData.is_active
          })
          .eq('id', editingPackage.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Training package updated successfully"
        });
      } else {
        // Create new package
        const { error } = await supabase
          .from('training_packages')
          .insert({
            organization_id: profile?.organization_id,
            name: formData.name,
            description: formData.description || null,
            session_count: formData.session_count,
            session_duration_minutes: formData.session_duration_minutes,
            price: formData.price,
            expiration_days: formData.expiration_days,
            is_active: formData.is_active
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Training package created successfully"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      toast({
        title: "Error",
        description: "Failed to save training package",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pkg: TrainingPackage) => {
    if (!canManageTraining) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete training packages",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('training_packages')
        .delete()
        .eq('id', pkg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Training package deleted successfully"
      });

      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "Failed to delete training package",
        variant: "destructive"
      });
    }
  };

  const calculatePerSessionPrice = (totalPrice: number, sessionCount: number) => {
    return sessionCount > 0 ? (totalPrice / sessionCount).toFixed(2) : '0.00';
  };

  if (loading && packages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Training Packages</h2>
          <p className="text-muted-foreground">
            Manage training packages and membership options
          </p>
        </div>
        
        {canManageTraining && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPackage ? 'Edit Training Package' : 'Create Training Package'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., 10 Session Package"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Package description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session_count">Session Count *</Label>
                    <Input
                      type="number"
                      id="session_count"
                      value={formData.session_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, session_count: parseInt(e.target.value) || 1 }))}
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Session Duration</Label>
                    <Select
                      value={formData.session_duration_minutes.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, session_duration_minutes: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">120 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        id="price"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="pl-9"
                        min="0"
                        required
                      />
                    </div>
                    {formData.price > 0 && formData.session_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ${calculatePerSessionPrice(formData.price, formData.session_count)} per session
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiration_days">Expires In (Days)</Label>
                    <Input
                      type="number"
                      id="expiration_days"
                      value={formData.expiration_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiration_days: parseInt(e.target.value) || 90 }))}
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active Package</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={!pkg.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {pkg.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {canManageTraining && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pkg)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {pkg.description && (
                <CardDescription>{pkg.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span>{pkg.session_count} sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{pkg.session_duration_minutes} min each</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>${pkg.price.toFixed(2)} total</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{pkg.expiration_days} day expiry</span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Per Session:</span>
                  <span className="font-semibold">
                    ${calculatePerSessionPrice(pkg.price, pkg.session_count)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Training Packages</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first training package to offer structured training programs to members.
            </p>
            {canManageTraining && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}