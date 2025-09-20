import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MapPin, Users, Clock, DollarSign } from 'lucide-react';

interface SportsCourt {
  id: string;
  court_number: string;
  court_type: string;
  surface_type: string;
  is_indoor: boolean;
  max_players: number;
  hourly_rate: number;
  lighting_available: boolean;
  equipment_included: string[];
  maintenance_notes: string | null;
  is_available: boolean;
  is_out_of_order: boolean;
  location_id: string | null;
}

export function CourtSportsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courts, setCourts] = useState<SportsCourt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<SportsCourt | null>(null);
  const [formData, setFormData] = useState({
    court_number: '',
    court_type: 'tennis',
    surface_type: 'hard',
    is_indoor: false,
    max_players: 4,
    hourly_rate: 25.00,
    lighting_available: true,
    equipment_included: [] as string[],
    maintenance_notes: '',
    is_available: true,
    is_out_of_order: false,
    location_id: null as string | null
  });

  useEffect(() => {
    fetchCourts();
  }, [user]);

  const fetchCourts = async () => {
    if (!user?.user_metadata?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('sports_courts')
        .select('*')
        .eq('organization_id', user.user_metadata.organization_id)
        .order('court_number');

      if (error) throw error;
      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_metadata?.organization_id) return;

    try {
      const courtData = {
        ...formData,
        organization_id: user.user_metadata.organization_id
      };

      if (editingCourt) {
        const { error } = await supabase
          .from('sports_courts')
          .update(courtData)
          .eq('id', editingCourt.id);
        
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Court updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('sports_courts')
          .insert(courtData);
        
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Court created successfully'
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCourts();
    } catch (error) {
      console.error('Error saving court:', error);
      toast({
        title: 'Error',
        description: 'Failed to save court',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this court?')) return;

    try {
      const { error } = await supabase
        .from('sports_courts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Court deleted successfully'
      });

      fetchCourts();
    } catch (error) {
      console.error('Error deleting court:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete court',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      court_number: '',
      court_type: 'tennis',
      surface_type: 'hard',
      is_indoor: false,
      max_players: 4,
      hourly_rate: 25.00,
      lighting_available: true,
      equipment_included: [],
      maintenance_notes: '',
      is_available: true,
      is_out_of_order: false,
      location_id: null
    });
    setEditingCourt(null);
  };

  const openEditDialog = (court: SportsCourt) => {
    setEditingCourt(court);
    setFormData({
      court_number: court.court_number,
      court_type: court.court_type,
      surface_type: court.surface_type,
      is_indoor: court.is_indoor,
      max_players: court.max_players,
      hourly_rate: court.hourly_rate,
      lighting_available: court.lighting_available,
      equipment_included: court.equipment_included,
      maintenance_notes: court.maintenance_notes || '',
      is_available: court.is_available,
      is_out_of_order: court.is_out_of_order,
      location_id: court.location_id
    });
    setIsDialogOpen(true);
  };

  const courtTypes = [
    'tennis', 'pickleball', 'racquetball', 'basketball', 'volleyball', 'badminton', 'squash'
  ];

  const surfaceTypes = [
    'hard', 'clay', 'grass', 'indoor', 'synthetic', 'wood', 'concrete'
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading courts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sports Courts Management</h2>
          <p className="text-muted-foreground">Manage your facility's sports courts and reservations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Court
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourt ? 'Edit Court' : 'Add New Court'}</DialogTitle>
              <DialogDescription>
                {editingCourt ? 'Update court information' : 'Add a new sports court to your facility'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="court_number">Court Number *</Label>
                  <Input
                    id="court_number"
                    value={formData.court_number}
                    onChange={(e) => setFormData({...formData, court_number: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="court_type">Court Type *</Label>
                  <Select value={formData.court_type} onValueChange={(value) => setFormData({...formData, court_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courtTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="surface_type">Surface Type</Label>
                  <Select value={formData.surface_type} onValueChange={(value) => setFormData({...formData, surface_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {surfaceTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_players">Maximum Players</Label>
                  <Input
                    id="max_players"
                    type="number"
                    min="1"
                    value={formData.max_players}
                    onChange={(e) => setFormData({...formData, max_players: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_indoor"
                    checked={formData.is_indoor}
                    onCheckedChange={(checked) => setFormData({...formData, is_indoor: checked})}
                  />
                  <Label htmlFor="is_indoor">Indoor Court</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="lighting_available"
                    checked={formData.lighting_available}
                    onCheckedChange={(checked) => setFormData({...formData, lighting_available: checked})}
                  />
                  <Label htmlFor="lighting_available">Lighting Available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                  />
                  <Label htmlFor="is_available">Available for Booking</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_out_of_order"
                    checked={formData.is_out_of_order}
                    onCheckedChange={(checked) => setFormData({...formData, is_out_of_order: checked})}
                  />
                  <Label htmlFor="is_out_of_order">Out of Order</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
                <Textarea
                  id="maintenance_notes"
                  value={formData.maintenance_notes}
                  onChange={(e) => setFormData({...formData, maintenance_notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCourt ? 'Update Court' : 'Create Court'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map((court) => (
          <Card key={court.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Court {court.court_number}</CardTitle>
                  <CardDescription>
                    {court.court_type.charAt(0).toUpperCase() + court.court_type.slice(1)} • {court.surface_type}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(court)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(court.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={court.is_available ? 'default' : 'secondary'}>
                  {court.is_available ? 'Available' : 'Unavailable'}
                </Badge>
                {court.is_out_of_order && <Badge variant="destructive">Out of Order</Badge>}
                {court.is_indoor && <Badge variant="outline">Indoor</Badge>}
                {court.lighting_available && <Badge variant="outline">Lighting</Badge>}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  Max {court.max_players} players
                </div>
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="w-4 h-4 mr-2" />
                  ${court.hourly_rate}/hour
                </div>
              </div>

              {court.maintenance_notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>Maintenance:</strong> {court.maintenance_notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {courts.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courts Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first sports court to the system.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Court
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}